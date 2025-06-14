class NotificationJob < ApplicationJob
  queue_as :default

  def perform(appointment_id:, type:, recipient_ids:)
    appointment = Appointment.find(appointment_id)
    recipients = User.where(id: recipient_ids)
    
    case type
    when 'appointment_created'
      recipients.each do |recipient|
        NotificationMailer.appointment_created(appointment, recipient).deliver_now
      end
    when 'appointment_status_changed'
      recipients.each do |recipient|
        NotificationMailer.appointment_status_changed(appointment, recipient).deliver_now
      end
    end
  rescue ActiveRecord::RecordNotFound => e
    Rails.logger.error "NotificationJob failed: #{e.message}"
  end
end 