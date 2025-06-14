# api/app/controllers/api/v1/providers_controller.rb
class Api::V1::ProvidersController < ApplicationController
  def index
    providers = User.where(role: :provider)
    render json: providers
  end
end 