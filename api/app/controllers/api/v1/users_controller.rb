class Api::V1::UsersController < ApplicationController
  before_action :set_user, only: [:show, :update, :destroy, :upload_avatar, :debug_avatar]

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
    Rails.logger.info "========== Avatar Upload Debug Start =========="
    Rails.logger.info "User ID: #{@user.id}"
    Rails.logger.info "User Email: #{@user.email}"
    Rails.logger.info "Request Headers: #{request.headers.to_h.select { |k, v| k.start_with?('HTTP_') || k.include?('Content') }.inspect}"
    Rails.logger.info "Params Present: #{params.keys}"
    Rails.logger.info "Avatar Param Present: #{params[:avatar].present?}"
    
    if params[:avatar].present?
      avatar_file = params[:avatar]
      Rails.logger.info "Avatar File Info:"
      Rails.logger.info "  - Original Filename: #{avatar_file.original_filename}"
      Rails.logger.info "  - Content Type: #{avatar_file.content_type}"
      Rails.logger.info "  - File Size: #{avatar_file.size} bytes"
      Rails.logger.info "  - Temp File Path: #{avatar_file.tempfile.path if avatar_file.respond_to?(:tempfile)}"
      
      Rails.logger.info "Current User Avatar Status:"
      Rails.logger.info "  - Has existing avatar attached: #{@user.avatar.attached?}"
      if @user.avatar.attached?
        Rails.logger.info "  - Current avatar filename: #{@user.avatar.filename}"
        Rails.logger.info "  - Current avatar content type: #{@user.avatar.content_type}"
        Rails.logger.info "  - Current avatar size: #{@user.avatar.byte_size}"
      end
      
      Rails.logger.info "Starting avatar upload for user #{@user.id}"
      begin
        Rails.logger.info "Attempting to attach avatar..."
        @user.avatar.attach(avatar_file)
        Rails.logger.info "Avatar attach call completed"
        
        # Force reload and check attachment
        @user.reload
        Rails.logger.info "User reloaded. Avatar attached status: #{@user.avatar.attached?}"
        
        if @user.avatar.attached?
          Rails.logger.info "Avatar successfully attached for user #{@user.id}."
          Rails.logger.info "New Avatar Info:"
          Rails.logger.info "  - Filename: #{@user.avatar.filename}"
          Rails.logger.info "  - Content Type: #{@user.avatar.content_type}"
          Rails.logger.info "  - Size: #{@user.avatar.byte_size} bytes"
          Rails.logger.info "  - Key: #{@user.avatar.key}"
          Rails.logger.info "  - Service Name: #{@user.avatar.service_name}"
          
          # Generate avatar URL
          begin
            avatar_url = @user.avatar_url_or_default
            Rails.logger.info "Generated avatar URL: #{avatar_url}"
          rescue => url_error
            Rails.logger.error "Error generating avatar URL: #{url_error.message}"
            Rails.logger.error url_error.backtrace.join("\n")
          end
          
          # Serialize user data
          begin
            serialized_data = UserSerializer.new(@user.reload).serializable_hash
            Rails.logger.info "User serialization successful"
            Rails.logger.info "Serialized avatar_url_full: #{serialized_data.dig(:data, :attributes, :avatar_url_full)}"
            Rails.logger.info "========== Avatar Upload Debug End (Success) =========="
            render json: serialized_data
          rescue => serialization_error
            Rails.logger.error "Error serializing user data: #{serialization_error.message}"
            Rails.logger.error serialization_error.backtrace.join("\n")
            Rails.logger.info "========== Avatar Upload Debug End (Serialization Error) =========="
            render json: { error: 'Avatar uploaded but serialization failed', details: serialization_error.message }, status: :internal_server_error
          end
        else
          Rails.logger.error "Avatar attachment failed for user #{@user.id} after attach call."
          Rails.logger.error "ActiveStorage debug info:"
          Rails.logger.error "  - ActiveStorage::Attachment count: #{ActiveStorage::Attachment.where(record: @user, name: 'avatar').count}"
          Rails.logger.error "  - ActiveStorage::Blob count: #{ActiveStorage::Blob.count}"
          Rails.logger.info "========== Avatar Upload Debug End (Attachment Failed) =========="
          render json: { error: 'Avatar attachment failed' }, status: :unprocessable_entity
        end
      rescue => e
        Rails.logger.error "Error uploading avatar for user #{@user.id}: #{e.message}"
        Rails.logger.error "Error class: #{e.class}"
        Rails.logger.error "Error backtrace:"
        Rails.logger.error e.backtrace.join("\n")
        Rails.logger.info "========== Avatar Upload Debug End (Exception) =========="
        render json: {
          error: 'An unexpected error occurred during avatar upload',
          details: e.message
        }, status: :internal_server_error
      end
    else
      Rails.logger.warn "Avatar upload attempt for user #{@user.id} with no avatar file provided."
      Rails.logger.warn "All params: #{params.inspect}"
      Rails.logger.info "========== Avatar Upload Debug End (No File) =========="
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

  # GET /api/v1/users/:id/avatar/debug
  def debug_avatar
    Rails.logger.info "========== Avatar Debug Info =========="
    Rails.logger.info "User ID: #{@user.id}"
    Rails.logger.info "User Email: #{@user.email}"
    
    debug_info = {
      user_id: @user.id,
      user_email: @user.email,
      avatar_attached: @user.avatar.attached?,
      avatar_url_field: @user.avatar_url,
      active_storage_attachments_count: ActiveStorage::Attachment.where(record: @user, name: 'avatar').count,
      active_storage_blobs_total: ActiveStorage::Blob.count
    }
    
    if @user.avatar.attached?
      debug_info.merge!({
        avatar_filename: @user.avatar.filename.to_s,
        avatar_content_type: @user.avatar.content_type,
        avatar_byte_size: @user.avatar.byte_size,
        avatar_key: @user.avatar.key,
        avatar_service_name: @user.avatar.service_name,
        avatar_created_at: @user.avatar.created_at
      })
      
      begin
        debug_info[:generated_avatar_url] = @user.avatar_url_or_default
      rescue => e
        debug_info[:avatar_url_error] = e.message
      end
    end
    
    Rails.logger.info "Debug info: #{debug_info}"
    Rails.logger.info "========== Avatar Debug Info End =========="
    
    render json: { 
      message: 'Avatar debug info generated',
      debug_info: debug_info,
      timestamp: Time.current
    }
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