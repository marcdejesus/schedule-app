class AvailabilitySlot < ApplicationRecord
  # Associations
  belongs_to :user

  # Validations
  validates :start_time, presence: true
  validates :end_time, presence: true
  validates :user_id, presence: true
  validate :end_time_after_start_time
  validate :user_must_be_provider
  validate :no_overlapping_slots

  # Scopes
  scope :for_user, ->(user) { where(user: user) }
  scope :for_date, ->(date) { where(start_time: date.beginning_of_day..date.end_of_day) }
  scope :available, -> { where.not(id: Appointment.pluck(:availability_slot_id)) }
  scope :recurring, -> { where(recurring: true) }
  scope :one_time, -> { where(recurring: false) }
  scope :future, -> { where('start_time > ?', Time.current) }

  # Instance methods
  def duration_in_minutes
    ((end_time - start_time) / 1.minute).to_i
  end

  def overlaps_with?(other_slot)
    return false if other_slot.nil?
    
    (start_time < other_slot.end_time) && (end_time > other_slot.start_time)
  end

  def available?
    appointments.empty?
  end

  def booked?
    !available?
  end

  def appointments
    Appointment.where(
      provider: user,
      start_time: start_time,
      end_time: end_time
    )
  end

  def formatted_time_range
    "#{start_time.strftime('%I:%M %p')} - #{end_time.strftime('%I:%M %p')}"
  end

  private

  def end_time_after_start_time
    return unless start_time && end_time
    
    errors.add(:end_time, 'must be after start time') if end_time <= start_time
  end

  def user_must_be_provider
    return unless user
    
    errors.add(:user, 'must be a provider') unless user.provider?
  end

  def no_overlapping_slots
    return unless user && start_time && end_time
    
    overlapping = user.availability_slots
                     .where.not(id: id)
                     .where(
                       '(start_time < ? AND end_time > ?) OR (start_time < ? AND end_time > ?)',
                       end_time, start_time, start_time, end_time
                     )
    
    errors.add(:base, 'Time slot overlaps with existing availability') if overlapping.exists?
  end
end 