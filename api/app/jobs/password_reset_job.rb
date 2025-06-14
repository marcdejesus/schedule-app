class PasswordResetJob < ApplicationJob
  queue_as :default

  def perform(user_id, token)
    user = User.find_by(id: user_id)
    return unless user&.reset_password_token.present?

    UserMailer.password_reset_instructions(user, token).deliver_now
  rescue StandardError => e
    Rails.logger.error "Failed to send password reset email for user #{user_id}: #{e.message}"
    raise e
  end
end 