# One account suspension of a user.
#
# Policy (confirmed):
# - An end time can be set. Without one, the suspension lasts until an operator lifts it.
# - After the end time passes, the account becomes usable again automatically (no batch job needed:
#   "in effect" is evaluated at request time).
# - user_reason is sent to the user in the notification email; internal_note is for operators only
#   and is never included in emails.
class AccountSuspension < ApplicationRecord
  REASON_MAX_LENGTH = 1000

  belongs_to :user
  belongs_to :suspended_by, class_name: "AdminUser"
  belongs_to :lifted_by, class_name: "AdminUser", optional: true

  normalizes :user_reason, :lift_reason, with: ->(v) { v.strip }
  normalizes :internal_note, with: ->(v) { v.strip.presence }

  validates :user_reason, presence: true, length: { maximum: REASON_MAX_LENGTH }, on: :create
  validates :internal_note, length: { maximum: REASON_MAX_LENGTH }
  validates :lift_reason, presence: true, length: { maximum: REASON_MAX_LENGTH }, if: :lifted_at?
  validates :starts_at, presence: true
  validate :ends_after_start

  scope :in_effect, ->(at = Time.current) {
    where(lifted_at: nil).where(starts_at: ..at).where("ends_at IS NULL OR ends_at > ?", at)
  }

  def in_effect?(at = Time.current)
    lifted_at.nil? && starts_at <= at && (ends_at.nil? || ends_at > at)
  end

  def lift!(admin:, reason:)
    update!(lifted_at: Time.current, lifted_by: admin, lift_reason: reason)
  end

  private
    def ends_after_start
      return if ends_at.nil? || starts_at.nil?

      errors.add(:ends_at, :after_start) if ends_at <= starts_at
    end
end
