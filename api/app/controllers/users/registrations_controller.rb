class Users::RegistrationsController < Devise::RegistrationsController
  respond_to :json

  before_action :configure_sign_up_params, only: [:create]
  before_action :configure_account_update_params, only: [:update]

  # POST /users
  def create
    build_resource(sign_up_params)

    if resource.save
      sign_up(resource_name, resource)
      token = encode_jwt_token(resource)
      render json: {
        message: 'Signed up successfully',
        user: user_data(resource),
        token: token
      }, status: :created
    else
      render json: {
        message: 'Could not create user',
        errors: resource.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  # PUT /users
  def update
    self.resource = resource_class.to_adapter.get!(send(:"current_#{resource_name}").to_key)
    prev_unconfirmed_email = resource.unconfirmed_email if resource.respond_to?(:unconfirmed_email)

    if update_resource(resource, account_update_params)
      bypass_sign_in resource, scope: resource_name if sign_in_after_change_password?
      render json: {
        message: 'Account updated successfully',
        user: user_data(resource)
      }, status: :ok
    else
      render json: {
        message: 'Could not update user',
        errors: resource.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  # DELETE /users
  def destroy
    resource.destroy
    render json: {
      message: 'Account deleted successfully'
    }, status: :ok
  end

  private

  def configure_sign_up_params
    devise_parameter_sanitizer.permit(:sign_up, keys: [:name, :email, :password, :password_confirmation, :role, :timezone])
  end

  def configure_account_update_params
    devise_parameter_sanitizer.permit(:account_update, keys: [:name, :email, :password, :password_confirmation, :current_password, :role, :timezone])
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
end 