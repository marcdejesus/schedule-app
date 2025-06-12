class Api::V1::AvailabilitySlotsController < ApplicationController
  before_action :set_availability_slot, only: [:show, :update, :destroy]
  before_action :ensure_provider, only: [:create, :update, :destroy]

  # GET /api/v1/availability_slots
  def index
    if params[:user_id]
      user = User.find(params[:user_id])
      slots = user.availability_slots.includes(:user)
    else
      return unauthorized unless current_user.provider? || current_user.admin?
      slots = current_user.availability_slots
    end

    # Apply date filtering if provided
    if params[:date]
      date = Date.parse(params[:date])
      slots = slots.for_date(date)
    end

    # Apply availability filtering
    if params[:available_only] == 'true'
      slots = slots.available
    end

    render json: AvailabilitySlotSerializer.new(slots).serialized_json
  end

  # GET /api/v1/availability_slots/:id
  def show
    render json: AvailabilitySlotSerializer.new(@availability_slot).serialized_json
  end

  # POST /api/v1/availability_slots
  def create
    @availability_slot = current_user.availability_slots.build(availability_slot_params)

    if @availability_slot.save
      render json: AvailabilitySlotSerializer.new(@availability_slot).serialized_json, 
             status: :created
    else
      render json: {
        error: 'Creation failed',
        details: @availability_slot.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  # PATCH/PUT /api/v1/availability_slots/:id
  def update
    return unauthorized unless can_modify_slot?

    if @availability_slot.update(availability_slot_params)
      render json: AvailabilitySlotSerializer.new(@availability_slot).serialized_json
    else
      render json: {
        error: 'Update failed',
        details: @availability_slot.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/availability_slots/:id
  def destroy
    return unauthorized unless can_modify_slot?

    @availability_slot.destroy
    head :no_content
  end

  # GET /api/v1/availability_slots/available
  def available
    user_id = params[:user_id] || current_user.id
    user = User.find(user_id)
    
    return forbidden unless user.provider?

    date = params[:date] ? Date.parse(params[:date]) : Date.current
    slots = user.availability_slots.for_date(date).available

    render json: AvailabilitySlotSerializer.new(slots).serialized_json
  end

  private

  def set_availability_slot
    @availability_slot = AvailabilitySlot.find(params[:id])
  end

  def availability_slot_params
    params.require(:availability_slot).permit(:start_time, :end_time, :recurring, :notes)
  end

  def ensure_provider
    return forbidden unless current_user.provider? || current_user.admin?
  end

  def can_modify_slot?
    current_user.admin? || @availability_slot.user == current_user
  end
end 