class Session < ApplicationRecord
  # How long a login is kept (spec: ログイン状態を維持する; the duration is not specified).
  LIFETIME = 30.days

  belongs_to :user

  scope :active, -> { where(created_at: LIFETIME.ago..) }

  def expires_at
    created_at + LIFETIME
  end
end
