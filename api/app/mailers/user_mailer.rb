class UserMailer < ApplicationMailer
  def welcome_email(user)
    @user = user
    @frontend_url = ENV.fetch('FRONTEND_URL', 'http://localhost:3000')
    
    mail(
      to: @user.email,
      subject: 'Welcome to ScheduleEase!'
    )
  end

  def password_reset_instructions(user, token)
    @user = user
    @token = token
    @frontend_url = ENV.fetch('FRONTEND_URL', 'http://localhost:3000')
    @reset_url = "#{@frontend_url}/reset-password?token=#{@token}"
    
    mail(
      to: @user.email,
      subject: 'Password Reset Instructions'
    )
  end

  def email_confirmation_instructions(user, token)
    @user = user
    @token = token
    @frontend_url = ENV.fetch('FRONTEND_URL', 'http://localhost:3000')
    @confirmation_url = "#{@frontend_url}/confirm-email?token=#{@token}"
    
    mail(
      to: @user.email,
      subject: 'Please confirm your email address'
    )
  end

  def email_confirmation_success(user)
    @user = user
    @frontend_url = ENV.fetch('FRONTEND_URL', 'http://localhost:3000')
    
    mail(
      to: @user.email,
      subject: 'Email confirmed successfully!'
    )
  end

  def password_changed_notification(user)
    @user = user
    @frontend_url = ENV.fetch('FRONTEND_URL', 'http://localhost:3000')
    
    mail(
      to: @user.email,
      subject: 'Your password has been changed'
    )
  end
end 