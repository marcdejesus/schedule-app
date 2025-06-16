class Api::V1::UsersController < ApplicationController
  before_action :set_user, only: [:show, :update, :destroy, :upload_avatar]

  # GET /api/v1/users/me
  def me
    render json: UserSerializer.new(current_user).serializable_hash
  end

  # GET /api/v1/users/:id
  def show
    render json: UserSerializer.new(@user).serializable_hash
  end

  # PATCH/PUT /api/v1/users/:id
  def update
    if @user.update(user_params)
      render json: UserSerializer.new(@user).serializable_hash
    else
      render json: {
        error: 'Update failed',
        details: @user.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  # POST /api/v1/users/:id/avatar
  def upload_avatar
    if params[:avatar].present?
      @user.avatar.attach(params[:avatar])
      render json: UserSerializer.new(@user).serializable_hash
    else
      render json: {
        error: 'Avatar file is required'
      }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/users/:id/avatar
  def remove_avatar
    @user = current_user
    @user.avatar.purge if @user.avatar.attached?
    @user.update(avatar_url: nil)
    render json: UserSerializer.new(@user).serializable_hash
  end

  # DELETE /api/v1/users/:id
  def destroy
    return unauthorized unless can_delete_user?
    
    @user.destroy
    head :no_content
  end

  # GET /api/v1/users/providers
  def providers
    providers = User.providers.includes(:availability_slots, :user_preference)
    render json: UserSerializer.new(providers).serializable_hash
  end

  # PATCH /api/v1/users/:id/preferences
  def update_preferences
    @user = current_user
    preferences = @user.preferences
    
    if preferences.update(preferences_params)
      render json: UserPreferenceSerializer.new(preferences).serializable_hash
    else
      render json: {
        error: 'Preferences update failed',
        details: preferences.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  # GET /api/v1/users/:id/preferences
  def preferences
    @user = current_user
    render json: UserPreferenceSerializer.new(@user.preferences).serializable_hash
  end

  private

  def set_user
    @user = User.find(params[:id])
  end

  def user_params
    params.require(:user).permit(
      :name, :timezone, :phone_number, :bio, :avatar_url, :custom_booking_slug,
      specialties: [], social_links: {}
    )
  end

  def preferences_params
    params.require(:user_preference).permit(
      :email_notifications, :appointment_reminders, :booking_confirmations,
      :notification_frequency, :theme, :font_size, :high_contrast,
      :reduced_motion, :screen_reader, :language, :date_format
    )
  end

  def can_delete_user?
    current_user.admin? || current_user == @user
  end
end 