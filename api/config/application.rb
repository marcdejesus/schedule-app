require_relative "boot"

require "rails/all"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module ScheduleEaseApi
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 7.1

    # Configuration for the application, engines, and railties goes here.
    #
    # These settings can be overridden in specific environments using the files
    # in config/environments, which are processed later.
    #
    # config.time_zone = "Central Time (US & Canada)"
    # config.eager_load_paths << Rails.root.join("extras")

    # Only loads a smaller set of middleware suitable for API only apps.
    # Middleware like session, flash, cookies can be added back manually.
    # Skip views, helpers and assets when generating a new resource.
    config.api_only = true

    # Add session middleware for OAuth support
    config.middleware.use ActionDispatch::Cookies
    config.middleware.use ActionDispatch::Session::CookieStore

    # CORS configuration
    config.middleware.insert_before 0, Rack::Cors do
      allow do
        origins case Rails.env
                when 'development'
                  ['localhost:3000', 'localhost:3002', 'http://localhost:3000', 'http://localhost:3002']
                when 'test'
                  ['localhost:3000', 'localhost:3002'] # Use specific origins for test environment
                else
                  ENV['FRONTEND_URL'] || 'localhost:3000'
                end
        resource '*',
          headers: :any,
          methods: [:get, :post, :put, :patch, :delete, :options, :head],
          credentials: true
      end
    end

    # Sidekiq configuration
    config.active_job.queue_adapter = :sidekiq

    # Time zone configuration
    config.time_zone = 'UTC'
  end
end 