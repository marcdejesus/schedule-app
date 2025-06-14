class NotificationMailer < ApplicationMailer
  def appointment_created(appointment, recipient)
    @appointment = appointment
    @recipient = recipient
    
    mail(
      to: recipient.email,
      subject: "Appointment #{appointment.status.capitalize}: #{appointment.formatted_date}"
    )
  end

  def appointment_status_changed(appointment, recipient)
    @appointment = appointment
    @recipient = recipient
    
    mail(
      to: recipient.email,
      subject: "Appointment Status Updated: #{appointment.status.capitalize}"
    )
  end
end 