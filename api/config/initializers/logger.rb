# Ensure logger is available before Rails tries to use it
require 'logger' unless defined?(Logger) 