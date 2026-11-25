# The logged-in user's own programs (drafts).
#
# GET    /api/my/programs      自分のプログラム一覧
# POST   /api/my/programs      下書きを新規作成
# GET    /api/my/programs/:id  詳細・プレビュー
# PATCH  /api/my/programs/:id  下書きを編集（トレーニング日・種目はまとめて置き換え）
# DELETE /api/my/programs/:id  下書きを削除
#
# Authorization: every query is scoped to current_user.programs, so another user's
# program is never found (404) — ownership is enforced on the server, not only in the UI.
module Api
  module My
    class ProgramsController < ApplicationController
      before_action :set_program, only: %i[show update destroy]
      before_action :require_draft, only: %i[update destroy]

      def index
        programs = current_user.programs.includes(days: :exercises).order(updated_at: :desc)
        render json: { programs: programs.map { |p| program_summary_json(p) } }
      end

      def show
        render json: { program: program_detail_json(@program) }
      end

      def create
        save_program(current_user.programs.build, :created)
      end

      def update
        save_program(@program, :ok)
      end

      def destroy
        @program.destroy!
        head :no_content
      end

      private
        def set_program
          @program = current_user.programs.includes(days: :exercises).find_by(id: params[:id])
          render json: { error: "プログラムが見つかりません。" }, status: :not_found unless @program
        end

        # Only drafts can be edited or deleted. Rules for programs after sale start
        # (revision / versioning) are not decided in the spec.
        def require_draft
          return if @program.draft?

          render json: { error: "下書き以外のプログラムは編集・削除できません。" }, status: :conflict
        end

        def program_params
          params.expect(program: [
            :title, :description, :target_audience, :equipment, :category,
            :duration_value, :duration_unit, :split_method, :price,
            days: [ [ :name, :note, exercises: [ [ :name, :sets, :reps, :weight, :rest, :note ] ] ] ]
          ])
        end

        # Saves the program with its days and exercises in one transaction.
        # When "days" is sent, the existing days/exercises are replaced by the sent list (in order).
        def save_program(program, success_status)
          attrs = program_params
          days = attrs.delete(:days)

          if days && days.size > Program::MAX_DAYS
            return render json: { errors: { "base" => [ "トレーニング日は#{Program::MAX_DAYS}日までです" ] } },
                          status: :unprocessable_content
          end

          saved = false
          Program.transaction do
            program.assign_attributes(attrs)
            replace_days(program, days) unless days.nil?
            saved = program.save
            raise ActiveRecord::Rollback unless saved
          end

          if saved
            render json: { program: program_detail_json(program.reload) }, status: success_status
          else
            render json: { errors: program_errors(program) }, status: :unprocessable_content
          end
        end

        def replace_days(program, days)
          program.days.each(&:mark_for_destruction)
          days.each_with_index do |day_params, i|
            day = program.days.build(position: i + 1, name: day_params[:name].to_s, note: day_params[:note])
            Array(day_params[:exercises]).first(ProgramDay::MAX_EXERCISES + 1).each_with_index do |ex, j|
              day.exercises.build(
                position: j + 1, name: ex[:name].to_s, sets: ex[:sets], reps: ex[:reps],
                weight: ex[:weight], rest: ex[:rest], note: ex[:note]
              )
            end
          end
        end

        # Errors keyed by field path, e.g. "title", "days.0.name", "days.1.exercises.2.sets".
        def program_errors(program)
          errors = Hash.new { |h, k| h[k] = [] }
          program.errors.each do |error|
            next if error.attribute.to_s.start_with?("days")

            errors[error.attribute.to_s] << error.full_message
          end
          program.active_days.each_with_index do |day, i|
            day.errors.each do |error|
              next if error.attribute.to_s.start_with?("exercises")

              errors["days.#{i}.#{error.attribute}"] << error.full_message
            end
            day.active_exercises.each_with_index do |exercise, j|
              exercise.errors.each do |error|
                errors["days.#{i}.exercises.#{j}.#{error.attribute}"] << error.full_message
              end
            end
          end
          errors
        end

        def program_summary_json(program)
          days = program.days
          {
            id: program.id,
            status: program.status,
            title: program.title,
            category: program.category,
            duration_value: program.duration_value,
            duration_unit: program.duration_unit,
            split_method: program.split_method,
            price: program.price,
            days_count: days.size,
            exercises_count: days.sum { |d| d.exercises.size },
            published_at: program.published_at&.iso8601,
            updated_at: program.updated_at.iso8601
          }
        end

        def program_detail_json(program)
          program_summary_json(program).merge(
            description: program.description,
            target_audience: program.target_audience,
            equipment: program.equipment,
            days: program.days.map do |day|
              {
                name: day.name,
                note: day.note,
                exercises: day.exercises.map do |ex|
                  ex.slice(:name, :sets, :reps, :weight, :rest, :note)
                end
              }
            end,
            missing_items: program.missing_items,
            creator: creator_json(program.user),
            created_at: program.created_at.iso8601
          )
        end

        # Creator profile shown with the program (spec: 販売者情報). No email, birth date, or age value:
        # only whether the confirmed seller requirements are met.
        def creator_json(user)
          {
            nickname: user.nickname,
            bio: user.bio,
            training_years: user.training_years,
            seller_requirements: user.seller_requirements
          }
        end
    end
  end
end
