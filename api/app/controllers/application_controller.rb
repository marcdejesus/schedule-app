class ApplicationController < ActionController::API
  include JwtAuthenticatable
  before_action :configure_permitted_parameters, if: :devise_controller?

  rescue_from ActiveRecord::RecordNotFound, with: :not_found
  rescue_from ActiveRecord::RecordInvalid, with: :unprocessable_entity
  rescue_from ActionController::ParameterMissing, with: :bad_request

  private

  def current_user_serialized
    UserSerializer.new(current_user).serializable_hash
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

  protected

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: [:name, :role, :timezone, :phone_number])
    devise_parameter_sanitizer.permit(:account_update, keys: [:name, :timezone, :phone_number])
  end
end 