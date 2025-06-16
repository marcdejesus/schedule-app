class UserPreferenceSerializer
  include JSONAPI::Serializer

  attributes :id, :user_id, :created_at, :updated_at,
             :email_notifications, :appointment_reminders, :booking_confirmations,
             :notification_frequency, :theme, :font_size, :high_contrast,
             :reduced_motion, :screen_reader, :language, :date_format

  attribute :notifications_enabled do |preference|
    preference.notifications_enabled?
  end

  attribute :accessibility_features_enabled do |preference|
    preference.accessibility_features_enabled?
  end

  attribute :prefers_dark_mode do |preference|
    preference.prefers_dark_mode?
  end

  belongs_to :user
end 