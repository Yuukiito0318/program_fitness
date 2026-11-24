# Cookie-based login sessions for the JSON API.
#
# - The browser holds only a signed, HttpOnly cookie with the Session id
#   (JavaScript cannot read it, so XSS cannot steal it).
# - Sessions are stored in the database, so logout and "log out other devices" work server-side.
module Authentication
  extend ActiveSupport::Concern

  SESSION_COOKIE = :session_id

  included do
    before_action :require_authentication
  end

  class_methods do
    def allow_unauthenticated_access(**options)
      skip_before_action :require_authentication, **options
    end
  end

  private
    def authenticated?
      resume_session.present?
    end

    def current_user
      Current.user
    end

    def require_authentication
      resume_session || render_unauthenticated
    end

    def resume_session
      Current.session ||= find_session_by_cookie
    end

    def find_session_by_cookie
      session_id = cookies.signed[SESSION_COOKIE]
      return unless session_id

      Session.active.includes(:user).find_by(id: session_id)
    end

    def render_unauthenticated
      render json: { error: "ログインが必要です。" }, status: :unauthorized
    end

    def start_new_session_for(user)
      reset_session_cookie
      user.sessions.create!(user_agent: request.user_agent.to_s.first(255), ip_address: request.remote_ip).tap do |session|
        Current.session = session
        cookies.signed[SESSION_COOKIE] = {
          value: session.id,
          expires: Session::LIFETIME.from_now,
          httponly: true,
          same_site: :lax,
          secure: Rails.env.production?
        }
      end
    end

    def terminate_session
      Current.session&.destroy
      Current.session = nil
      reset_session_cookie
    end

    def reset_session_cookie
      cookies.delete(SESSION_COOKIE)
    end
end
