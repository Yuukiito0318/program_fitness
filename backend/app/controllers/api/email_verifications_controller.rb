# POST /api/email_verification         確認リンクのトークンでメールアドレスを確認
# POST /api/email_verification/resend  確認メールを再送（ログイン中のみ）
module Api
  class EmailVerificationsController < ApplicationController
    allow_unauthenticated_access only: :create
    rate_limit to: 10, within: 10.minutes, only: :create, with: -> { render_rate_limited }
    rate_limit to: 3, within: 10.minutes, only: :resend, with: -> { render_rate_limited }

    def create
      user = User.find_by_token_for(:email_verification, params[:token].to_s)

      if user&.suspended?
        render json: { error: ACCOUNT_SUSPENDED_MESSAGE, code: "account_suspended" }, status: :forbidden
      elsif user
        user.verify_email!
        render json: { message: "メールアドレスを確認しました。" }
      else
        render json: { error: "確認リンクが無効か、有効期限が切れています。" }, status: :unprocessable_content
      end
    end

    def resend
      if current_user.email_verified?
        render json: { message: "メールアドレスは確認済みです。" }
      else
        AccountMailer.email_verification(current_user).deliver_later
        render json: { message: "確認メールを送信しました。" }
      end
    end
  end
end
