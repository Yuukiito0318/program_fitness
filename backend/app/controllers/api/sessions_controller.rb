# GET    /api/session  ログイン中のユーザー情報（未ログインなら 401）
# POST   /api/session  ログイン
# DELETE /api/session  ログアウト
module Api
  class SessionsController < ApplicationController
    include UserJson

    allow_unauthenticated_access only: :create
    rate_limit to: 10, within: 3.minutes, only: :create, with: -> { render_rate_limited }

    def show
      render json: { user: user_json(current_user) }
    end

    def create
      # authenticate_by takes the same time whether or not the email exists (no account probing).
      user = User.authenticate_by(email_address: params[:email_address].to_s, password: params[:password].to_s)

      if user&.suspended?
        # Only revealed after the correct password, so it does not help account probing.
        render json: { error: ACCOUNT_SUSPENDED_MESSAGE, code: "account_suspended" }, status: :forbidden
      elsif user
        start_new_session_for(user)
        render json: { user: user_json(user) }, status: :created
      else
        render json: { error: "メールアドレスまたはパスワードが正しくありません。" }, status: :unauthorized
      end
    end

    def destroy
      terminate_session
      head :no_content
    end
  end
end
