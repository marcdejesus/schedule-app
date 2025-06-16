class JwtService
  SECRET_KEY = Rails.application.credentials.secret_key_base || ENV['JWT_SECRET'] || 'fallback_secret_for_development'

  def self.encode(payload)
    # Add expiration time if not present
    payload[:exp] ||= 24.hours.from_now.to_i
    JWT.encode(payload, SECRET_KEY, 'HS256')
  end

  def self.decode(token)
    begin
      decoded = JWT.decode(token, SECRET_KEY, true, { algorithm: 'HS256' })
      decoded[0].with_indifferent_access
    rescue JWT::DecodeError => e
      Rails.logger.error "JWT Decode Error: #{e.message}"
      nil
    rescue JWT::ExpiredSignature => e
      Rails.logger.error "JWT Token Expired: #{e.message}"
      nil
    end
  end

  def self.valid_token?(token)
    return false if token.nil?
    
    decoded_token = decode(token)
    return false if decoded_token.nil?
    
    # Check if token is expired
    exp_time = Time.at(decoded_token[:exp])
    Time.current < exp_time
  end

  def self.get_user_from_token(token)
    decoded_token = decode(token)
    return nil if decoded_token.nil?
    
    user_id = decoded_token[:user_id]
    User.find_by(id: user_id)
  end
end 