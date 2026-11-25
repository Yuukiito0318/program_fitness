# Base class for every admin API (/api/admin/*).
# The user login check is replaced by the operator login check, which runs before every action
# (permissions are enforced here on the server, not only by hiding screens).
module Api
  module Admin
    class BaseController < ApplicationController
      allow_unauthenticated_access # no user login needed...
      include AdminAuthentication  # ...but an operator login is required (before_action :require_admin)

      private
        def require_personal_info_access!
          return if current_admin.personal_info_access?

          render json: { error: "個人情報を閲覧する権限がありません。" }, status: :forbidden
        end

        # Create / edit / publish / unpublish news.
        def require_news_management_access!
          return if current_admin.news_management_access?

          render json: { error: "ニュースを管理する権限がありません。" }, status: :forbidden
        end

        # Normal operations on user accounts (suspend / unsuspend).
        def require_user_management_access!
          return if current_admin.user_management_access?

          render json: { error: "ユーザーの停止・解除を行う権限がありません。" }, status: :forbidden
        end
    end
  end
end
