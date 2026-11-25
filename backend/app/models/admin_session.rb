class AdminSession < ApplicationRecord
  # Operator logins expire sooner than user logins (not specified in the spec; adjust here).
  LIFETIME = 12.hours

  belongs_to :admin_user

  scope :active, -> { where(created_at: LIFETIME.ago..) }
end
