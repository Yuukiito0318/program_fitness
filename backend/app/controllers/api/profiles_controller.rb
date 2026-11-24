# GET   /api/profile  自分のプロフィール
# PATCH /api/profile  ニックネーム・自己紹介・生年月日・トレーニング歴を編集
#
# Email address and password are NOT changed here (password: /api/password).
module Api
  class ProfilesController < ApplicationController
    include UserJson

    def show
      render json: { user: user_json(current_user) }
    end

    def update
      if current_user.update(profile_params)
        render json: { user: user_json(current_user) }
      else
        render_validation_errors(current_user)
      end
    end

    private
      def profile_params
        params.expect(user: [ :nickname, :bio, :birth_date, :training_started_on ])
      end
  end
end
