# PATCH /api/password  ログイン中のパスワード変更
# Spec: 現在のパスワード確認後に変更でき、変更を登録メールアドレスへ通知する。
module Api
  class PasswordsController < ApplicationController
    rate_limit to: 10, within: 15.minutes, only: :update, with: -> { render_rate_limited }

    def update
      user = current_user

      if params[:password].blank?
        user.errors.add(:password, :blank)
        return render_password_errors(user)
      end

      # password_challenge (built into has_secure_password) checks the current password.
      # to_s: a missing value must fail the check instead of skipping it.
      if user.update(password_challenge: params[:current_password].to_s,
                     password: params[:password],
                     password_confirmation: params[:password_confirmation].to_s)
        # Keep this device logged in; log out all other devices.
        user.sessions.where.not(id: Current.session.id).destroy_all
        AccountMailer.password_changed(user).deliver_later
        render json: { message: "パスワードを変更しました。" }
      else
        render_password_errors(user)
      end
    ensure
      user&.password_challenge = nil
    end

    private
      # The frontend form field is named current_password.
      def render_password_errors(user)
        errors = user.errors.to_hash(true)
        errors["current_password"] = errors.delete(:password_challenge) if errors.key?(:password_challenge)
        render json: { errors: errors }, status: :unprocessable_content
      end
  end
end
