# A program the user marked as a favorite (お気に入り). Private to that user.
class Favorite < ApplicationRecord
  belongs_to :user
  belongs_to :program

  validates :program_id, uniqueness: { scope: :user_id }
  validate :program_is_published, on: :create

  private
    def program_is_published
      errors.add(:program, :not_published) unless program&.published?
    end
end
