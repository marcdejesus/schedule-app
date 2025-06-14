# frozen_string_literal: true

FactoryBot.define do
  factory :user do
    email { Faker::Internet.email }
    name { Faker::Name.name }
    password { 'password123' }
    password_confirmation { 'password123' }
    role { 'client' }
  end

  factory :provider, parent: :user do
    role { 'provider' }
  end

  factory :admin, parent: :user do
    role { 'admin' }
  end
end 