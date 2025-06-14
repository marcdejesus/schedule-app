class EmailConfirmationSuccessJob < ApplicationJob
  queue_as :default

  def perform(user_id)
    user = User.find_by(id: user_id)
    return unless user&.confirmed?

    UserMailer.email_confirmation_success(user).deliver_now
  rescue StandardError => e
    Rails.logger.error "Failed to send email confirmation success notification for user #{user_id}: #{e.message}"
    raise e
  end
end 