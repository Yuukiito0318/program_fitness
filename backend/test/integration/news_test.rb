require "test_helper"

class NewsTest < ActionDispatch::IntegrationTest
  HEADERS = { "X-Requested-With" => "XMLHttpRequest" }.freeze
  PASSWORD = "admin-password-123"

  setup do
    @admin = AdminUser.create!(email_address: "news-ops@example.com", name: "運営N", password: PASSWORD,
                               news_management_access: true)
    @viewer = AdminUser.create!(email_address: "news-viewer@example.com", name: "運営V", password: PASSWORD)
    @draft = NewsArticle.create!(title: "下書きニュース", body: "非公開の本文", category: "training",
                                 created_by: @admin, updated_by: @admin)
    @published = NewsArticle.create!(title: "公開ニュース", body: "公開の本文", category: "competition",
                                     created_by: @admin, updated_by: @admin)
    @published.publish!(@admin)
  end

  test "public API returns only published news; drafts are 404" do
    get "/api/news"
    assert_response :ok
    titles = response.parsed_body["articles"].map { |a| a["title"] }
    assert_equal [ "公開ニュース" ], titles
    assert_not_includes response.body, "非公開の本文"

    get "/api/news/#{@draft.id}"
    assert_response :not_found
    assert_not_includes response.body, "非公開の本文"

    get "/api/news/#{@published.id}"
    assert_response :ok
    assert_equal "公開の本文", response.parsed_body.dig("article", "body")
    assert_nil response.parsed_body.dig("article", "created_by"), "operator names are not exposed"
  end

  test "admin news APIs require an operator login, also for logged-in users" do
    get "/api/admin/news"
    assert_response :unauthorized
    post "/api/session", params: { email_address: users(:one).email_address, password: "password" }, headers: HEADERS, as: :json
    assert_response :created
    post "/api/admin/news", params: { article: { title: "x", body: "x", category: "training" } }, headers: HEADERS, as: :json
    assert_response :unauthorized
    patch "/api/admin/news/#{@published.id}", params: { article: { title: "hacked" } }, headers: HEADERS, as: :json
    assert_response :unauthorized
    post "/api/admin/news/#{@draft.id}/publication", headers: HEADERS, as: :json
    assert_response :unauthorized
    assert @draft.reload.draft?
    assert_equal "公開ニュース", @published.reload.title
  end

  test "operator creates, edits, publishes and unpublishes; users see the current state" do
    login_admin
    post "/api/admin/news", params: { article: { title: "", body: "", category: "other" } }, headers: HEADERS, as: :json
    assert_response :unprocessable_content
    assert_equal %w[body category title], response.parsed_body["errors"].keys.sort

    post "/api/admin/news", params: { article: { title: "大会のお知らせ", body: "本文", category: "competition" } },
                            headers: HEADERS, as: :json
    assert_response :created
    id = response.parsed_body.dig("article", "id")
    assert_equal "draft", response.parsed_body.dig("article", "status")
    get "/api/news/#{id}"
    assert_response :not_found, "new articles are not public until published"

    post "/api/admin/news/#{id}/publication", headers: HEADERS, as: :json
    assert_response :ok
    first_published_at = NewsArticle.find(id).published_at
    get "/api/news/#{id}"
    assert_response :ok

    patch "/api/admin/news/#{id}", params: { article: { title: "大会のお知らせ（日程変更）" } }, headers: HEADERS, as: :json
    assert_response :ok
    get "/api/news/#{id}"
    assert_equal "大会のお知らせ（日程変更）", response.parsed_body.dig("article", "title")

    delete "/api/admin/news/#{id}/publication", headers: HEADERS, as: :json
    assert_response :ok
    get "/api/news/#{id}"
    assert_response :not_found
    get "/api/news"
    assert_not_includes response.parsed_body["articles"].map { |a| a["id"] }, id

    travel 1.hour do
      post "/api/admin/news/#{id}/publication", headers: HEADERS, as: :json
      assert_equal first_published_at.to_i, NewsArticle.find(id).published_at.to_i, "re-publishing keeps the first date"
    end

    assert_equal %w[admin_login create_news publish_news update_news unpublish_news publish_news],
                 AdminAuditLog.where(admin_user: @admin).order(:id).pluck(:action)
  end

  test "operators without the news permission can view but not change news" do
    login_admin(@viewer)
    get "/api/admin/news"
    assert_response :ok
    get "/api/admin/news/#{@draft.id}"
    assert_response :ok
    assert_equal false, response.parsed_body.dig("article", "can_manage")

    post "/api/admin/news", params: { article: { title: "x", body: "x", category: "training" } }, headers: HEADERS, as: :json
    assert_response :forbidden
    patch "/api/admin/news/#{@published.id}", params: { article: { title: "changed" } }, headers: HEADERS, as: :json
    assert_response :forbidden
    post "/api/admin/news/#{@draft.id}/publication", headers: HEADERS, as: :json
    assert_response :forbidden
    delete "/api/admin/news/#{@published.id}/publication", headers: HEADERS, as: :json
    assert_response :forbidden

    assert @draft.reload.draft?
    assert @published.reload.published?
    assert_equal "公開ニュース", @published.title
    assert_equal 2, NewsArticle.count, "no article was created"
  end

  test "update date is shown only when the content is edited after publishing" do
    get "/api/news/#{@published.id}"
    assert_nil response.parsed_body.dig("article", "updated_at"), "not edited yet"

    login_admin
    # Unpublish / re-publish alone is not an edit.
    delete "/api/admin/news/#{@published.id}/publication", headers: HEADERS, as: :json
    post "/api/admin/news/#{@published.id}/publication", headers: HEADERS, as: :json
    get "/api/news/#{@published.id}"
    assert_nil response.parsed_body.dig("article", "updated_at")

    # Editing a draft that was never published does not set it either.
    patch "/api/admin/news/#{@draft.id}", params: { article: { body: "下書きを修正" } }, headers: HEADERS, as: :json
    assert_nil @draft.reload.content_updated_at

    travel 1.hour do # (within the 12-hour operator login)
      patch "/api/admin/news/#{@published.id}", params: { article: { body: "訂正した本文" } }, headers: HEADERS, as: :json
      assert_response :ok
      get "/api/news/#{@published.id}"
      updated_at = Time.zone.parse(response.parsed_body.dig("article", "updated_at"))
      published_at = Time.zone.parse(response.parsed_body.dig("article", "published_at"))
      assert updated_at > published_at
      get "/api/news"
      assert response.parsed_body["articles"].first["updated_at"].present?
    end
  end

  test "public list filters by category and month" do
    get "/api/news", params: { category: "training" }
    assert_equal 0, response.parsed_body["total"]
    get "/api/news", params: { category: "competition", month: Time.current.strftime("%Y-%m") }
    assert_equal 1, response.parsed_body["total"]
    get "/api/news", params: { month: "2000-01" }
    assert_equal 0, response.parsed_body["total"]
  end

  private
    def login_admin(admin = @admin)
      post "/api/admin/session", params: { email_address: admin.email_address, password: PASSWORD }, headers: HEADERS, as: :json
      assert_response :created
    end
end
