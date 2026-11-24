# One exercise in a training day (spec: 種目順、セット数、レップ数、重量などを登録する).
# reps / weight are free text so ranges ("8〜10"), "AMRAP", or "%1RM" can be written. Provisional.
class ProgramExercise < ApplicationRecord
  NAME_MAX_LENGTH = 100
  SETS_RANGE = 1..20
  REPS_MAX_LENGTH = 20
  WEIGHT_MAX_LENGTH = 50
  REST_MAX_LENGTH = 20
  NOTE_MAX_LENGTH = 500

  belongs_to :program_day, inverse_of: :exercises

  normalizes :name, with: ->(v) { v.strip }
  normalizes :reps, :weight, :rest, :note, with: ->(v) { v.strip.presence }

  validates :position, presence: true
  validates :name, presence: true, length: { maximum: NAME_MAX_LENGTH }
  validates :sets, numericality: { only_integer: true,
                                   greater_than_or_equal_to: SETS_RANGE.min,
                                   less_than_or_equal_to: SETS_RANGE.max }, allow_nil: true
  validates :reps, length: { maximum: REPS_MAX_LENGTH }
  validates :weight, length: { maximum: WEIGHT_MAX_LENGTH }
  validates :rest, length: { maximum: REST_MAX_LENGTH }
  validates :note, length: { maximum: NOTE_MAX_LENGTH }
end
