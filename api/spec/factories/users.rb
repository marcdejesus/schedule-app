# frozen_string_literal: true

FactoryBot.define do
  factory :user do
    sequence(:email) { |n| "user#{n}@example.com" }
    sequence(:name) { |n| "User #{n}" }
    password { 'password123' }
    password_confirmation { 'password123' }
    confirmed_at { Time.current }
    role { :client }
    timezone { 'UTC' }

    trait :admin do
      role { :admin }
      sequence(:email) { |n| "admin#{n}@example.com" }
      sequence(:name) { |n| "Admin #{n}" }
    end

    trait :provider do
      role { :provider }
      sequence(:email) { |n| "provider#{n}@example.com" }
      sequence(:name) { |n| "Provider #{n}" }
      title { 'Professional Services' }
      bio { 'Experienced professional providing quality services.' }
    end

    trait :client do
      role { :client }
      sequence(:email) { |n| "client#{n}@example.com" }
      sequence(:name) { |n| "Client #{n}" }
    end

    trait :unconfirmed do
      confirmed_at { nil }
    end

    trait :with_google_auth do
      provider { 'google_oauth2' }
      uid { SecureRandom.hex(10) }
    end
  end
end 