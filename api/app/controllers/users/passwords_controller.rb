class Users::PasswordsController < Devise::PasswordsController
  respond_to :json

  # POST /users/password
  def create
    user = User.find_by(email: params[:user][:email])
    
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

  # PUT /users/password
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

  # GET /users/password/edit?reset_password_token=token
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

  private

  def password_reset_params
    params.require(:user).permit(:password, :password_confirmation, :reset_password_token)
  end
end 