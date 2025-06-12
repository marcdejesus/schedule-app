class Appointment < ApplicationRecord
  # Associations
  belongs_to :provider, class_name: 'User'
  belongs_to :client, class_name: 'User'
  has_many :notifications, dependent: :destroy

  # Enums
  enum status: { 
    pending: 0, 
    confirmed: 1, 
    cancelled: 2, 
    completed: 3,
    no_show: 4
  }

  # Validations
  validates :start_time, presence: true
  validates :end_time, presence: true
  validates :status, presence: true
  validate :end_time_after_start_time
  validate :provider_must_be_provider_role
  validate :client_must_be_client_role
  validate :provider_and_client_different
  validate :appointment_in_future, on: :create
  validate :provider_available_during_slot

  # Callbacks
  after_create :send_confirmation_notifications
  after_update :send_status_change_notifications, if: :saved_change_to_status?

  # Scopes
  scope :for_provider, ->(provider) { where(provider: provider) }
  scope :for_client, ->(client) { where(client: client) }
  scope :for_date, ->(date) { where(start_time: date.beginning_of_day..date.end_of_day) }
  scope :upcoming, -> { where('start_time > ?', Time.current) }
  scope :past, -> { where('end_time < ?', Time.current) }
  scope :today, -> { for_date(Date.current) }
  scope :this_week, -> { where(start_time: Date.current.beginning_of_week..Date.current.end_of_week) }

  # Instance methods
  def duration_in_minutes
    ((end_time - start_time) / 1.minute).to_i
  end

  def can_be_cancelled?
    (pending? || confirmed?) && start_time > 24.hours.from_now
  end

  def can_be_rescheduled?
    (pending? || confirmed?) && start_time > 24.hours.from_now
  end

  def time_range
    "#{start_time.strftime('%B %d, %Y at %I:%M %p')} - #{end_time.strftime('%I:%M %p')}"
  end

  def formatted_date
    start_time.strftime('%B %d, %Y')
  end

  def formatted_time
    "#{start_time.strftime('%I:%M %p')} - #{end_time.strftime('%I:%M %p')}"
  end

  def in_timezone(timezone)
    {
      start_time: start_time.in_time_zone(timezone),
      end_time: end_time.in_time_zone(timezone)
    }
  end

  def overlaps_with?(other_appointment)
    return false if other_appointment.nil?
    
    (start_time < other_appointment.end_time) && (end_time > other_appointment.start_time)
  end

  private

  def end_time_after_start_time
    return unless start_time && end_time
    
    errors.add(:end_time, 'must be after start time') if end_time <= start_time
  end

  def provider_must_be_provider_role
    return unless provider
    
    errors.add(:provider, 'must have provider role') unless provider.provider?
  end

  def client_must_be_client_role
    return unless client
    
    errors.add(:client, 'must have client role') unless client.client?
  end

  def provider_and_client_different
    return unless provider && client
    
    errors.add(:client, 'cannot be the same as provider') if provider == client
  end

  def appointment_in_future
    return unless start_time
    
    errors.add(:start_time, 'must be in the future') if start_time <= Time.current
  end

  def provider_available_during_slot
    return unless provider && start_time && end_time
    
    # Check if provider has availability during this time
    available_slot = provider.availability_slots.find do |slot|
      slot.start_time <= start_time && slot.end_time >= end_time
    end
    
    errors.add(:base, 'Provider is not available during this time') unless available_slot
    
    # Check for conflicts with other appointments
    conflicting_appointments = provider.provider_appointments
                                      .where.not(id: id)
                                      .where(
                                        '(start_time < ? AND end_time > ?) OR (start_time < ? AND end_time > ?)',
                                        end_time, start_time, start_time, end_time
                                      )
    
    errors.add(:base, 'Time slot conflicts with existing appointment') if conflicting_appointments.exists?
  end

  def send_confirmation_notifications
    NotificationJob.perform_later(
      appointment_id: id,
      type: 'appointment_created',
      recipient_ids: [provider_id, client_id]
    )
  end

  def send_status_change_notifications
    NotificationJob.perform_later(
      appointment_id: id,
      type: 'appointment_status_changed',
      recipient_ids: [provider_id, client_id]
    )
  end
end 