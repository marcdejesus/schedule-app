# Load Logger class very early to prevent ActiveSupport issues
begin
  require 'logger'
rescue LoadError
  # If logger gem isn't available, create minimal stub
  class Logger
    module Severity
      UNKNOWN = 5
      FATAL   = 4
      ERROR   = 3
      WARN    = 2
      INFO    = 1
      DEBUG   = 0
    end
  end
end

# Ensure Logger constant is globally available
Object.const_set(:Logger, Logger) unless defined?(::Logger)

ENV["BUNDLE_GEMFILE"] ||= File.expand_path("../Gemfile", __dir__)

require "bundler/setup" # Set up gems listed in the Gemfile.

# Fix Logger loading issue in Docker environment
require "logger" unless defined?(Logger)

require "bootsnap/setup" # Speed up boot time with caching; required in config/boot.rb 