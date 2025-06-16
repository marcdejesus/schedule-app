module AuthenticationHelper
  def sign_in(user)
    token = JWT.encode(
      { user_id: user.id, exp: 24.hours.from_now.to_i },
      Rails.application.credentials.secret_key_base || ENV['JWT_SECRET'] || 'fallback_secret_for_development'
    )
    request.headers['Authorization'] = "Bearer #{token}"
    user
  end

  def sign_out
    request.headers.delete('Authorization')
  end

  def create_and_sign_in_user(role: :client, **attributes)
    user = create(:user, role: role, **attributes)
    sign_in(user)
    user
  end

  def create_and_sign_in_admin(**attributes)
    create_and_sign_in_user(role: :admin, **attributes)
  end

  def create_and_sign_in_provider(**attributes)
    create_and_sign_in_user(role: :provider, **attributes)
  end

  def create_and_sign_in_client(**attributes)
    create_and_sign_in_user(role: :client, **attributes)
  end

  def auth_token_for(user)
    JWT.encode(
      { user_id: user.id, exp: 24.hours.from_now.to_i },
      Rails.application.credentials.secret_key_base || ENV['JWT_SECRET'] || 'fallback_secret_for_development'
    )
  end

  def expired_auth_token_for(user)
    JWT.encode(
      { user_id: user.id, exp: 1.hour.ago.to_i },
      Rails.application.credentials.secret_key_base || ENV['JWT_SECRET'] || 'fallback_secret_for_development'
    )
  end

  def invalid_auth_token
    'invalid.jwt.token'
  end

  def auth_headers_for(user)
    { 'Authorization' => "Bearer #{auth_token_for(user)}" }
  end

  def expired_auth_headers_for(user)
    { 'Authorization' => "Bearer #{expired_auth_token_for(user)}" }
  end

  def invalid_auth_headers
    { 'Authorization' => "Bearer #{invalid_auth_token}" }
  end

  def expect_authentication_required
    expect(response).to have_http_status(:unauthorized)
    expect(json_response['errors'].first['title']).to eq('Unauthorized')
  end

  def expect_authorization_required
    expect(response).to have_http_status(:forbidden)
    expect(json_response['errors'].first['title']).to eq('Forbidden')
  end

  # OAuth helpers
  def mock_google_oauth_response(email: 'test@example.com', name: 'Test User')
    {
      'provider' => 'google_oauth2',
      'uid' => '123456789',
      'info' => {
        'email' => email,
        'name' => name,
        'image' => 'https://example.com/avatar.jpg'
      },
      'credentials' => {
        'token' => 'mock_access_token',
        'refresh_token' => 'mock_refresh_token',
        'expires_at' => 1.hour.from_now.to_i
      }
    }
  end

  def stub_google_oauth_success(email: 'test@example.com', name: 'Test User')
    allow_any_instance_of(ApplicationController).to receive(:request)
      .and_return(double(env: { 'omniauth.auth' => mock_google_oauth_response(email: email, name: name) }))
  end

  def stub_google_oauth_failure
    allow_any_instance_of(ApplicationController).to receive(:request)
      .and_return(double(env: { 'omniauth.error' => 'access_denied' }))
  end
end 