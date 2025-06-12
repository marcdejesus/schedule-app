class AvailabilitySlotSerializer
  include JSONAPI::Serializer

  attributes :id, :start_time, :end_time, :recurring, :notes, :created_at, :updated_at

  attribute :duration_in_minutes do |slot|
    slot.duration_in_minutes
  end

  attribute :formatted_time_range do |slot|
    slot.formatted_time_range
  end

  attribute :available do |slot|
    slot.available?
  end

  belongs_to :user
end 