# POST  /api/password_reset  再設定メールの送信を依頼（メールアドレスを送る）
# PATCH /api/password_reset  メール内リンクのトークンで新しいパスワードを設定
#
# The token is sent in the request body (not the URL path) so it does not end up in access logs.
module Api
  class PasswordResetsController < ApplicationController
    allow_unauthenticated_access
    rate_limit to: 5, within: 15.minutes, only: :create, with: -> { render_rate_limited }
    rate_limit to: 10, within: 15.minutes, only: :update, with: -> { render_rate_limited }

    def create
      user = User.find_by(email_address: params[:email_address].to_s.strip.downcase)
      # Suspended accounts cannot use member features: no reset email (the response stays the same).
      AccountMailer.password_reset(user).deliver_later if user && !user.suspended?

      # Same response whether or not the address is registered (no account probing).
      render json: { message: "登録済みのメールアドレスの場合、パスワード再設定の案内を送信しました。" }
    end

    def update
      user = User.find_by_token_for(:password_reset, params[:token].to_s)
      unless user
        return render json: { error: "再設定リンクが無効か、有効期限が切れています。" }, status: :unprocessable_content
      end
      if user.suspended?
        return render json: { error: ACCOUNT_SUSPENDED_MESSAGE, code: "account_suspended" }, status: :forbidden
      end

      if params[:password].blank?
        user.errors.add(:password, :blank)
        return render_validation_errors(user)
      end

      # to_s: a missing confirmation must fail the check instead of skipping it.
      if user.update(password: params[:password], password_confirmation: params[:password_confirmation].to_s)
        # Log out every device that was logged in with the old password.
        user.sessions.destroy_all
        render json: { message: "パスワードを再設定しました。新しいパスワードでログインしてください。" }
      else
        render_validation_errors(user)
      end
    end
  end
end
