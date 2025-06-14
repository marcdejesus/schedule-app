module RequestSpecHelper
  def json_response
    @json_response ||= JSON.parse(response.body)
  end

  def json_data
    json_response['data']
  end

  def json_errors
    json_response['errors']
  end

  def json_meta
    json_response['meta']
  end

  def expect_json_response(status = :ok)
    expect(response).to have_http_status(status)
    expect(response.content_type).to include('application/json')
  end

  def expect_successful_json_response
    expect_json_response(:ok)
    expect(json_response).to have_key('data')
  end

  def expect_error_json_response(status = :unprocessable_entity)
    expect_json_response(status)
    expect(json_response).to have_key('errors')
  end

  def expect_unauthorized_response
    expect_json_response(:unauthorized)
    expect(json_errors.first['title']).to eq('Unauthorized')
  end

  def expect_forbidden_response
    expect_json_response(:forbidden)
    expect(json_errors.first['title']).to eq('Forbidden')
  end

  def expect_not_found_response
    expect_json_response(:not_found)
    expect(json_errors.first['title']).to eq('Not Found')
  end

  def expect_validation_error(field, message = nil)
    expect_error_json_response
    error = json_errors.find { |e| e['source']['pointer'] == "/data/attributes/#{field}" }
    expect(error).to be_present
    expect(error['detail']).to include(message) if message
  end

  def api_headers(additional_headers = {})
    {
      'Content-Type' => 'application/json',
      'Accept' => 'application/json'
    }.merge(additional_headers)
  end

  def authenticated_headers(user = nil)
    user ||= create(:user)
    token = JWT.encode({ user_id: user.id, exp: 24.hours.from_now.to_i }, Rails.application.credentials.jwt_secret)
    api_headers('Authorization' => "Bearer #{token}")
  end

  def post_json(path, params = {}, headers = {})
    post path, params: params.to_json, headers: api_headers(headers)
  end

  def patch_json(path, params = {}, headers = {})
    patch path, params: params.to_json, headers: api_headers(headers)
  end

  def put_json(path, params = {}, headers = {})
    put path, params: params.to_json, headers: api_headers(headers)
  end

  def delete_json(path, params = {}, headers = {})
    delete path, params: params.to_json, headers: api_headers(headers)
  end

  def get_json(path, params = {}, headers = {})
    get path, params: params, headers: api_headers(headers)
  end
end 