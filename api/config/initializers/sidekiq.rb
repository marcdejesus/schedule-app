Sidekiq.configure_server do |config|
  config.redis = { url: ENV.fetch('REDIS_URL', 'redis://localhost:6379/0') }
end

Sidekiq.configure_client do |config|
  config.redis = { url: ENV.fetch('REDIS_URL', 'redis://localhost:6379/0') }
end

# Ensure Active Storage is properly configured for Sidekiq workers
Rails.application.config.after_initialize do
  if defined?(Sidekiq) && Rails.env.development?
    # Force Active Storage service configuration for Sidekiq workers
    development_config = {
      'service' => 'Disk',
      'root' => Rails.root.join('storage').to_s
    }
    
    configurations = { 'development' => development_config }
    
    ActiveStorage::Blob.service = ActiveStorage::Service.configure(
      :development,
      configurations
    )
  end
end 