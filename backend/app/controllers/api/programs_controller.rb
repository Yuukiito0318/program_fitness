# Public programs (published only). Drafts never appear here.
#
# GET /api/programs      検索・絞り込み・新着順（ログイン不要）
#   q             キーワード（タイトル・内容・対象者・分割法・器具・種目名。スペース区切りで AND）
#   category      power / hypertrophy / balance
#   duration_unit week / month（duration_min / duration_max はこの単位での範囲）
#   price_min / price_max  価格帯（円）
#   page          ページ番号（1ページ20件）
# GET /api/programs/:id  公開プログラムの詳細（ログイン不要。下書きは 404）
module Api
  class ProgramsController < ApplicationController
    include PublicProgramJson

    PER_PAGE = 20
    MAX_INT = 1_000_000

    allow_unauthenticated_access only: %i[index show]
    # Not required, but if the user is logged in we show which programs they favorited.
    before_action :resume_session, only: %i[index show]

    def index
      filters, errors = parse_filters
      return render json: { errors: errors }, status: :unprocessable_content if errors.any?

      scope = Program.search(filters)
      total = scope.count
      page = [ params[:page].to_i, 1 ].max
      programs = scope.includes(:user, days: :exercises).offset((page - 1) * PER_PAGE).limit(PER_PAGE).to_a
      favorited = favorited_program_ids(programs.map(&:id))

      render json: {
        programs: programs.map { |p| public_program_card_json(p, favorited: favorited.include?(p.id)) },
        total: total,
        page: page,
        per_page: PER_PAGE,
        total_pages: (total.to_f / PER_PAGE).ceil
      }
    end

    def show
      program = Program.publicly_visible.includes(:user, days: :exercises).find_by(id: params[:id])
      return render json: { error: "プログラムが見つかりません。" }, status: :not_found unless program

      render json: {
        program: public_program_detail_json(program, favorited: favorited_program_ids([ program.id ]).include?(program.id))
      }
    end

    private
      def parse_filters
        errors = {}
        filters = {
          q: params[:q].to_s.strip.first(100),
          category: params[:category].presence,
          duration_unit: params[:duration_unit].presence
        }
        { duration_min: "期間（下限）", duration_max: "期間（上限）",
          price_min: "価格（下限）", price_max: "価格（上限）" }.each do |key, label|
          raw = params[key].to_s.strip
          next if raw.empty?

          if raw.match?(/\A\d+\z/) && raw.to_i <= MAX_INT
            filters[key] = raw.to_i
          else
            errors[key.to_s] = [ "#{label}は0以上の整数で入力してください" ]
          end
        end
        if filters[:price_min] && filters[:price_max] && filters[:price_min] > filters[:price_max]
          errors["price_max"] = [ "価格（上限）は価格（下限）以上にしてください" ]
        end
        if filters[:duration_min] && filters[:duration_max] && filters[:duration_min] > filters[:duration_max]
          errors["duration_max"] = [ "期間（上限）は期間（下限）以上にしてください" ]
        end
        [ filters, errors ]
      end
  end
end
