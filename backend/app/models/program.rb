# A training program created by a user.
#
# Spec (confirmed): 区分＝パワー/筋肥大/バランス、期間＝1週間〜3ヶ月、分割法は自由、販売価格＝100〜100,000円。
# Only drafts exist for now: selling, purchase, and post-sale revision/versioning are not implemented
# (versioning after sale start is an open question in the spec).
class Program < ApplicationRecord
  CATEGORIES = {
    "power" => "パワー",
    "hypertrophy" => "筋肥大",
    "balance" => "バランス"
  }.freeze

  # Spec: 期間は1週間から3ヶ月。How many weeks count as 3 months is not defined,
  # so the unit is chosen explicitly: weeks (1-12) or months (1-3). Provisional.
  DURATION_UNITS = {
    "week" => { label: "週", range: 1..12 },
    "month" => { label: "ヶ月", range: 1..3 }
  }.freeze

  PRICE_RANGE = 100..100_000

  # Technical limits (not in the spec).
  MAX_DAYS = 14
  TITLE_MAX_LENGTH = 100
  SPLIT_METHOD_MAX_LENGTH = 100
  DESCRIPTION_MAX_LENGTH = 5000
  TEXT_MAX_LENGTH = 1000

  belongs_to :user
  has_many :days, -> { order(:position) }, class_name: "ProgramDay",
                                            dependent: :destroy, inverse_of: :program, autosave: true

  enum :status, { draft: "draft" }, default: "draft", validate: true

  normalizes :title, :split_method, with: ->(v) { v.strip }
  normalizes :description, :target_audience, :equipment, with: ->(v) { v.strip.presence }
  normalizes :category, :duration_unit, with: ->(v) { v.presence }

  validates :title, presence: true, length: { maximum: TITLE_MAX_LENGTH }
  validates :split_method, length: { maximum: SPLIT_METHOD_MAX_LENGTH }
  validates :description, length: { maximum: DESCRIPTION_MAX_LENGTH }
  validates :target_audience, :equipment, length: { maximum: TEXT_MAX_LENGTH }
  validates :category, inclusion: { in: CATEGORIES.keys }, allow_nil: true
  validates :duration_unit, inclusion: { in: DURATION_UNITS.keys }, allow_nil: true
  validates :duration_value, numericality: { only_integer: true }, allow_nil: true
  validates :price, numericality: { only_integer: true,
                                    greater_than_or_equal_to: PRICE_RANGE.min,
                                    less_than_or_equal_to: PRICE_RANGE.max }, allow_nil: true
  validate :duration_is_complete_and_in_range
  validate :days_within_limit

  # Days that will remain after saving (excludes ones being replaced).
  def active_days
    days.reject(&:marked_for_destruction?)
  end

  # Items still empty, shown in the preview as "販売に向けて未入力の項目".
  # Informational only: selling is not implemented and drafts may be incomplete.
  def missing_items
    items = []
    items << "プログラムの内容" if description.blank?
    items << "対象者" if target_audience.blank?
    items << "必要な器具" if equipment.blank?
    items << "区分" if category.blank?
    items << "期間" if duration_value.blank? || duration_unit.blank?
    items << "分割法" if split_method.blank?
    items << "販売価格" if price.blank?
    items << "トレーニング日と種目" if active_days.none? { |d| d.active_exercises.any? }
    items
  end

  private
    def duration_is_complete_and_in_range
      return if duration_value.blank? && duration_unit.blank?

      if duration_value.blank?
        errors.add(:duration_value, :blank)
      elsif duration_unit.blank?
        errors.add(:duration_unit, :blank)
      elsif (unit = DURATION_UNITS[duration_unit]) && !unit[:range].cover?(duration_value.to_i)
        errors.add(:duration_value, :out_of_range, min: unit[:range].min, max: unit[:range].max, unit: unit[:label])
      end
    end

    def days_within_limit
      errors.add(:base, :too_many_days, count: MAX_DAYS) if active_days.size > MAX_DAYS
    end
end
