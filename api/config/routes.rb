Rails.application.routes.draw do
  devise_for :users, controllers: {
    sessions: 'users/sessions',
    registrations: 'users/registrations',
    passwords: 'users/passwords',
    confirmations: 'users/confirmations',
    omniauth_callbacks: 'users/omniauth_callbacks'
  }

  # OAuth initiation routes
  get '/auth/google_oauth2', to: redirect { |params, request|
    "/users/auth/google_oauth2"
  }

  # Mount Sidekiq Web UI for admin users (uncomment when needed)
  # require 'sidekiq/web'
  # mount Sidekiq::Web => '/sidekiq'

  # API routes
  namespace :api do
    namespace :v1 do
      # User routes
      resources :users, only: [:show, :update, :destroy] do
        collection do
          get :me
        end
        member do
          post :avatar, action: :upload_avatar
          delete :avatar, action: :remove_avatar
          get 'avatar/debug', action: :debug_avatar
          get :preferences
          patch :preferences, action: :update_preferences
        end
      end

      # Provider routes
      resources :providers, only: [:index, :show]

      # Authentication routes
      resources :sessions, only: [:index, :create, :destroy] do
        collection do
          delete :all, action: :destroy_all_sessions
          get :current
        end
      end

      # OAuth verification (outside namespace to match controller)
      post 'auth/oauth/verify', to: 'auth#oauth_verify'

      # Password reset routes
      namespace :auth do
        get 'google', to: redirect { |params, request|
          "/users/auth/google_oauth2"
        }
        
        # Password reset
        post 'password/reset', to: 'passwords#create'
        put 'password/reset', to: 'passwords#update'
        get 'password/reset/verify', to: 'passwords#edit'
        
        # Password change (for authenticated users)
        put 'password/change', to: 'passwords#change'
        
        # Email confirmation
        post 'email/resend_confirmation', to: 'confirmations#create'
        get 'email/confirm', to: 'confirmations#show'
        get 'email/verify', to: 'confirmations#verify'
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

      # Public API routes (no authentication required)
      namespace :public do
        resources :providers, only: [:show] do
          member do
            get :availability
          end
        end
        
        resources :bookings, only: [:create, :show]
      end
    end
  end

  # Health check endpoint
  get '/health', to: proc { [200, {}, ['OK']] }

  # API documentation (uncomment when rswag is enabled)
  # mount Rswag::Ui::Engine => '/api-docs'
  # mount Rswag::Api::Engine => '/api-docs'

  # Catch-all route for frontend
  get '*path', to: proc { [404, {}, ['Not Found']] }, constraints: lambda { |req|
    !req.xhr? && req.format.html?
  }
end 