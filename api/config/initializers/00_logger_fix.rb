# Fixes Ruby 3.2 + Rails 7.0 Logger compatibility issue
# This must run early to ensure Logger is properly defined

require 'logger' unless defined?(Logger)

# Ensure Logger has the Severity module with constants
unless Logger.const_defined?(:Severity)
  Logger.const_set(:Severity, Module.new)
end

# Define the severity constants if they're missing
unless Logger::Severity.const_defined?(:DEBUG)
  Logger::Severity.const_set(:DEBUG, 0)
  Logger::Severity.const_set(:INFO, 1)  
  Logger::Severity.const_set(:WARN, 2)
  Logger::Severity.const_set(:ERROR, 3)
  Logger::Severity.const_set(:FATAL, 4)
  Logger::Severity.const_set(:UNKNOWN, 5)
end

# Create severity level checking methods if they don't exist
Logger::Severity.constants.each do |severity|
  method_name = "#{severity.to_s.downcase}?"
  next if Logger.instance_methods.include?(method_name.to_sym)
  
  Logger.class_eval do
    define_method(method_name) do
      Logger.const_get(severity) >= level
    end
  end
end 