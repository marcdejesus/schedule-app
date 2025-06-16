# Configure OmniAuth
OmniAuth.configure do |config|
  # Allow GET requests for OAuth flows
  config.allowed_request_methods = [:get, :post]
  config.silence_get_warning = true
  
  # Disable CSRF protection for development
  # In production, you should implement proper CSRF protection
  config.request_validation_phase = nil
  config.before_request_phase = nil
end 