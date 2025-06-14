# frozen_string_literal: true

FactoryBot.define do
  factory :user do
    sequence(:email) { |n| "user#{n}@example.com" }
    name { "Test User" }
    password { 'password123' }
    password_confirmation { 'password123' }
    role { 'client' }
    timezone { 'UTC' }
  end

  factory :provider, parent: :user do
    role { 'provider' }
    sequence(:name) { |n| "Provider #{n}" }
  end

  factory :admin, parent: :user do
    role { 'admin' }
    sequence(:name) { |n| "Admin #{n}" }
  end
end 