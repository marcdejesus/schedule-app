class Users::OmniauthCallbacksController < Devise::OmniauthCallbacksController
  skip_before_action :authenticate_user_unless_public_endpoint!
  respond_to :json

  def google_oauth2
    @user = User.from_omniauth(request.env["omniauth.auth"])
    token = nil

    if @user.persisted?
      sign_in @user
      token = encode_jwt_token(@user)
      
      if request.xhr?
        render json: {
          message: 'Successfully authenticated with Google',
          user: user_data(@user),
          token: token
        }, status: :ok
      else
        # For web-based OAuth flow, redirect to frontend with token
        redirect_to "#{frontend_url}/auth/callback?token=#{token}&success=true"
      end
    else
      render json: {
        message: 'Could not authenticate with Google',
        errors: @user.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  def failure
    error_message = params[:error_description] || 'Authentication failed'
    
    if request.xhr?
      render json: {
        message: 'Authentication failed',
        error: error_message
      }, status: :unprocessable_entity
    else
      redirect_to "#{frontend_url}/auth/callback?success=false&error=#{error_message}"
    end
  end

  private

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

  def frontend_url
    ENV['FRONTEND_URL'] || 'http://localhost:3000'
  end
end 