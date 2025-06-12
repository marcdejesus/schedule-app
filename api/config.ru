# This file is used by Rack-based servers to start the application.

require 'rack'
require 'json'
require 'jwt'
require 'bcrypt'

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
    when '/api/auth/login'
      handle_login(request)
    when '/api/auth/register'
      handle_register(request)
    when '/api/auth/me'
      handle_current_user(request)
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

  def handle_login(request)
    return method_not_allowed unless request.post?
    
    begin
      body = JSON.parse(request.body.read)
      email = body['email']
      password = body['password']
      
      user = find_user_by_email(email)
      
      if user && verify_password(password, user[:password_hash])
        token = generate_jwt_token(user)
        [200, {'Content-Type' => 'application/json'}, [json_response({
          message: 'Login successful',
          token: token,
          user: {
            id: user[:id],
            name: user[:name],
            email: user[:email],
            role: user[:role]
          }
        })]]
      else
        [401, {'Content-Type' => 'application/json'}, [json_response({
          error: 'Unauthorized',
          message: 'Invalid email or password'
        })]]
      end
    rescue JSON::ParserError
      [400, {'Content-Type' => 'application/json'}, [json_response({
        error: 'Bad Request',
        message: 'Invalid JSON'
      })]]
    end
  end

  def handle_register(request)
    return method_not_allowed unless request.post?
    
    begin
      body = JSON.parse(request.body.read)
      name = body['name']
      email = body['email']
      password = body['password']
      role = body['role'] || 'client'
      
      # Basic validation
      if !name || !email || !password
        return [400, {'Content-Type' => 'application/json'}, [json_response({
          error: 'Bad Request',
          message: 'Name, email, and password are required'
        })]]
      end
      
      if find_user_by_email(email)
        return [422, {'Content-Type' => 'application/json'}, [json_response({
          error: 'Unprocessable Entity',
          message: 'Email already exists'
        })]]
      end
      
      user = create_user(name, email, password, role)
      token = generate_jwt_token(user)
      
      [201, {'Content-Type' => 'application/json'}, [json_response({
        message: 'Registration successful',
        token: token,
        user: {
          id: user[:id],
          name: user[:name],
          email: user[:email],
          role: user[:role]
        }
      })]]
    rescue JSON::ParserError
      [400, {'Content-Type' => 'application/json'}, [json_response({
        error: 'Bad Request',
        message: 'Invalid JSON'
      })]]
    end
  end

  def handle_current_user(request)
    return method_not_allowed unless request.get?
    
    user = authenticate_request(request)
    return unauthorized_response unless user
    
    [200, {'Content-Type' => 'application/json'}, [json_response({
      user: {
        id: user[:id],
        name: user[:name],
        email: user[:email],
        role: user[:role]
      }
    })]]
  end
  
  def handle_users(request)
    user = authenticate_request(request)
    return unauthorized_response unless user
    
    case request.request_method
    when 'GET'
      [200, {'Content-Type' => 'application/json'}, [json_response({
        users: get_all_users
      })]]
    else
      method_not_allowed
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

  # Authentication helpers
  def authenticate_request(request)
    auth_header = request.env['HTTP_AUTHORIZATION']
    return nil unless auth_header && auth_header.start_with?('Bearer ')
    
    token = auth_header.split(' ').last
    decode_jwt_token(token)
  end

  def generate_jwt_token(user)
    payload = {
      user_id: user[:id],
      email: user[:email],
      role: user[:role],
      exp: (Time.now + 24 * 60 * 60).to_i  # 24 hours in seconds
    }
    JWT.encode(payload, jwt_secret, 'HS256')
  end

  def decode_jwt_token(token)
    begin
      decoded = JWT.decode(token, jwt_secret, true, { algorithm: 'HS256' })
      payload = decoded[0]
      find_user_by_id(payload['user_id'])
    rescue JWT::DecodeError, JWT::ExpiredSignature
      nil
    end
  end

  def jwt_secret
    'fallback_secret_for_development'
  end

  # In-memory user storage (replace with database in real implementation)
  def users_store
    @users_store ||= [
      {
        id: 1,
        name: 'Admin User',
        email: 'admin@scheduleease.com',
        role: 'admin',
        password_hash: BCrypt::Password.create('password').to_s
      },
      {
        id: 2,
        name: 'Provider User',
        email: 'provider@scheduleease.com',
        role: 'provider',
        password_hash: BCrypt::Password.create('password').to_s
      },
      {
        id: 3,
        name: 'Client User',
        email: 'client@scheduleease.com',
        role: 'client',
        password_hash: BCrypt::Password.create('password').to_s
      }
    ]
  end

  def find_user_by_email(email)
    users_store.find { |user| user[:email] == email }
  end

  def find_user_by_id(id)
    users_store.find { |user| user[:id] == id.to_i }
  end

  def create_user(name, email, password, role)
    id = users_store.length + 1
    password_hash = BCrypt::Password.create(password).to_s
    
    user = {
      id: id,
      name: name,
      email: email,
      role: role,
      password_hash: password_hash
    }
    
    users_store << user
    user
  end

  def verify_password(password, password_hash)
    BCrypt::Password.new(password_hash) == password
  end

  def get_all_users
    users_store.map do |user|
      {
        id: user[:id],
        name: user[:name],
        email: user[:email],
        role: user[:role]
      }
    end
  end

  # Response helpers
  def unauthorized_response
    [401, {'Content-Type' => 'application/json'}, [json_response({
      error: 'Unauthorized',
      message: 'Authentication required'
    })]]
  end

  def method_not_allowed
    [405, {'Content-Type' => 'application/json'}, [json_response({
      error: 'Method Not Allowed'
    })]]
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