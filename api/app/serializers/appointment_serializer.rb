class AppointmentSerializer
  include JSONAPI::Serializer

  attributes :id, :start_time, :end_time, :status, :notes, :cancellation_reason, :created_at, :updated_at

  attribute :duration_in_minutes do |appointment|
    appointment.duration_in_minutes
  end

  attribute :time_range do |appointment|
    appointment.time_range
  end

  attribute :formatted_date do |appointment|
    appointment.formatted_date
  end

  attribute :formatted_time do |appointment|
    appointment.formatted_time
  end

  attribute :can_be_cancelled do |appointment|
    appointment.can_be_cancelled?
  end

  attribute :can_be_rescheduled do |appointment|
    appointment.can_be_rescheduled?
  end

  belongs_to :provider, serializer: UserSerializer
  belongs_to :client, serializer: UserSerializer
end 