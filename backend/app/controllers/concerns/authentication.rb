# Cookie-based login sessions for the JSON API.
#
# - The browser holds only a signed, HttpOnly cookie with the Session id
#   (JavaScript cannot read it, so XSS cannot steal it).
# - Sessions are stored in the database, so logout and "log out other devices" work server-side.
module Authentication
  extend ActiveSupport::Concern

  SESSION_COOKIE = :session_id
  ACCOUNT_SUSPENDED_MESSAGE = "このアカウントは利用停止中です。詳しくは登録メールアドレス宛のお知らせをご確認ください。"

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

      session = Session.active.includes(:user).find_by(id: session_id)
      # A suspended user cannot use the service: drop the session on every request.
      if session&.user&.suspended?
        session.destroy
        reset_session_cookie
        @account_suspended = true
        return nil
      end
      session
    end

    def render_unauthenticated
      if @account_suspended
        render json: { error: ACCOUNT_SUSPENDED_MESSAGE, code: "account_suspended" }, status: :forbidden
      else
        render json: { error: "ログインが必要です。" }, status: :unauthorized
      end
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
