class Users::OmniauthCallbacksController < Devise::OmniauthCallbacksController
  skip_before_action :authenticate_user_from_token!
  respond_to :json

  def google_oauth2
    Rails.logger.info "OmniAuth callback received: #{request.env['omniauth.auth'].to_h.inspect}"
    @user = User.from_omniauth(request.env["omniauth.auth"])
    token = nil
    
    # Check if this is a signup flow using the state parameter
    is_signup = false
    if request.env['omniauth.params'] && request.env['omniauth.params']['state']
      begin
        state = JSON.parse(URI.decode_www_form_component(request.env['omniauth.params']['state']))
        is_signup = state['signup'] == true
        Rails.logger.info "OAuth signup flow detected from state parameter: #{is_signup}"
      rescue JSON::ParserError => e
        Rails.logger.warn "Could not parse state parameter: #{e.message}"
      end
    end

    if @user.persisted?
      Rails.logger.info "User persisted: #{@user.email}"
      sign_in @user
      token = encode_jwt_token(@user)
      Rails.logger.info "Generated JWT for user: #{@user.email}"
      
      if request.xhr?
        render json: {
          message: 'Successfully authenticated with Google',
          user: user_data(@user),
          token: token
        }, status: :ok
      else
        # Add signup parameter if this was a signup flow
        redirect_url = "#{frontend_url}/auth/callback?token=#{token}&success=true"
        redirect_url += "&signup=true" if is_signup
        Rails.logger.info "Redirecting to frontend: #{redirect_url}"
        redirect_to redirect_url
      end
    else
      Rails.logger.error "User not persisted. Errors: #{@user.errors.full_messages.join(', ')}"
      render json: {
        message: 'Could not authenticate with Google',
        errors: @user.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  def failure
    error_message = params[:error_description] || 'Authentication failed'
    Rails.logger.error "OmniAuth failure: #{error_message}"
    
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
    Rails.application.credentials.secret_key_base || ENV['JWT_SECRET'] || 'fallback_secret_for_development'
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