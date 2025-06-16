class User < ApplicationRecord
  # Include default devise modules
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :trackable, :omniauthable, :jwt_authenticatable,
         omniauth_providers: [:google_oauth2],
         jwt_revocation_strategy: Devise::JWT::RevocationStrategies::Null

  # Enums
  enum role: { client: 0, provider: 1, admin: 2 }

  # Associations
  has_many :availability_slots, dependent: :destroy
  has_many :provider_appointments, class_name: 'Appointment', foreign_key: 'provider_id', dependent: :destroy
  has_many :client_appointments, class_name: 'Appointment', foreign_key: 'client_id', dependent: :destroy
  has_many :notifications, through: :provider_appointments
  has_many :notifications, through: :client_appointments
  has_one :user_preference, dependent: :destroy

  # Profile associations and attachments
  has_one_attached :avatar

  # Validations
  validates :name, presence: true
  validates :email, presence: true, uniqueness: true
  validates :timezone, presence: true
  validates :role, presence: true
  validates :custom_booking_slug, uniqueness: true, allow_nil: true, 
            format: { with: /\A[a-z0-9\-_]+\z/, message: "can only contain lowercase letters, numbers, hyphens, and underscores" },
            length: { minimum: 3, maximum: 50 }

  # Callbacks
  before_validation :set_default_role, on: :create
  before_validation :set_default_timezone, on: :create
  before_validation :sanitize_custom_booking_slug
  after_create :auto_confirm_user
  after_create :create_user_preferences
  # Temporarily disabled: after_create :send_welcome_notification

  # Scopes
  scope :providers, -> { where(role: :provider) }
  scope :clients, -> { where(role: :client) }
  scope :confirmed, -> { where.not(confirmed_at: nil) }
  scope :unconfirmed, -> { where(confirmed_at: nil) }
  scope :with_specialties, -> { where.not(specialties: [nil, '']) }
  scope :with_custom_slug, -> { where.not(custom_booking_slug: nil) }

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

  def self.find_by_booking_identifier(identifier)
    # Try to find by custom slug first, then by ID
    find_by(custom_booking_slug: identifier) || find_by(id: identifier)
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

  # Profile methods
  def specialties_array
    return [] if specialties.blank?
    JSON.parse(specialties)
  rescue JSON::ParserError
    specialties.to_s.split(',').map(&:strip)
  end

  def specialties_array=(array)
    self.specialties = array.is_a?(Array) ? array.to_json : array.to_s
  end

  def social_links_hash
    return {} if social_links.blank?
    JSON.parse(social_links)
  rescue JSON::ParserError
    {}
  end

  def social_links_hash=(hash)
    self.social_links = hash.is_a?(Hash) ? hash.to_json : hash.to_s
  end

  def booking_url_slug
    custom_booking_slug.presence || id.to_s
  end

  def public_booking_url(base_url = nil)
    base_url ||= Rails.application.routes.default_url_options[:host] || 'localhost:3000'
    "#{base_url}/book/#{booking_url_slug}"
  end

  def has_complete_profile?
    name.present? && bio.present? && (provider? ? specialties_array.any? : true)
  end

  def preferences
    user_preference || build_user_preference
  end

  def avatar_url_or_default
    Rails.logger.debug "User#avatar_url_or_default called for user #{id}"
    
    begin
      if avatar.attached?
        Rails.logger.debug "  - Avatar is attached, generating rails_blob_url"
        Rails.logger.debug "  - Avatar filename: #{avatar.filename}"
        Rails.logger.debug "  - Avatar key: #{avatar.key}"
        Rails.logger.debug "  - Avatar service: #{avatar.service_name}"
        
        url = Rails.application.routes.url_helpers.rails_blob_url(avatar, only_path: true)
        Rails.logger.debug "  - Generated blob URL: #{url}"
        return url
      elsif avatar_url.present?
        Rails.logger.debug "  - Using stored avatar_url: #{avatar_url}"
        return avatar_url
      else
        # Return a default avatar URL or gravatar
        gravatar = gravatar_url
        Rails.logger.debug "  - No avatar found, using gravatar: #{gravatar}"
        return gravatar
      end
    rescue => e
      Rails.logger.error "Error in avatar_url_or_default for user #{id}: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      fallback = gravatar_url
      Rails.logger.debug "  - Falling back to gravatar: #{fallback}"
      return fallback
    end
  end

  private

  def set_default_role
    self.role ||= :client
  end

  def set_default_timezone
    self.timezone ||= 'UTC'
  end

  def sanitize_custom_booking_slug
    return if custom_booking_slug.blank?
    self.custom_booking_slug = custom_booking_slug.downcase.strip
  end

  def auto_confirm_user
    # Auto-confirm users to avoid email issues during development
    self.update_column(:confirmed_at, Time.current) if confirmed_at.nil?
  end

  def create_user_preferences
    # Create default user preferences
    self.create_user_preference! unless user_preference.present?
  end

  def send_welcome_notification
    # Send welcome email after user creation
    UserMailer.welcome_email(self).deliver_later if persisted?
  end

  def gravatar_url
    hash = Digest::MD5.hexdigest(email.downcase)
    "https://www.gravatar.com/avatar/#{hash}?d=identicon"
  end
end 