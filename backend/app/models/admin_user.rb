# Operator account for the admin screens (/admin). Separate from User on purpose.
# Created only with `rails admin:create` on the server — there is no sign-up form or API for it.
#
# Permissions (policy: personal information and normal operations are separate):
# - every enabled operator : user list / detail without personal information, dashboard
# - personal_info_access   : see and search email address / birth date
# - user_management_access : suspend / unsuspend user accounts
# - news_management_access : create / edit / publish / unpublish news (viewing news is open to every operator)
# Permissions are changed only with `rails admin:permissions` on the server.
class AdminUser < ApplicationRecord
  PASSWORD_MIN_LENGTH = 12

  has_secure_password
  has_many :admin_sessions, dependent: :destroy
  has_many :audit_logs, class_name: "AdminAuditLog", dependent: :restrict_with_exception

  normalizes :email_address, with: ->(e) { e.strip.downcase }
  normalizes :name, with: ->(n) { n.strip }

  validates :email_address, presence: true, uniqueness: true,
                            format: { with: URI::MailTo::EMAIL_REGEXP }, length: { maximum: 255 }
  validates :name, presence: true, length: { maximum: 50 }
  validates :password, length: { minimum: PASSWORD_MIN_LENGTH }, allow_nil: true

  scope :enabled, -> { where(disabled_at: nil) }

  def enabled?
    disabled_at.nil?
  end
end
