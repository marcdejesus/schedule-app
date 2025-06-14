# frozen_string_literal: true

Devise.setup do |config|
  config.jwt do |jwt|
    jwt.secret = Rails.application.credentials.secret_key_base
    jwt.dispatch_requests = [
      ['POST', %r{^/api/v1/sessions$}]
    ]
    jwt.revocation_requests = [
      ['DELETE', %r{^/api/v1/sessions$}]
    ]
    jwt.expiration_time = 24.hours.to_i
  end
end 