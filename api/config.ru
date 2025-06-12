# This file is used by Rack-based servers to start the application.

require 'rack'
require 'json'
require 'jwt'
require 'bcrypt'
require 'pg'

# Simple API rack application 
class ScheduleEaseAPI
  def initialize
    # Initialize database connection
    setup_database_connection
  end

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

  # Database connection setup
  def setup_database_connection
    @db = PG.connect(
      host: ENV.fetch('DB_HOST', 'postgres'),
      port: ENV.fetch('DB_PORT', 5432),
      dbname: ENV.fetch('DB_NAME', 'scheduleease_development'),
      user: ENV.fetch('DB_USERNAME', 'scheduleease'),
      password: ENV.fetch('DB_PASSWORD', 'password')
    )
  rescue PG::Error => e
    puts "Failed to connect to database: #{e.message}"
    exit 1
  end

  def db
    # Reconnect if connection is lost
    @db = setup_database_connection if @db.nil? || @db.finished?
    @db
  end

  def handle_login(request)
    return method_not_allowed unless request.post?
    
    begin
      body = JSON.parse(request.body.read)
      email = body['email']
      password = body['password']
      
      user = find_user_by_email(email)
      
      if user && verify_password(password, user['encrypted_password'])
        token = generate_jwt_token(user)
        [200, {'Content-Type' => 'application/json'}, [json_response({
          message: 'Login successful',
          token: token,
          user: {
            id: user['id'],
            name: user['name'],
            email: user['email'],
            role: role_name(user['role'])
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
    rescue PG::Error => e
      [500, {'Content-Type' => 'application/json'}, [json_response({
        error: 'Internal Server Error',
        message: 'Database error occurred'
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
          id: user['id'],
          name: user['name'],
          email: user['email'],
          role: role_name(user['role'])
        }
      })]]
    rescue JSON::ParserError
      [400, {'Content-Type' => 'application/json'}, [json_response({
        error: 'Bad Request',
        message: 'Invalid JSON'
      })]]
    rescue PG::Error => e
      [500, {'Content-Type' => 'application/json'}, [json_response({
        error: 'Internal Server Error',
        message: 'Database error occurred'
      })]]
    end
  end

  def handle_current_user(request)
    return method_not_allowed unless request.get?
    
    user = authenticate_request(request)
    return unauthorized_response unless user
    
    [200, {'Content-Type' => 'application/json'}, [json_response({
      user: {
        id: user['id'],
        name: user['name'],
        email: user['email'],
        role: role_name(user['role'])
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
  rescue PG::Error => e
    [500, {'Content-Type' => 'application/json'}, [json_response({
      error: 'Internal Server Error',
      message: 'Database error occurred'
    })]]
  end
  
  def handle_appointments(request)
    user = authenticate_request(request)
    return unauthorized_response unless user
    
    case request.request_method
    when 'GET'
      appointments = get_appointments_for_user(user)
      [200, {'Content-Type' => 'application/json'}, [json_response({
        appointments: appointments
      })]]
    else
      [405, {'Content-Type' => 'application/json'}, [json_response({
        error: 'Method Not Allowed'
      })]]
    end
  rescue PG::Error => e
    [500, {'Content-Type' => 'application/json'}, [json_response({
      error: 'Internal Server Error',
      message: 'Database error occurred'
    })]]
  end
  
  def handle_availability_slots(request)
    user = authenticate_request(request)
    return unauthorized_response unless user
    
    case request.request_method
    when 'GET'
      slots = get_availability_slots_for_user(user)
      [200, {'Content-Type' => 'application/json'}, [json_response({
        availability_slots: slots
      })]]
    else
      [405, {'Content-Type' => 'application/json'}, [json_response({
        error: 'Method Not Allowed'
      })]]
    end
  rescue PG::Error => e
    [500, {'Content-Type' => 'application/json'}, [json_response({
      error: 'Internal Server Error',
      message: 'Database error occurred'
    })]]
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
      user_id: user['id'],
      email: user['email'],
      role: role_name(user['role']),
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
    ENV.fetch('JWT_SECRET', 'fallback_secret_for_development')
  end

  # Database operations for users
  def find_user_by_email(email)
    result = db.exec_params('SELECT * FROM users WHERE email = $1', [email])
    result.first
  rescue PG::Error
    nil
  end

  def find_user_by_id(id)
    result = db.exec_params('SELECT * FROM users WHERE id = $1', [id])
    result.first
  rescue PG::Error
    nil
  end

  def create_user(name, email, password, role)
    encrypted_password = BCrypt::Password.create(password).to_s
    role_id = role_id_from_name(role)
    
    result = db.exec_params(
      'INSERT INTO users (name, email, encrypted_password, role, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *',
      [name, email, encrypted_password, role_id]
    )
    result.first
  rescue PG::Error => e
    puts "Database error creating user: #{e.message}"
    nil
  end

  def verify_password(password, encrypted_password)
    BCrypt::Password.new(encrypted_password) == password
  rescue BCrypt::Errors::InvalidHash
    false
  end

  def get_all_users
    result = db.exec('SELECT id, name, email, role FROM users ORDER BY id')
    result.map do |user|
      {
        id: user['id'].to_i,
        name: user['name'],
        email: user['email'],
        role: role_name(user['role'])
      }
    end
  rescue PG::Error
    []
  end

  def get_appointments_for_user(user)
    role = role_name(user['role'])
    
    if role == 'admin'
      # Admin can see all appointments
      result = db.exec('SELECT a.*, up.name as provider_name, uc.name as client_name 
                        FROM appointments a 
                        JOIN users up ON a.provider_id = up.id 
                        JOIN users uc ON a.client_id = uc.id 
                        ORDER BY a.start_time')
    elsif role == 'provider'
      # Provider can see their own appointments
      result = db.exec_params('SELECT a.*, up.name as provider_name, uc.name as client_name 
                               FROM appointments a 
                               JOIN users up ON a.provider_id = up.id 
                               JOIN users uc ON a.client_id = uc.id 
                               WHERE a.provider_id = $1 
                               ORDER BY a.start_time', [user['id']])
    else
      # Client can see their own appointments
      result = db.exec_params('SELECT a.*, up.name as provider_name, uc.name as client_name 
                               FROM appointments a 
                               JOIN users up ON a.provider_id = up.id 
                               JOIN users uc ON a.client_id = uc.id 
                               WHERE a.client_id = $1 
                               ORDER BY a.start_time', [user['id']])
    end
    
    result.map do |appointment|
      {
        id: appointment['id'].to_i,
        title: appointment['title'],
        description: appointment['description'],
        start_time: appointment['start_time'],
        end_time: appointment['end_time'],
        status: status_name(appointment['status']),
        provider_name: appointment['provider_name'],
        client_name: appointment['client_name']
      }
    end
  rescue PG::Error
    []
  end

  def get_availability_slots_for_user(user)
    role = role_name(user['role'])
    
    if role == 'admin'
      # Admin can see all availability slots
      result = db.exec('SELECT a.*, u.name as user_name 
                        FROM availability_slots a 
                        JOIN users u ON a.user_id = u.id 
                        ORDER BY a.start_time')
    else
      # Users can see their own availability slots
      result = db.exec_params('SELECT a.*, u.name as user_name 
                               FROM availability_slots a 
                               JOIN users u ON a.user_id = u.id 
                               WHERE a.user_id = $1 
                               ORDER BY a.start_time', [user['id']])
    end
    
    result.map do |slot|
      {
        id: slot['id'].to_i,
        user_name: slot['user_name'],
        start_time: slot['start_time'],
        end_time: slot['end_time'],
        recurring: slot['recurring'] == 't',
        day_of_week: slot['day_of_week']
      }
    end
  rescue PG::Error
    []
  end

  # Role management helpers
  def role_name(role_id)
    case role_id.to_i
    when 0 then 'client'
    when 1 then 'provider'
    when 2 then 'admin'
    else 'client'
    end
  end

  def role_id_from_name(role_name)
    case role_name.to_s.downcase
    when 'client' then 0
    when 'provider' then 1
    when 'admin' then 2
    else 0
    end
  end

  def status_name(status_id)
    case status_id.to_i
    when 0 then 'scheduled'
    when 1 then 'confirmed'
    when 2 then 'completed'
    when 3 then 'cancelled'
    else 'scheduled'
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