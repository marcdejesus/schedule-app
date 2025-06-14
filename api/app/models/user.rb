class User < ApplicationRecord
  # Include default devise modules
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :trackable,
         :omniauthable, omniauth_providers: [:google_oauth2],
         :jwt_authenticatable, jwt_revocation_strategy: Devise::JWT::RevocationStrategies::Null

  # Enums
  enum role: { client: 0, provider: 1, admin: 2 }

  # Associations
  has_many :availability_slots, dependent: :destroy
  has_many :provider_appointments, class_name: 'Appointment', foreign_key: 'provider_id', dependent: :destroy
  has_many :client_appointments, class_name: 'Appointment', foreign_key: 'client_id', dependent: :destroy
  has_many :notifications, through: :provider_appointments
  has_many :notifications, through: :client_appointments

  # Validations
  validates :name, presence: true
  validates :email, presence: true, uniqueness: true
  validates :timezone, presence: true
  validates :role, presence: true

  # Callbacks
  before_validation :set_default_role, on: :create
  before_validation :set_default_timezone, on: :create
  after_create :auto_confirm_user
  # Temporarily disabled: after_create :send_welcome_notification

  # Scopes
  scope :providers, -> { where(role: :provider) }
  scope :clients, -> { where(role: :client) }
  scope :confirmed, -> { where.not(confirmed_at: nil) }
  scope :unconfirmed, -> { where(confirmed_at: nil) }

  # Class methods
  def self.from_omniauth(auth)
    where(email: auth.info.email).first_or_create do |user|
      user.email = auth.info.email
      user.name = auth.info.name
      user.password = Devise.friendly_token[0, 20]
      user.provider_id = auth.provider
      user.uid = auth.uid
      user.confirmed_at = Time.current # Auto-confirm OAuth users
    end
  end

  # Instance methods
  def full_name
    name
  end

  def appointments
    case role
    when 'provider'
      provider_appointments
    when 'client'
      client_appointments
    else
      Appointment.none
    end
  end

  def available_slots_for_date(date)
    availability_slots.for_date(date)
  end

  def email_verified?
    confirmed_at.present?
  end

  def password_reset_pending?
    reset_password_token.present? && reset_password_sent_at.present? &&
      reset_password_sent_at > 2.hours.ago
  end

  def can_request_password_reset?
    !password_reset_pending?
  end

  def sessions_active?
    remember_created_at.present? && remember_created_at > 30.days.ago
  end

  private

  def set_default_role
    self.role ||= :client
  end

  def set_default_timezone
    self.timezone ||= 'UTC'
  end

  def auto_confirm_user
    # Auto-confirm users to avoid email issues during development
    self.update_column(:confirmed_at, Time.current) if confirmed_at.nil?
  end

  def send_welcome_notification
    # Send welcome email after user creation
    UserMailer.welcome_email(self).deliver_later if persisted?
  end
end 