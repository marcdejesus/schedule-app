Rails.application.routes.draw do
  devise_for :users, controllers: {
    sessions: 'users/sessions',
    registrations: 'users/registrations',
    omniauth_callbacks: 'users/omniauth_callbacks'
  }

  # Mount Sidekiq Web UI for admin users
  require 'sidekiq/web'
  mount Sidekiq::Web => '/sidekiq'

  # API routes
  namespace :api do
    namespace :v1 do
      # User routes
      resources :users, only: [:show, :update, :destroy] do
        collection do
          get :me
          get :providers
        end
      end

      # Availability slots routes
      resources :availability_slots do
        collection do
          get :available
        end
      end

      # Appointments routes
      resources :appointments do
        member do
          patch :cancel
          patch :confirm
        end
        collection do
          get :upcoming
          get :past
        end
      end

      # Notifications routes
      resources :notifications, only: [:index, :show, :update] do
        member do
          patch :mark_as_read
        end
      end
    end
  end

  # Health check endpoint
  get '/health', to: proc { [200, {}, ['OK']] }

  # API documentation
  mount Rswag::Ui::Engine => '/api-docs'
  mount Rswag::Api::Engine => '/api-docs'

  # Catch-all route for frontend
  get '*path', to: proc { [404, {}, ['Not Found']] }, constraints: lambda { |req|
    !req.xhr? && req.format.html?
  }
end 