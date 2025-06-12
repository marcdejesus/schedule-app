class Api::V1::UsersController < ApplicationController
  before_action :set_user, only: [:show, :update, :destroy]

  # GET /api/v1/users/me
  def me
    render json: UserSerializer.new(current_user).serialized_json
  end

  # GET /api/v1/users/:id
  def show
    render json: UserSerializer.new(@user).serialized_json
  end

  # PATCH/PUT /api/v1/users/:id
  def update
    if @user.update(user_params)
      render json: UserSerializer.new(@user).serialized_json
    else
      render json: {
        error: 'Update failed',
        details: @user.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  # DELETE /api/v1/users/:id
  def destroy
    return unauthorized unless can_delete_user?
    
    @user.destroy
    head :no_content
  end

  # GET /api/v1/users/providers
  def providers
    providers = User.providers.includes(:availability_slots)
    render json: UserSerializer.new(providers).serialized_json
  end

  private

  def set_user
    @user = User.find(params[:id])
  end

  def user_params
    params.require(:user).permit(:name, :timezone, :phone_number)
  end

  def can_delete_user?
    current_user.admin? || current_user == @user
  end
end 