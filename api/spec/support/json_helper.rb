module JsonHelper
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

  def json_included
    json_response['included']
  end

  def expect_json_api_response(status = :ok)
    expect(response).to have_http_status(status)
    expect(response.content_type).to include('application/json')
  end

  def expect_json_api_success
    expect_json_api_response(:ok)
    expect(json_response).to have_key('data')
  end

  def expect_json_api_error(status = :unprocessable_entity)
    expect_json_api_response(status)
    expect(json_response).to have_key('errors')
  end

  def expect_json_api_collection
    expect_json_api_success
    expect(json_data).to be_an(Array)
  end

  def expect_json_api_resource
    expect_json_api_success
    expect(json_data).to be_a(Hash)
    expect(json_data).to have_key('id')
    expect(json_data).to have_key('type')
    expect(json_data).to have_key('attributes')
  end

  def expect_json_api_resource_type(type)
    expect_json_api_resource
    expect(json_data['type']).to eq(type)
  end

  def expect_json_api_attributes(*attributes)
    expect_json_api_resource
    attributes.each do |attribute|
      expect(json_data['attributes']).to have_key(attribute.to_s)
    end
  end

  def expect_json_api_relationships(*relationships)
    expect_json_api_resource
    expect(json_data).to have_key('relationships')
    relationships.each do |relationship|
      expect(json_data['relationships']).to have_key(relationship.to_s)
    end
  end

  def expect_json_api_included_type(type, count = nil)
    expect(json_included).to be_present
    included_of_type = json_included.select { |resource| resource['type'] == type }
    expect(included_of_type).to be_present
    expect(included_of_type.count).to eq(count) if count
  end

  def expect_json_api_pagination
    expect(json_meta).to be_present
    expect(json_meta).to have_key('pagination')
    pagination = json_meta['pagination']
    expect(pagination).to have_key('current_page')
    expect(pagination).to have_key('total_pages')
    expect(pagination).to have_key('total_count')
    expect(pagination).to have_key('per_page')
  end

  def expect_json_api_error_detail(detail)
    expect_json_api_error
    expect(json_errors.first['detail']).to include(detail)
  end

  def expect_json_api_error_source(pointer)
    expect_json_api_error
    expect(json_errors.first['source']['pointer']).to eq(pointer)
  end

  def expect_json_api_validation_error(field, detail = nil)
    expect_json_api_error
    error = json_errors.find { |e| e['source']['pointer'] == "/data/attributes/#{field}" }
    expect(error).to be_present
    expect(error['detail']).to include(detail) if detail
  end

  # Helper to build JSON API request payloads
  def json_api_payload(type, attributes = {}, relationships = {}, id = nil)
    payload = {
      data: {
        type: type,
        attributes: attributes
      }
    }
    
    payload[:data][:id] = id if id
    payload[:data][:relationships] = relationships if relationships.any?
    
    payload
  end

  def json_api_relationship(type, id)
    {
      data: {
        type: type,
        id: id
      }
    }
  end

  def json_api_relationships_payload(**relationships)
    relationships.transform_values do |value|
      if value.is_a?(Array)
        { data: value.map { |v| { type: v[:type], id: v[:id] } } }
      else
        { data: { type: value[:type], id: value[:id] } }
      end
    end
  end
end 