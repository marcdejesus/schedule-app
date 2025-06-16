class UserSerializer
  include JSONAPI::Serializer

  attributes :id, :email, :name, :role, :timezone, :phone_number, :created_at, :updated_at

  attribute :full_name do |user|
    user.full_name
  end

  has_many :availability_slots, if: proc { |record| record.provider? }
  has_many :provider_appointments, serializer: :appointment, if: proc { |record| record.provider? }
  has_many :client_appointments, serializer: :appointment, if: proc { |record| record.client? }
end 