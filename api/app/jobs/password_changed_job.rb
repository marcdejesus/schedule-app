class PasswordChangedJob < ApplicationJob
  queue_as :default

  def perform(user_id)
    user = User.find_by(id: user_id)
    return unless user

    UserMailer.password_changed_notification(user).deliver_now
  rescue StandardError => e
    Rails.logger.error "Failed to send password changed notification for user #{user_id}: #{e.message}"
    raise e
  end
end 