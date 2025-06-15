module JwtAuthenticatable
  extend ActiveSupport::Concern

  included do
    before_action :authenticate_user_from_token!
    attr_reader :current_user
  end

  private

  def authenticate_user_from_token!
    token = request.headers['Authorization']&.split(' ')&.last
    
    unless token
      Rails.logger.debug "JwtAuthenticatable: No token provided in Authorization header"
      render json: { error: 'Authentication required' }, status: :unauthorized
      return
    end

    begin
      Rails.logger.debug "JwtAuthenticatable: Attempting to decode token"
      decoded_token = JWT.decode(token, Rails.application.credentials.secret_key_base || 'fallback_secret_for_development', true, algorithm: 'HS256')
      user_id = decoded_token[0]['user_id']
      @current_user = User.find(user_id)
      Rails.logger.debug "JwtAuthenticatable: Successfully authenticated user #{@current_user.id}"
    rescue JWT::DecodeError => e
      Rails.logger.error "JwtAuthenticatable: JWT decode error - #{e.message}"
      render json: { error: 'Invalid token' }, status: :unauthorized
    rescue JWT::ExpiredSignature => e
      Rails.logger.error "JwtAuthenticatable: JWT expired - #{e.message}"
      render json: { error: 'Token expired' }, status: :unauthorized
    rescue ActiveRecord::RecordNotFound => e
      Rails.logger.error "JwtAuthenticatable: User not found - #{e.message}"
      render json: { error: 'Invalid token' }, status: :unauthorized
    rescue => e
      Rails.logger.error "JwtAuthenticatable: Unexpected error - #{e.message}"
      render json: { error: 'Authentication failed' }, status: :unauthorized
    end
  end

  def current_user
    @current_user
  end

  def require_admin
    return render_forbidden unless current_user&.admin?
  end

  def require_provider
    return render_forbidden unless current_user&.provider? || current_user&.admin?
  end

  def require_provider_or_owner(resource_user_id)
    return render_forbidden unless current_user&.admin? || 
                                   current_user&.provider? || 
                                   current_user&.id == resource_user_id
  end

  def render_forbidden
    render json: {
      message: 'Forbidden. Insufficient permissions.',
      error: 'insufficient_permissions'
    }, status: :forbidden
  end
end 