class Notification < ApplicationRecord
  # Associations
  belongs_to :appointment
  belongs_to :user

  # Enums
  enum notification_type: { email: 0, sms: 1 }
  enum status: { pending: 0, sent: 1, failed: 2, delivered: 3 }

  # Validations
  validates :message, presence: true
  validates :notification_type, presence: true
  validates :status, presence: true

  # Callbacks
  before_create :set_default_status

  # Scopes
  scope :for_user, ->(user) { where(user: user) }
  scope :for_appointment, ->(appointment) { where(appointment: appointment) }
  scope :pending, -> { where(status: :pending) }
  scope :sent, -> { where(status: :sent) }
  scope :failed, -> { where(status: :failed) }
  scope :delivered, -> { where(status: :delivered) }
  scope :emails, -> { where(notification_type: :email) }
  scope :sms_messages, -> { where(notification_type: :sms) }

  # Instance methods
  def mark_as_sent!
    update!(status: :sent, sent_at: Time.current)
  end

  def mark_as_failed!(error_message = nil)
    update!(status: :failed, error_message: error_message)
  end

  def mark_as_delivered!
    update!(status: :delivered)
  end

  def can_retry?
    failed? && retry_count < 3
  end

  def retry!
    return false unless can_retry?
    
    increment!(:retry_count)
    update!(status: :pending)
    
    case notification_type
    when 'email'
      EmailNotificationJob.perform_later(id)
    when 'sms'
      SmsNotificationJob.perform_later(id)
    end
  end

  def recipient_email
    user.email
  end

  def recipient_phone
    user.phone_number
  end

  def appointment_details
    return {} unless appointment
    
    {
      provider_name: appointment.provider.name,
      client_name: appointment.client.name,
      start_time: appointment.start_time,
      end_time: appointment.end_time,
      status: appointment.status
    }
  end

  private

  def set_default_status
    self.status ||= :pending
  end
end 