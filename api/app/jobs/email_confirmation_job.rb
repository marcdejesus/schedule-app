class EmailConfirmationJob < ApplicationJob
  queue_as :default

  def perform(user_id, token)
    user = User.find_by(id: user_id)
    return unless user&.confirmation_token.present?

    UserMailer.email_confirmation_instructions(user, token).deliver_now
  rescue StandardError => e
    Rails.logger.error "Failed to send email confirmation for user #{user_id}: #{e.message}"
    raise e
  end
end 