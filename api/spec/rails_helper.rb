# frozen_string_literal: true

# This file is copied to spec/ when you run 'rails generate rspec:install'
require 'spec_helper'
ENV['RAILS_ENV'] ||= 'test'
require_relative '../config/environment'
# Prevent database truncation if the environment is production
abort("The Rails environment is running in production mode!") if Rails.env.production?
require 'rspec/rails'

# Add additional requires below this line. Rails is not loaded until this point!
require 'shoulda/matchers'
require 'factory_bot_rails'
require 'database_cleaner/active_record'
require 'webmock/rspec'
require 'vcr'
require 'timecop'

# Requires supporting ruby files with custom matchers and macros, etc, in
# spec/support/ and its subdirectories. Files matching `spec/**/*_spec.rb` are
# run as spec files by default. This can be changed by providing a custom
# `--pattern` option to `rspec`.
#
# The following line is provided for convenience purposes. It has the downside
# of increasing the boot time by auto-requiring all files in the support
# directory. Alternatively, in the individual `*_spec.rb` files, manually
# require only the support files necessary.
#
Dir[Rails.root.join('spec', 'support', '**', '*.rb')].sort.each { |f| require f }

# Checks for pending migrations and applies them before tests are run.
# If you are not using ActiveRecord, you can remove these lines.
begin
  ActiveRecord::Migration.maintain_test_schema!
rescue ActiveRecord::PendingMigrationError => e
  abort e.to_s.strip
end

# Configure SimpleCov for test coverage
if ENV['COVERAGE'] == 'true'
  require 'simplecov'
  require 'simplecov-lcov'
  
  SimpleCov::Formatter::LcovFormatter.config do |c|
    c.report_with_single_file = true
    c.single_report_path = 'coverage/lcov.info'
  end
  
  SimpleCov.formatters = [
    SimpleCov::Formatter::HTMLFormatter,
    SimpleCov::Formatter::LcovFormatter
  ]
  
  SimpleCov.start 'rails' do
    add_filter '/spec/'
    add_filter '/config/'
    add_filter '/vendor/'
    add_filter '/db/'
    
    add_group 'Controllers', 'app/controllers'
    add_group 'Models', 'app/models'
    add_group 'Serializers', 'app/serializers'
    add_group 'Services', 'app/services'
    add_group 'Jobs', 'app/jobs'
    add_group 'Mailers', 'app/mailers'
    
    minimum_coverage 80
    minimum_coverage_by_file 70
  end
end

# Configure VCR for HTTP request recording
VCR.configure do |config|
  config.cassette_library_dir = 'spec/vcr_cassettes'
  config.hook_into :webmock
  config.configure_rspec_metadata!
  config.allow_http_connections_when_no_cassette = false
  config.default_cassette_options = {
    record: :once,
    match_requests_on: [:method, :uri, :body]
  }
  
  # Filter sensitive data
  config.filter_sensitive_data('<GOOGLE_CLIENT_ID>') { ENV['GOOGLE_CLIENT_ID'] }
  config.filter_sensitive_data('<GOOGLE_CLIENT_SECRET>') { ENV['GOOGLE_CLIENT_SECRET'] }
  config.filter_sensitive_data('<JWT_SECRET>') { ENV['JWT_SECRET'] }
end

# Configure WebMock
WebMock.disable_net_connect!(allow_localhost: true)

RSpec.configure do |config|
  # Remove this line if you're not using ActiveRecord or ActiveRecord fixtures
  config.fixture_path = "#{::Rails.root}/spec/fixtures"

  # If you're not using ActiveRecord, or you'd prefer not to run each of your
  # examples within a transaction, remove the following line or assign false
  # instead of true.
  config.use_transactional_fixtures = false

  # You can uncomment this line to turn off ActiveRecord support entirely.
  # config.use_active_record = false

  # RSpec Rails can automatically mix in different behaviours to your tests
  # based on their file location, for example enabling you to call `get` and
  # `post` in specs under `spec/controllers`.
  #
  # You can disable this behaviour by removing the line below, and instead
  # explicitly tag your specs with their type, e.g.:
  #
  #     RSpec.describe UsersController, type: :controller do
  #       # ...
  #     end
  #
  # The different available types are documented in the features, such as in
  # https://relishapp.com/rspec/rspec-rails/docs
  config.infer_spec_type_from_file_location!

  # Filter lines from Rails gems in backtraces.
  config.filter_rails_from_backtrace!
  # arbitrary gems may also be filtered via:
  # config.filter_gems_from_backtrace("gem name")

  # Include FactoryBot methods
  config.include FactoryBot::Syntax::Methods

  # Include custom helpers
  config.include RequestSpecHelper, type: :request
  config.include AuthenticationHelper, type: :request
  config.include JsonHelper, type: :request

  # Configure database cleaner
  config.before(:suite) do
    DatabaseCleaner.strategy = :transaction
    DatabaseCleaner.clean_with(:truncation)
  end

  config.around(:each) do |example|
    DatabaseCleaner.cleaning do
      example.run
    end
  end

  # Configure Shoulda Matchers
  config.include(Shoulda::Matchers::ActiveRecord, type: :model)
  config.include(Shoulda::Matchers::ActiveModel, type: :model)

  # Reset time after each test
  config.after(:each) do
    Timecop.return
  end

  # Configure test environment
  config.before(:each) do
    # Clear Redis cache
    Redis.current.flushdb if defined?(Redis)
    
    # Reset ActionMailer deliveries
    ActionMailer::Base.deliveries.clear
  end

  # Configure request specs
  config.before(:each, type: :request) do
    host! 'api.scheduleease.test'
  end

  # Configure feature specs (if using Capybara)
  config.before(:each, type: :feature) do
    Capybara.current_driver = :rack_test
  end

  # Configure system specs (if using Capybara)
  config.before(:each, type: :system) do
    driven_by :rack_test
  end

  # Shared examples and contexts
  config.shared_context_metadata_behavior = :apply_to_host_groups

  # Configure output
  config.example_status_persistence_file_path = 'spec/examples.txt'
  config.disable_monkey_patching!
  config.warnings = false

  # Configure parallel testing
  if config.files_to_run.one?
    config.default_formatter = 'doc'
  end

  # Configure random order
  config.order = :random
  Kernel.srand config.seed
end

# Configure Shoulda Matchers
Shoulda::Matchers.configure do |config|
  config.integrate do |with|
    with.test_framework :rspec
    with.library :rails
  end
end 