# One training day of a program's split (e.g. "Day1 胸・三頭").
class ProgramDay < ApplicationRecord
  NAME_MAX_LENGTH = 50
  NOTE_MAX_LENGTH = 1000
  MAX_EXERCISES = 30 # technical limit (not in the spec)

  belongs_to :program, inverse_of: :days
  has_many :exercises, -> { order(:position) }, class_name: "ProgramExercise",
                                                 dependent: :destroy, inverse_of: :program_day, autosave: true

  normalizes :name, with: ->(v) { v.strip }
  normalizes :note, with: ->(v) { v.strip.presence }

  validates :position, presence: true
  validates :name, presence: true, length: { maximum: NAME_MAX_LENGTH }
  validates :note, length: { maximum: NOTE_MAX_LENGTH }
  validate :exercises_within_limit

  def active_exercises
    exercises.reject(&:marked_for_destruction?)
  end

  private
    def exercises_within_limit
      errors.add(:base, :too_many_exercises, count: MAX_EXERCISES) if active_exercises.size > MAX_EXERCISES
    end
end
