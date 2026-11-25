# The logged-in user's favorites (お気に入り). Private to each user.
#
# GET    /api/my/favorites              お気に入り一覧（公開中のプログラムのみ）
# POST   /api/my/favorites              追加 { program_id }（公開中のプログラムのみ）
# DELETE /api/my/favorites/:program_id  解除
#
# Every query goes through current_user.favorites, so a user can never read or change
# another user's favorites, regardless of the ids sent.
module Api
  module My
    class FavoritesController < ApplicationController
      include PublicProgramJson

      rate_limit to: 60, within: 1.minute, only: %i[create destroy], with: -> { render_rate_limited }

      def index
        favorites = current_user.favorites
                                .joins(:program).merge(Program.publicly_visible)
                                .includes(program: [ :user, { days: :exercises } ])
                                .order(created_at: :desc)
        render json: {
          programs: favorites.map do |f|
            public_program_card_json(f.program, favorited: true).merge(favorited_at: f.created_at.iso8601)
          end
        }
      end

      def create
        program = Program.publicly_visible.find_by(id: params[:program_id])
        return render json: { error: "プログラムが見つかりません。" }, status: :not_found unless program

        begin
          current_user.favorites.find_or_create_by!(program: program)
        rescue ActiveRecord::RecordNotUnique
          # Another request added it at the same time: already a favorite.
        end
        render json: { program_id: program.id, favorited: true }, status: :created
      end

      def destroy
        # Removing something that is not a favorite is not an error (idempotent).
        current_user.favorites.where(program_id: params[:program_id]).destroy_all
        head :no_content
      end
    end
  end
end
