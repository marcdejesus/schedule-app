class Api::V1::Auth::PasswordsController < ApplicationController
  skip_before_action :authenticate_user_from_token!, except: [:change]

  # POST /api/v1/auth/password/reset
  def create
    user = User.find_by(email: params[:email])
    
    if user.nil?
      render json: { 
        error: 'User not found',
        message: 'No account found with that email address'
      }, status: :not_found
      return
    end

    unless user.can_request_password_reset?
      render json: { 
        error: 'Too many requests',
        message: 'A password reset was already requested recently. Please check your email or wait before requesting another.'
      }, status: :too_many_requests
      return
    end

    # Generate password reset token
    token = user.send_reset_password_instructions
    
    if token
      # Send email via background job
      PasswordResetJob.perform_later(user.id, token)
      
      render json: {
        message: 'Password reset instructions sent to your email',
        status: 'success'
      }, status: :ok
    else
      render json: {
        error: 'Unable to send reset instructions',
        message: 'Please try again later'
      }, status: :unprocessable_entity
    end
  end

  # PUT /api/v1/auth/password/reset
  def update
    user = User.reset_password_by_token(password_reset_params)
    
    if user&.persisted?
      # Send password changed notification
      PasswordChangedJob.perform_later(user.id)
      
      render json: {
        message: 'Password updated successfully',
        status: 'success'
      }, status: :ok
    else
      errors = user&.errors&.full_messages || ['Invalid or expired reset token']
      render json: {
        error: 'Password reset failed',
        message: errors.first,
        details: errors
      }, status: :unprocessable_entity
    end
  end

  # GET /api/v1/auth/password/reset/verify?reset_password_token=token
  def edit
    user = User.find_by_reset_password_token(params[:reset_password_token])
    
    if user.nil? || !user.reset_password_period_valid?
      render json: {
        error: 'Invalid or expired token',
        message: 'The password reset token is invalid or has expired'
      }, status: :unprocessable_entity
    else
      render json: {
        message: 'Token is valid',
        status: 'success',
        user: {
          email: user.email,
          name: user.name
        }
      }, status: :ok
    end
  end

  # PUT /api/v1/auth/password/change
  def change
    user = current_user
    
    unless user.valid_password?(params[:current_password])
      render json: {
        error: 'Invalid current password',
        message: 'The current password you entered is incorrect'
      }, status: :unprocessable_entity
      return
    end

    if user.update(password: params[:password], password_confirmation: params[:password_confirmation])
      # Send password changed notification (temporarily disabled)
      # PasswordChangedJob.perform_later(user.id)
      
      # Generate new JWT token for security
      new_token = encode_jwt_token(user)
      
      render json: {
        message: 'Password changed successfully',
        status: 'success',
        token: new_token
      }, status: :ok
    else
      Rails.logger.error "Password change failed for user #{user.id}: #{user.errors.full_messages}"
      render json: {
        error: 'Password change failed',
        message: user.errors.full_messages.first || 'Password validation failed',
        details: user.errors.full_messages,
        validation_errors: user.errors.as_json
      }, status: :unprocessable_entity
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

  def password_reset_params
    params.permit(:password, :password_confirmation, :reset_password_token)
  end
end 