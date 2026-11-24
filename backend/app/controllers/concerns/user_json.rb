# JSON shape of the logged-in user's own account.
# Only for the user themself: never reuse it for other users (it contains personal data).
module UserJson
  private
    def user_json(user)
      {
        id: user.id,
        email_address: user.email_address,
        email_verified: user.email_verified?,
        nickname: user.nickname,
        bio: user.bio,
        birth_date: user.birth_date&.iso8601,
        age: user.age,
        training_started_on: user.training_started_on&.strftime("%Y-%m"),
        training_years: user.training_years,
        seller_requirements: user.seller_requirements,
        created_at: user.created_at.iso8601
      }
    end
end
