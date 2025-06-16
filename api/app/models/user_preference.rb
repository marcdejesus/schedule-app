class UserPreference < ApplicationRecord
  belongs_to :user

  # Enums for string fields
  enum theme: { 
    light: 'light', 
    dark: 'dark', 
    system: 'system' 
  }
  
  enum font_size: { 
    small: 'small', 
    medium: 'medium', 
    large: 'large' 
  }
  
  enum notification_frequency: { 
    immediate: 'immediate', 
    daily: 'daily', 
    weekly: 'weekly' 
  }

  # Validations
  validates :user_id, presence: true, uniqueness: true
  validates :theme, inclusion: { in: themes.keys }
  validates :font_size, inclusion: { in: font_sizes.keys }
  validates :notification_frequency, inclusion: { in: notification_frequencies.keys }
  validates :language, format: { with: /\A[a-z]{2}\z/, message: "must be a 2-letter language code" }
  validates :date_format, inclusion: { 
    in: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'], 
    message: "must be a valid date format" 
  }

  # Callbacks
  after_initialize :set_defaults, if: :new_record?

  # Scopes
  scope :with_notifications_enabled, -> { where(email_notifications: true) }
  scope :with_reminders_enabled, -> { where(appointment_reminders: true) }
  scope :high_contrast_users, -> { where(high_contrast: true) }
  scope :reduced_motion_users, -> { where(reduced_motion: true) }

  # Instance methods
  def notifications_enabled?
    email_notifications || appointment_reminders || booking_confirmations
  end

  def accessibility_features_enabled?
    high_contrast || reduced_motion || screen_reader
  end

  def prefers_dark_mode?
    theme == 'dark' || (theme == 'system' && Time.current.hour.between?(18, 6))
  end

  private

  def set_defaults
    self.email_notifications = true if email_notifications.nil?
    self.appointment_reminders = true if appointment_reminders.nil?
    self.booking_confirmations = true if booking_confirmations.nil?
    self.notification_frequency = 'immediate' if notification_frequency.blank?
    self.theme = 'system' if theme.blank?
    self.font_size = 'medium' if font_size.blank?
    self.high_contrast = false if high_contrast.nil?
    self.reduced_motion = false if reduced_motion.nil?
    self.screen_reader = false if screen_reader.nil?
    self.language = 'en' if language.blank?
    self.date_format = 'MM/DD/YYYY' if date_format.blank?
  end
end
