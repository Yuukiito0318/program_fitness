# Cookie-based login for operators (admin screens). Independent from the user login:
# - different table (admin_sessions) and different signed cookie (admin_session_id)
# - a user's session cookie can never authenticate an operator, and vice versa
module AdminAuthentication
  extend ActiveSupport::Concern

  ADMIN_SESSION_COOKIE = :admin_session_id

  included do
    before_action :require_admin
  end

  class_methods do
    def allow_unauthenticated_admin_access(**options)
      skip_before_action :require_admin, **options
    end
  end

  private
    def current_admin
      Current.admin_session&.admin_user
    end

    def require_admin
      return if resume_admin_session

      render json: { error: "運営者としてのログインが必要です。" }, status: :unauthorized
    end

    def resume_admin_session
      Current.admin_session ||= find_admin_session_by_cookie
    end

    def find_admin_session_by_cookie
      id = cookies.signed[ADMIN_SESSION_COOKIE]
      return unless id

      session = AdminSession.active.includes(:admin_user).find_by(id: id)
      session if session&.admin_user&.enabled?
    end

    def start_admin_session_for(admin)
      cookies.delete(ADMIN_SESSION_COOKIE)
      admin.admin_sessions.create!(user_agent: request.user_agent.to_s.first(255), ip_address: request.remote_ip).tap do |s|
        Current.admin_session = s
        cookies.signed[ADMIN_SESSION_COOKIE] = {
          value: s.id,
          expires: AdminSession::LIFETIME.from_now,
          httponly: true,
          same_site: :strict,
          secure: Rails.env.production?
        }
      end
    end

    def terminate_admin_session
      Current.admin_session&.destroy
      Current.admin_session = nil
      cookies.delete(ADMIN_SESSION_COOKIE)
    end

    # Spec (操作履歴): who did what to which data, when.
    def audit!(action, target = nil, metadata = {})
      AdminAuditLog.record!(admin: current_admin, action: action, target: target,
                            metadata: metadata, ip_address: request.remote_ip)
    end
end
