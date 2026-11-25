require "test_helper"

class AdminUsersTest < ActionDispatch::IntegrationTest
  HEADERS = { "X-Requested-With" => "XMLHttpRequest" }.freeze
  ADMIN_PASSWORD = "admin-password-123"

  setup do
    @admin = AdminUser.create!(email_address: "ops@example.com", name: "運営A", password: ADMIN_PASSWORD,
                               personal_info_access: true, user_management_access: true)
    @viewer = AdminUser.create!(email_address: "viewer@example.com", name: "運営B", password: ADMIN_PASSWORD)
    @user = users(:one)
  end

  test "admin APIs reject requests without an operator login, including logged-in users" do
    get "/api/admin/users"
    assert_response :unauthorized

    post "/api/session", params: { email_address: @user.email_address, password: "password" }, headers: HEADERS, as: :json
    assert_response :created
    get "/api/admin/users"
    assert_response :unauthorized
    post "/api/admin/users/#{@user.id}/suspension", params: { user_reason: "x" }, headers: HEADERS, as: :json
    assert_response :unauthorized
  end

  test "suspend / unsuspend need the user management permission" do
    login_admin(@viewer)
    get "/api/admin/users/#{@user.id}"
    assert_response :ok
    assert_equal false, response.parsed_body.dig("user", "can_manage")

    post "/api/admin/users/#{@user.id}/suspension", params: { user_reason: "x" }, headers: HEADERS, as: :json
    assert_response :forbidden
    assert_not @user.reload.suspended?

    @user.account_suspensions.create!(suspended_by: @admin, user_reason: "x", starts_at: Time.current)
    delete "/api/admin/users/#{@user.id}/suspension", params: { reason: "x" }, headers: HEADERS, as: :json
    assert_response :forbidden
    assert @user.reload.suspended?
  end

  test "suspension email has the user reason, period and contact, but not the internal note" do
    login_admin(@admin)
    with_env("SUPPORT_CONTACT" => "support@program-fitness.example") do
      assert_enqueued_emails 1 do
        post "/api/admin/users/#{@user.id}/suspension", headers: HEADERS, as: :json,
             params: { user_reason: "利用規約第5条に違反する投稿", internal_note: "通報3件・要監視",
                       ends_at: 7.days.from_now.iso8601 }
      end
      assert_response :created
      mail = AccountMailer.account_suspended(@user, @user.account_suspensions.first).deliver_now
      body = mail.text_part.decoded
      assert_includes body, "利用規約第5条に違反する投稿"
      assert_includes body, "support@program-fitness.example"
      assert_includes body, "期限："
      assert_not_includes body, "通報3件"
      assert_not_includes mail.html_part.decoded, "通報3件"
    end
  end

  test "suspended users cannot finish a password reset or verify their email" do
    reset_token = @user.generate_token_for(:password_reset)
    verify_token = @user.generate_token_for(:email_verification)
    @user.account_suspensions.create!(suspended_by: @admin, user_reason: "x", starts_at: Time.current)

    patch "/api/password_reset", params: { token: reset_token, password: "newpassword1", password_confirmation: "newpassword1" },
                                 headers: HEADERS, as: :json
    assert_response :forbidden
    assert @user.reload.authenticate("password"), "password must not change"

    post "/api/email_verification", params: { token: verify_token }, headers: HEADERS, as: :json
    assert_response :forbidden
    assert_not @user.reload.email_verified?

    assert_no_enqueued_emails do
      post "/api/password_reset", params: { email_address: @user.email_address }, headers: HEADERS, as: :json
    end
    assert_response :ok
  end

  test "sign-up cannot create an operator" do
    assert_no_difference -> { AdminUser.count } do
      post "/api/registration", headers: HEADERS, as: :json, params: {
        user: { email_address: "new@example.com", password: "password123", password_confirmation: "password123",
                birth_date: "1990-01-01", training_started_on: "2015-01-01", admin: true, personal_info_access: true }
      }
    end
    assert_response :created
    get "/api/admin/users"
    assert_response :unauthorized
  end

  test "personal information is hidden from operators without permission" do
    login_admin(@viewer)
    get "/api/admin/users/#{@user.id}"
    assert_response :ok
    body = response.parsed_body["user"]
    assert_nil body["email_address"]
    assert_nil body["birth_date"]
    assert_nil body["password_digest"]
    assert_equal false, body["personal_info_visible"]

    get "/api/admin/users", params: { q: "one@example.com" }
    assert_equal 0, response.parsed_body["total"], "email search needs personal info access"
  end

  test "suspend blocks login and existing sessions, unsuspend restores, both are recorded" do
    user_session = open_session
    user_session.post "/api/session", params: { email_address: @user.email_address, password: "password" },
                                      headers: HEADERS, as: :json
    user_session.get "/api/profile"
    assert_equal 200, user_session.response.status

    login_admin(@admin)
    post "/api/admin/users/#{@user.id}/suspension", params: { user_reason: "規約違反", internal_note: "内部メモ" },
                                                    headers: HEADERS, as: :json
    assert_response :created
    assert @user.reload.suspended?

    user_session.get "/api/profile"
    assert_equal 401, user_session.response.status, "sessions are destroyed when suspended"

    user_session.post "/api/session", params: { email_address: @user.email_address, password: "password" },
                                      headers: HEADERS, as: :json
    assert_equal 403, user_session.response.status
    assert_equal "account_suspended", user_session.response.parsed_body["code"]

    get "/api/admin/dashboard"
    assert_equal 1, response.parsed_body.dig("users", "suspended")

    delete "/api/admin/users/#{@user.id}/suspension", params: { reason: "異議申し立てを確認" }, headers: HEADERS, as: :json
    assert_response :ok
    assert_not @user.reload.suspended?

    user_session.post "/api/session", params: { email_address: @user.email_address, password: "password" },
                                      headers: HEADERS, as: :json
    assert_equal 201, user_session.response.status

    s = @user.account_suspensions.first
    assert_equal [ @admin, "規約違反", "内部メモ", @admin, "異議申し立てを確認" ],
                 [ s.suspended_by, s.user_reason, s.internal_note, s.lifted_by, s.lift_reason ]
    assert_equal %w[admin_login suspend_user unsuspend_user],
                 AdminAuditLog.where(admin_user: @admin).order(:id).pluck(:action)
  end

  test "suspension requires a reason and a future end time" do
    login_admin(@admin)
    post "/api/admin/users/#{@user.id}/suspension", params: { user_reason: "", internal_note: "memo only" },
                                                    headers: HEADERS, as: :json
    assert_response :unprocessable_content
    assert response.parsed_body.dig("errors", "user_reason").present?
    post "/api/admin/users/#{@user.id}/suspension", params: { user_reason: "x", ends_at: 1.day.ago.iso8601 },
                                                    headers: HEADERS, as: :json
    assert_response :unprocessable_content
    assert_not @user.reload.suspended?
  end

  test "suspension with an end time stops applying after it passes" do
    login_admin(@admin)
    post "/api/admin/users/#{@user.id}/suspension", params: { user_reason: "一時停止", ends_at: 2.days.from_now.iso8601 },
                                                    headers: HEADERS, as: :json
    assert @user.reload.suspended?
    travel 3.days do
      assert_not @user.reload.suspended?
    end
  end

  test "disabled operators cannot log in" do
    @viewer.update!(disabled_at: Time.current)
    post "/api/admin/session", params: { email_address: @viewer.email_address, password: ADMIN_PASSWORD },
                               headers: HEADERS, as: :json
    assert_response :unauthorized
  end

  private
    def with_env(vars)
      old = vars.keys.to_h { |k| [ k, ENV[k] ] }
      vars.each { |k, v| ENV[k] = v }
      yield
    ensure
      old.each { |k, v| ENV[k] = v }
    end

    def login_admin(admin)
      post "/api/admin/session", params: { email_address: admin.email_address, password: ADMIN_PASSWORD },
                                 headers: HEADERS, as: :json
      assert_response :created
    end
end
