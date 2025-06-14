class Api::V1::SessionsController < ApplicationController
  # GET /api/v1/sessions
  def index
    render json: {
      sessions: {
        current_session: current_session_info,
        total_active_sessions: current_user.sessions_active? ? 1 : 0,
        last_sign_in_at: current_user.last_sign_in_at,
        last_sign_in_ip: current_user.last_sign_in_ip,
        sign_in_count: current_user.sign_in_count
      }
    }, status: :unauthorized
  end

  # POST /api/v1/sessions
  def create
    user = User.find_by(email: params[:email])
    
    if user&.valid_password?(params[:password])
      # Temporarily skip email confirmation check
      # unless user.confirmed?
      #   render json: {
      #     error: 'Email not confirmed',
      #     message: 'Please confirm your email address before signing in',
      #     confirmation_required: true
      #   }, status: :unauthorized
      #   return
      # end

      # Generate JWT token via devise-jwt
      token = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first
      
      # Update sign in tracking
      user.update!(
        sign_in_count: user.sign_in_count + 1,
        current_sign_in_at: Time.current,
        last_sign_in_at: user.current_sign_in_at,
        current_sign_in_ip: request.remote_ip,
        last_sign_in_ip: user.current_sign_in_ip,
        remember_created_at: params[:remember_me] ? Time.current : nil
      )

      render json: {
        message: 'Signed in successfully',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          timezone: user.timezone,
          created_at: user.created_at
        },
        token: token,
        session: current_session_info(user)
      }, status: :ok
    else
      render json: {
        error: 'Invalid credentials',
        message: 'Invalid email or password'
      }, status: :unauthorized
    end
  end

  # DELETE /api/v1/sessions
  def destroy
    if current_user
      # Sign out via devise-jwt
      Warden::JWTAuth::TokenRevoker.new.call(request.headers['Authorization']&.split(' ')&.last)
      render json: {
        message: 'Signed out successfully'
      }, status: :ok
    else
      render json: {
        error: 'Not signed in'
      }, status: :unauthorized
    end
  end

  # DELETE /api/v1/sessions/all
  def destroy_all_sessions
    if current_user
      current_user.update!(remember_created_at: nil)
      render json: {
        message: 'All sessions terminated successfully'
      }, status: :ok
    else
      render json: {
        error: 'Not signed in'
      }, status: :unauthorized
    end
  end

  # GET /api/v1/sessions/current
  def current
    if current_user
      render json: {
        user: {
          id: current_user.id,
          name: current_user.name,
          email: current_user.email,
          role: current_user.role,
          timezone: current_user.timezone,
          created_at: current_user.created_at
        },
        session: current_session_info,
        authenticated: true
      }, status: :ok
    else
      render json: {
        authenticated: false,
        message: 'Not signed in'
      }, status: :unauthorized
    end
  end

  private

  def current_session_info(user = current_user)
    return nil unless user

    {
      sign_in_count: user.sign_in_count,
      current_sign_in_at: user.current_sign_in_at,
      last_sign_in_at: user.last_sign_in_at,
      current_sign_in_ip: user.current_sign_in_ip,
      last_sign_in_ip: user.last_sign_in_ip,
      remember_created_at: user.remember_created_at,
      session_active: user.sessions_active?
    }
  end

  def generate_jwt_token(user)
    payload = {
      user_id: user.id,
      email: user.email,
      exp: 24.hours.from_now.to_i
    }
    JWT.encode(payload, Rails.application.secrets.secret_key_base)
  end
end 