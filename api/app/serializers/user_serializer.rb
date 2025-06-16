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
    user.avatar_url_or_default
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