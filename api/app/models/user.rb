class User < ApplicationRecord
  # Include default devise modules
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :omniauthable, omniauth_providers: [:google_oauth2]

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

  # Scopes
  scope :providers, -> { where(role: :provider) }
  scope :clients, -> { where(role: :client) }

  # Class methods
  def self.from_omniauth(auth)
    where(email: auth.info.email).first_or_create do |user|
      user.email = auth.info.email
      user.name = auth.info.name
      user.password = Devise.friendly_token[0, 20]
      user.provider_id = auth.provider
      user.uid = auth.uid
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

  private

  def set_default_role
    self.role ||= :client
  end

  def set_default_timezone
    self.timezone ||= 'UTC'
  end
end 