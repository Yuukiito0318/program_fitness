# POST /api/registration  新規登録（メールアドレス・パスワード・生年月日・トレーニング歴）
module Api
  class RegistrationsController < ApplicationController
    include UserJson

    allow_unauthenticated_access only: :create
    rate_limit to: 10, within: 1.hour, only: :create, with: -> { render_rate_limited }

    def create
      attrs = registration_params
      # A missing confirmation must fail the check instead of skipping it.
      attrs[:password_confirmation] = attrs[:password_confirmation].to_s
      user = User.new(attrs)

      if user.save
        AccountMailer.email_verification(user).deliver_later
        start_new_session_for(user)
        render json: { user: user_json(user) }, status: :created
      else
        render_validation_errors(user)
      end
    end

    private
      def registration_params
        params.expect(user: [ :email_address, :password, :password_confirmation, :birth_date, :training_started_on ])
      end
  end
end
