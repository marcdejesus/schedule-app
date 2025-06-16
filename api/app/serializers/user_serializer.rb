class UserSerializer
  include JSONAPI::Serializer

  attributes :id, :email, :name, :role, :timezone, :phone_number, :created_at, :updated_at,
             :bio, :avatar_url, :custom_booking_slug, :social_links

  attribute :full_name do |user|
    user.full_name
  end

  attribute :specialties do |user|
    user.specialties_array
  end

  attribute :social_links_parsed do |user|
    user.social_links_hash
  end

  attribute :avatar_url_full do |user|
    begin
      Rails.logger.debug "UserSerializer: Generating avatar_url_full for user #{user.id}"
      Rails.logger.debug "  - Avatar attached: #{user.avatar.attached?}"
      if user.avatar.attached?
        Rails.logger.debug "  - Avatar filename: #{user.avatar.filename}"
        Rails.logger.debug "  - Avatar content type: #{user.avatar.content_type}"
        Rails.logger.debug "  - Avatar key: #{user.avatar.key}"
      end
      Rails.logger.debug "  - avatar_url field: #{user.avatar_url}"
      
      url = user.avatar_url_or_default
      Rails.logger.debug "  - Generated URL: #{url}"
      url
    rescue => e
      Rails.logger.error "UserSerializer: Error generating avatar_url_full for user #{user.id}: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      user.gravatar_url # Fallback to gravatar
    end
  end

  attribute :booking_url_slug do |user|
    user.booking_url_slug
  end

  attribute :public_booking_url do |user|
    user.public_booking_url
  end

  attribute :has_complete_profile do |user|
    user.has_complete_profile?
  end

  has_many :availability_slots, if: proc { |record| record.provider? }
  has_many :provider_appointments, serializer: :appointment, if: proc { |record| record.provider? }
  has_many :client_appointments, serializer: :appointment, if: proc { |record| record.client? }
  has_one :user_preference, if: proc { |record, params| params && params[:include_preferences] }
end 