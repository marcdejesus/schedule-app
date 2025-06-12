# This file is used by Rack-based servers to start the application.

require 'rack'
require 'json'

# Simple API rack application 
class ScheduleEaseAPI
  def call(env)
    request = Rack::Request.new(env)
    
    case request.path
    when '/'
      [200, {'Content-Type' => 'application/json'}, [json_response({
        message: 'ScheduleEase API',
        version: '1.0.0',
        status: 'running'
      })]]
    when '/api/users'
      handle_users(request)
    when '/api/appointments'
      handle_appointments(request)
    when '/api/availability_slots'
      handle_availability_slots(request)
    else
      [404, {'Content-Type' => 'application/json'}, [json_response({
        error: 'Not Found',
        message: 'Endpoint not found'
      })]]
    end
  end
  
  private
  
  def handle_users(request)
    case request.request_method
    when 'GET'
      [200, {'Content-Type' => 'application/json'}, [json_response({
        users: [
          { id: 1, email: 'admin@scheduleease.com', role: 'admin' },
          { id: 2, email: 'provider@scheduleease.com', role: 'provider' },
          { id: 3, email: 'client@scheduleease.com', role: 'client' }
        ]
      })]]
    else
      [405, {'Content-Type' => 'application/json'}, [json_response({
        error: 'Method Not Allowed'
      })]]
    end
  end
  
  def handle_appointments(request)
    case request.request_method
    when 'GET'
      [200, {'Content-Type' => 'application/json'}, [json_response({
        appointments: [
          {
            id: 1,
            title: 'Team Meeting',
            start_time: '2025-06-13T10:00:00Z',
            end_time: '2025-06-13T11:00:00Z',
            status: 'scheduled'
          },
          {
            id: 2,
            title: 'Client Consultation',
            start_time: '2025-06-13T14:00:00Z',
            end_time: '2025-06-13T15:00:00Z',
            status: 'scheduled'
          }
        ]
      })]]
    else
      [405, {'Content-Type' => 'application/json'}, [json_response({
        error: 'Method Not Allowed'
      })]]
    end
  end
  
  def handle_availability_slots(request)
    case request.request_method
    when 'GET'
      [200, {'Content-Type' => 'application/json'}, [json_response({
        availability_slots: [
          {
            id: 1,
            start_time: '2025-06-13T09:00:00Z',
            end_time: '2025-06-13T17:00:00Z',
            day_of_week: 'monday',
            is_available: true
          },
          {
            id: 2,
            start_time: '2025-06-13T09:00:00Z',
            end_time: '2025-06-13T17:00:00Z',
            day_of_week: 'tuesday',
            is_available: true
          }
        ]
      })]]
    else
      [405, {'Content-Type' => 'application/json'}, [json_response({
        error: 'Method Not Allowed'
      })]]
    end
  end
  
  def json_response(data)
    JSON.generate(data)
  end
end

# CORS middleware
class CORSMiddleware
  def initialize(app)
    @app = app
  end

  def call(env)
    if env['REQUEST_METHOD'] == 'OPTIONS'
      [200, cors_headers, ['']]
    else
      status, headers, response = @app.call(env)
      [status, headers.merge(cors_headers), response]
    end
  end

  private

  def cors_headers
    {
      'Access-Control-Allow-Origin' => '*',
      'Access-Control-Allow-Methods' => 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers' => 'Content-Type, Authorization',
      'Access-Control-Max-Age' => '86400'
    }
  end
end

# Run the application
use CORSMiddleware
run ScheduleEaseAPI.new 