module JwtAuthenticatable
  extend ActiveSupport::Concern

  included do
    before_action :authenticate_user_from_jwt
    attr_reader :current_user
  end

  private

  def authenticate_user_from_jwt
    token = extract_token_from_request
    return render_unauthorized unless token

    @current_user = JwtService.get_user_from_token(token)
    return render_unauthorized unless @current_user && JwtService.valid_token?(token)
  end

  def extract_token_from_request
    auth_header = request.headers['Authorization']
    return nil unless auth_header && auth_header.start_with?('Bearer ')
    
    auth_header.split(' ').last
  end

  def render_unauthorized
    render json: {
      message: 'Unauthorized access. Please login.',
      error: 'invalid_token'
    }, status: :unauthorized
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