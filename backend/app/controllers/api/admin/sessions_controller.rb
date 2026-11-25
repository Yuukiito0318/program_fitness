# GET    /api/admin/session  ログイン中の運営者
# POST   /api/admin/session  運営者ログイン（運営者アカウントは rails admin:create でのみ作成）
# DELETE /api/admin/session  運営者ログアウト
module Api
  module Admin
    class SessionsController < BaseController
      allow_unauthenticated_admin_access only: :create
      rate_limit to: 5, within: 5.minutes, only: :create, with: -> { render_rate_limited }

      def show
        render json: { admin: admin_json(current_admin) }
      end

      def create
        admin = AdminUser.authenticate_by(email_address: params[:email_address].to_s, password: params[:password].to_s)

        if admin&.enabled?
          start_admin_session_for(admin)
          admin.update_column(:last_login_at, Time.current)
          audit!("admin_login")
          render json: { admin: admin_json(admin) }, status: :created
        else
          # Same message for unknown email, wrong password, and disabled operator.
          render json: { error: "メールアドレスまたはパスワードが正しくありません。" }, status: :unauthorized
        end
      end

      def destroy
        terminate_admin_session
        head :no_content
      end

      private
        def admin_json(admin)
          { id: admin.id, name: admin.name, email_address: admin.email_address,
            personal_info_access: admin.personal_info_access,
            user_management_access: admin.user_management_access,
            news_management_access: admin.news_management_access }
        end
    end
  end
end
