class Api::V1::AppointmentsController < ApplicationController
  before_action :set_appointment, only: [:show, :update, :destroy, :cancel, :confirm]

  # GET /api/v1/appointments
  def index
    appointments = current_user.appointments.includes(:provider, :client, :notifications)

    # Apply filtering
    appointments = filter_appointments(appointments)

    render json: AppointmentSerializer.new(appointments).serialized_json
  end

  # GET /api/v1/appointments/:id
  def show
    return unauthorized unless can_view_appointment?
    
    render json: AppointmentSerializer.new(@appointment).serialized_json
  end

  # POST /api/v1/appointments
  def create
    @appointment = Appointment.new(appointment_params)
    @appointment.client = current_user if current_user.client?

    if @appointment.save
      render json: AppointmentSerializer.new(@appointment).serialized_json, 
             status: :created
    else
      render json: {
        error: 'Booking failed',
        details: @appointment.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /api/v1/appointments/:id
  def update
    return unauthorized unless can_modify_appointment?

    if @appointment.update(appointment_update_params)
      render json: AppointmentSerializer.new(@appointment).serialized_json
    else
      render json: {
        error: 'Update failed',
        details: @appointment.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/appointments/:id
  def destroy
    return unauthorized unless can_modify_appointment?
    return forbidden unless @appointment.can_be_cancelled?

    @appointment.destroy
    head :no_content
  end

  # PATCH /api/v1/appointments/:id/cancel
  def cancel
    return unauthorized unless can_modify_appointment?
    return forbidden unless @appointment.can_be_cancelled?

    cancellation_reason = params[:cancellation_reason]
    
    if @appointment.update(status: :cancelled, cancellation_reason: cancellation_reason)
      render json: AppointmentSerializer.new(@appointment).serialized_json
    else
      render json: {
        error: 'Cancellation failed',
        details: @appointment.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  # PATCH /api/v1/appointments/:id/confirm
  def confirm
    return unauthorized unless can_confirm_appointment?

    if @appointment.update(status: :confirmed)
      render json: AppointmentSerializer.new(@appointment).serialized_json
    else
      render json: {
        error: 'Confirmation failed',
        details: @appointment.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  # GET /api/v1/appointments/upcoming
  def upcoming
    appointments = current_user.appointments.upcoming.includes(:provider, :client)
    render json: AppointmentSerializer.new(appointments).serialized_json
  end

  # GET /api/v1/appointments/past
  def past
    appointments = current_user.appointments.past.includes(:provider, :client)
    render json: AppointmentSerializer.new(appointments).serialized_json
  end

  private

  def set_appointment
    @appointment = Appointment.find(params[:id])
  end

  def appointment_params
    params.require(:appointment).permit(:provider_id, :client_id, :start_time, :end_time, :notes)
  end

  def appointment_update_params
    params.require(:appointment).permit(:start_time, :end_time, :notes)
  end

  def filter_appointments(appointments)
    # Filter by date range
    if params[:start_date] && params[:end_date]
      start_date = Date.parse(params[:start_date])
      end_date = Date.parse(params[:end_date])
      appointments = appointments.where(start_time: start_date.beginning_of_day..end_date.end_of_day)
    end

    # Filter by status
    if params[:status]
      appointments = appointments.where(status: params[:status])
    end

    # Filter by provider
    if params[:provider_id]
      appointments = appointments.where(provider_id: params[:provider_id])
    end

    appointments
  end

  def can_view_appointment?
    current_user.admin? || 
    @appointment.provider == current_user || 
    @appointment.client == current_user
  end

  def can_modify_appointment?
    current_user.admin? || 
    @appointment.provider == current_user || 
    @appointment.client == current_user
  end

  def can_confirm_appointment?
    current_user.admin? || @appointment.provider == current_user
  end
end 