class Users::SessionsController < Devise::SessionsController
  respond_to :json
  
  before_action :configure_sign_in_params, only: [:create]
  
  # POST /users/sign_in
  def create
    self.resource = warden.authenticate!(auth_options)
    sign_in(resource_name, resource)
    
    if resource.persisted?
      token = encode_jwt_token(resource)
      render json: {
        message: 'Logged in successfully',
        user: user_data(resource),
        token: token
      }, status: :ok
    else
      render json: {
        message: 'Invalid credentials'
      }, status: :unauthorized
    end
  end

  # DELETE /users/sign_out
  def destroy
    signed_out = (Devise.sign_out_all_scopes ? sign_out : sign_out(resource_name))
    if signed_out
      render json: {
        message: 'Logged out successfully'
      }, status: :ok
    else
      render json: {
        message: 'Could not log out'
      }, status: :unprocessable_entity
    end
  end

  private

  def configure_sign_in_params
    devise_parameter_sanitizer.permit(:sign_in, keys: [:email, :password])
  end

  def encode_jwt_token(user)
    payload = {
      user_id: user.id,
      email: user.email,
      role: user.role,
      exp: 24.hours.from_now.to_i
    }
    
    JWT.encode(payload, jwt_secret, 'HS256')
  end

  def jwt_secret
    Rails.application.credentials.secret_key_base || 'fallback_secret_for_development'
  end

  def user_data(user)
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      timezone: user.timezone,
      created_at: user.created_at
    }
  end

  def respond_with(resource, _opts = {})
    render json: resource
  end

  def respond_to_on_destroy
    render json: { message: 'Logged out successfully' }
  end
end 