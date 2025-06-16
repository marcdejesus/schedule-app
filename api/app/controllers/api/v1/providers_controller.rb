# api/app/controllers/api/v1/providers_controller.rb
class Api::V1::ProvidersController < ApplicationController
  # GET /api/v1/providers
  def index
    providers = User.where(role: :provider).includes(:provider_appointments)
    
    # Add some useful computed fields
    providers_with_details = providers.map do |provider|
      {
        id: provider.id,
        name: provider.name,
        email: provider.email,
        role: provider.role,
        created_at: provider.created_at,
        updated_at: provider.updated_at,
        appointment_count: provider.provider_appointments.count,
        available_for_booking: true, # This could be based on availability slots
        verified: true, # This could be based on some verification process
        rating: 4.8, # This could come from a reviews system
        specialties: [], # This could come from a provider profile
        timezone: provider.timezone || 'UTC'
      }
    end
    
    render json: {
      data: providers_with_details,
      meta: {
        total_count: providers_with_details.length,
        page: 1,
        per_page: providers_with_details.length
      }
    }
  end
  
  # GET /api/v1/providers/:id
  def show
    provider = User.find_by(id: params[:id], role: :provider)
    
    if provider
      provider_details = {
        id: provider.id,
        name: provider.name,
        email: provider.email,
        role: provider.role,
        created_at: provider.created_at,
        updated_at: provider.updated_at,
        appointment_count: provider.provider_appointments.count,
        available_for_booking: true,
        verified: true,
        rating: 4.8,
        specialties: [],
        timezone: provider.timezone || 'UTC',
        bio: "Experienced professional providing quality service.", # This could come from a profile
        years_of_experience: 5 # This could come from a profile
      }
      
      render json: { data: provider_details }
    else
      render json: { error: 'Provider not found' }, status: :not_found
    end
  end
end 