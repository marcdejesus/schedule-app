class ApplicationController < ActionController::API
  before_action :authenticate_user_unless_public_endpoint!
  before_action :configure_permitted_parameters, if: :devise_controller?

  rescue_from ActiveRecord::RecordNotFound, with: :not_found
  rescue_from ActiveRecord::RecordInvalid, with: :unprocessable_entity
  rescue_from ActionController::ParameterMissing, with: :bad_request

  private

  def current_user_serialized
    UserSerializer.new(current_user).serialized_json
  end

  def not_found(exception)
    render json: { 
      error: 'Record not found',
      message: exception.message 
    }, status: :not_found
  end

  def unprocessable_entity(exception)
    render json: { 
      error: 'Validation failed',
      message: exception.message,
      details: exception.record&.errors&.full_messages
    }, status: :unprocessable_entity
  end

  def bad_request(exception)
    render json: { 
      error: 'Bad request',
      message: exception.message 
    }, status: :bad_request
  end

  def unauthorized
    render json: { 
      error: 'Unauthorized',
      message: 'You are not authorized to perform this action'
    }, status: :unauthorized
  end

  def forbidden
    render json: { 
      error: 'Forbidden',
      message: 'Access denied'
    }, status: :forbidden
  end

  def authenticate_user_unless_public_endpoint!
    # Skip authentication for public endpoints
    return if public_endpoint?
    
    authenticate_user!
  end

  def public_endpoint?
    # Define public endpoints that don't require authentication
    public_routes = [
      '/health',
      '/users/sign_in',
      '/users/sign_up', 
      '/users',  # POST for registration
      '/users/password',  # Password reset
      '/users/confirmation',  # Email confirmation
      '/api/v1/sessions',  # API login
      '/api/v1/auth/password/reset',  # API password reset
      '/api/v1/auth/email/confirm',  # API email confirmation
      '/api/v1/auth/email/resend_confirmation'  # API resend confirmation
    ]
    
    # Check if current route matches any public route
    return true if public_routes.include?(request.path)
    
    # Check if it's a Devise controller action that should be public
    return true if devise_controller? && %w[sessions registrations passwords confirmations].include?(controller_name) && %w[new create edit update].include?(action_name)
    
    false
  end

  def authenticate_user!
    # For API endpoints, use JWT authentication
    token = request.headers['Authorization']&.split(' ')&.last
    
    if token
      begin
        decoded = JWT.decode(token, Rails.application.credentials.secret_key_base || Rails.application.secrets.secret_key_base, true, { algorithm: 'HS256' })
        @current_user = User.find(decoded[0]['user_id'])
      rescue JWT::DecodeError, JWT::ExpiredSignature, ActiveRecord::RecordNotFound
        render json: { error: 'Invalid or expired token' }, status: :unauthorized
      end
    else
      render json: { error: 'Authorization token required' }, status: :unauthorized
    end
  end

  def current_user
    @current_user
  end

  protected

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: [:name, :role, :timezone, :phone_number])
    devise_parameter_sanitizer.permit(:account_update, keys: [:name, :timezone, :phone_number])
  end
end 