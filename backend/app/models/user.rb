class User < ApplicationRecord
  # Seller qualification (spec section 6, confirmed): 18 years or older AND 3+ years of training.
  # Identity verification is also required, but the verification service is not selected yet.
  SELLER_MIN_AGE = 18
  SELLER_MIN_TRAINING_YEARS = 3

  # Technical limits (not defined in the spec; adjust here if needed).
  PASSWORD_MIN_LENGTH = 8
  NICKNAME_MAX_LENGTH = 30
  BIO_MAX_LENGTH = 1000

  EMAIL_VERIFICATION_EXPIRES_IN = 24.hours
  PASSWORD_RESET_EXPIRES_IN = 1.hour

  has_secure_password
  has_many :sessions, dependent: :destroy
  has_many :programs, dependent: :destroy
  has_many :favorites, dependent: :destroy
  has_many :favorite_programs, through: :favorites, source: :program
  has_many :account_suspensions, -> { order(created_at: :desc) }, dependent: :restrict_with_exception

  # Users whose account is currently suspended (停止中) / not suspended.
  scope :suspended, -> { where(id: AccountSuspension.in_effect.select(:user_id)) }
  scope :not_suspended, -> { where.not(id: AccountSuspension.in_effect.select(:user_id)) }

  def active_suspension
    account_suspensions.in_effect.first
  end

  def suspended?
    active_suspension.present?
  end

  normalizes :email_address, with: ->(e) { e.strip.downcase }
  normalizes :nickname, with: ->(n) { n.strip.presence }
  normalizes :training_started_on, with: ->(d) { d.beginning_of_month }

  # Token embeds the email address: it stops working if the address changes or after it is used.
  generates_token_for :email_verification, expires_in: EMAIL_VERIFICATION_EXPIRES_IN do
    [ email_address, email_verified_at&.to_i ]
  end

  # Token embeds part of the password hash: it stops working once the password is changed.
  generates_token_for :password_reset, expires_in: PASSWORD_RESET_EXPIRES_IN do
    password_salt.last(10)
  end

  validates :email_address, presence: true,
                            length: { maximum: 255 },
                            format: { with: URI::MailTo::EMAIL_REGEXP },
                            uniqueness: true
  validates :password, length: { minimum: PASSWORD_MIN_LENGTH }, allow_nil: true
  validates :nickname, length: { maximum: NICKNAME_MAX_LENGTH }
  validates :bio, length: { maximum: BIO_MAX_LENGTH }
  validates :birth_date, presence: true
  validates :training_started_on, presence: true
  validate :birth_date_not_in_future
  validate :training_started_on_is_valid

  def email_verified?
    email_verified_at.present?
  end

  def verify_email!
    update!(email_verified_at: Time.current) unless email_verified?
  end

  # Age in full years, calculated from birth_date (spec: 年齢は生年月日から算出する).
  def age(on: Date.current)
    return nil unless birth_date

    years = on.year - birth_date.year
    had_birthday = (on.month > birth_date.month) || (on.month == birth_date.month && on.day >= birth_date.day)
    had_birthday ? years : years - 1
  end

  # Training history in full years, counted from the start month.
  def training_years(on: Date.current)
    return nil unless training_started_on

    months = (on.year - training_started_on.year) * 12 + (on.month - training_started_on.month)
    [ months / 12, 0 ].max
  end

  # Display-only check of the confirmed seller qualification.
  # Selling itself is not implemented yet; identity verification is not connected.
  def seller_requirements(on: Date.current)
    age_ok = age(on: on).to_i >= SELLER_MIN_AGE
    training_ok = training_years(on: on).to_i >= SELLER_MIN_TRAINING_YEARS
    {
      age: { required: SELLER_MIN_AGE, met: age_ok },
      training_years: { required: SELLER_MIN_TRAINING_YEARS, met: training_ok },
      identity_verification: { status: "not_available" },
      self_declared_requirements_met: age_ok && training_ok
    }
  end

  private
    def birth_date_not_in_future
      return unless birth_date

      errors.add(:birth_date, :in_future) if birth_date > Date.current
    end

    def training_started_on_is_valid
      return unless training_started_on

      if training_started_on > Date.current
        errors.add(:training_started_on, :in_future)
      elsif birth_date && training_started_on < birth_date.beginning_of_month
        errors.add(:training_started_on, :before_birth)
      end
    end
end
