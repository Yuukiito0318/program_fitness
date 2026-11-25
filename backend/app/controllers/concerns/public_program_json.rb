# JSON shapes for public (published) programs, used by search, public detail, and favorites.
#
# Before purchase, the detailed workout (sets/reps/weight of each exercise) is NOT included:
# only counts. Whether the pre-purchase page may show the full workout is not decided in the spec.
module PublicProgramJson
  private
    def public_program_card_json(program, favorited:)
      days = program.days
      {
        id: program.id,
        title: program.title,
        category: program.category,
        duration_value: program.duration_value,
        duration_unit: program.duration_unit,
        split_method: program.split_method,
        price: program.price,
        days_count: days.size,
        exercises_count: days.sum { |d| d.exercises.size },
        published_at: program.published_at&.iso8601,
        creator: { nickname: program.user.nickname, training_years: program.user.training_years },
        favorited: favorited
      }
    end

    def public_program_detail_json(program, favorited:)
      public_program_card_json(program, favorited: favorited).merge(
        description: program.description,
        target_audience: program.target_audience,
        equipment: program.equipment,
        # Public seller info (spec: 販売者情報). No email, birth date, or age.
        creator: {
          nickname: program.user.nickname,
          bio: program.user.bio,
          training_years: program.user.training_years
        }
      )
    end

    # program ids (among the given ones) that the logged-in user has favorited
    def favorited_program_ids(program_ids)
      return Set.new unless current_user

      current_user.favorites.where(program_id: program_ids).pluck(:program_id).to_set
    end
end
