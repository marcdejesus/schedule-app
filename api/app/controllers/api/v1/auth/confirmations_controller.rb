class Api::V1::Auth::ConfirmationsController < ApplicationController
  skip_before_action :authenticate_user!

  # POST /api/v1/auth/email/resend_confirmation
  def create
    user = User.find_by(email: params[:email])
    
    if user.nil?
      render json: { 
        error: 'User not found',
        message: 'No account found with that email address'
      }, status: :not_found
      return
    end

    if user.confirmed?
      render json: { 
        error: 'Already confirmed',
        message: 'Email address is already confirmed'
      }, status: :unprocessable_entity
      return
    end

    # Generate confirmation token and send email
    token = user.confirmation_token || user.generate_confirmation_token
    user.save!
    
    # Send confirmation email via background job
    EmailConfirmationJob.perform_later(user.id, token)
    
    render json: {
      message: 'Confirmation instructions sent to your email',
      status: 'success'
    }, status: :ok
  end

  # GET /api/v1/auth/email/confirm?confirmation_token=token
  def show
    user = User.confirm_by_token(params[:confirmation_token])
    
    if user&.persisted? && user.confirmed?
      # Send welcome email after confirmation
      EmailConfirmationSuccessJob.perform_later(user.id)
      
      render json: {
        message: 'Email confirmed successfully',
        status: 'success',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          confirmed_at: user.confirmed_at
        }
      }, status: :ok
    else
      errors = user&.errors&.full_messages || ['Invalid or expired confirmation token']
      render json: {
        error: 'Email confirmation failed',
        message: errors.first,
        details: errors
      }, status: :unprocessable_entity
    end
  end

  # GET /api/v1/auth/email/verify?confirmation_token=token
  def verify
    user = User.find_by_confirmation_token(params[:confirmation_token])
    
    if user.nil?
      render json: {
        error: 'Invalid token',
        message: 'The confirmation token is invalid'
      }, status: :unprocessable_entity
    elsif user.confirmed?
      render json: {
        error: 'Already confirmed',
        message: 'Email address is already confirmed'
      }, status: :unprocessable_entity
    elsif user.confirmation_period_expired?
      render json: {
        error: 'Token expired',
        message: 'The confirmation token has expired. Please request a new one.'
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
end 