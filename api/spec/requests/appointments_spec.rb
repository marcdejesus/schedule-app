require 'rails_helper'

RSpec.describe 'Appointments API', type: :request do
  let(:provider) { create(:user, :provider) }
  let(:client) { create(:user, :client) }
  let(:admin) { create(:user, :admin) }
  let(:service) { create(:service, provider: provider) }
  let(:appointment) { create(:appointment, service: service, client: client) }

  describe 'GET /api/appointments' do
    let!(:appointments) do
      [
        create(:appointment, service: service, client: client, status: 'pending'),
        create(:appointment, service: service, client: client, status: 'confirmed'),
        create(:appointment, service: service, client: client, status: 'cancelled')
      ]
    end

    context 'as a provider' do
      before { sign_in(provider) }

      it 'returns provider appointments' do
        get '/api/appointments', headers: authenticated_headers(provider)
        
        expect_json_api_collection
        expect(json_data.length).to eq(3)
        expect(json_data.all? { |apt| apt['relationships']['service']['data']['id'] == service.id.to_s }).to be true
      end

      it 'filters by status' do
        get '/api/appointments', params: { status: 'confirmed' }, headers: authenticated_headers(provider)
        
        expect_json_api_collection
        expect(json_data.length).to eq(1)
        expect(json_data.first['attributes']['status']).to eq('confirmed')
      end

      it 'filters by date range' do
        future_appointment = create(:appointment, service: service, client: client, 
                                   start_time: 1.week.from_now)
        
        get '/api/appointments', 
            params: { start_date: Date.current, end_date: 3.days.from_now },
            headers: authenticated_headers(provider)
        
        expect_json_api_collection
        expect(json_data.length).to eq(3) # Original appointments are within range
      end
    end

    context 'as a client' do
      before { sign_in(client) }

      it 'returns client appointments' do
        get '/api/appointments', headers: authenticated_headers(client)
        
        expect_json_api_collection
        expect(json_data.length).to eq(3)
        expect(json_data.all? { |apt| apt['relationships']['client']['data']['id'] == client.id.to_s }).to be true
      end
    end

    context 'as an admin' do
      before { sign_in(admin) }

      it 'returns all appointments' do
        other_service = create(:service)
        create(:appointment, service: other_service)
        
        get '/api/appointments', headers: authenticated_headers(admin)
        
        expect_json_api_collection
        expect(json_data.length).to eq(4)
      end
    end

    context 'without authentication' do
      it 'requires authentication' do
        get '/api/appointments'
        expect_authentication_required
      end
    end
  end

  describe 'GET /api/appointments/:id' do
    context 'as appointment owner' do
      it 'returns appointment details for provider' do
        get "/api/appointments/#{appointment.id}", headers: authenticated_headers(provider)
        
        expect_json_api_resource_type('appointment')
        expect_json_api_attributes(:start_time, :end_time, :status, :notes)
        expect_json_api_relationships(:service, :client)
      end

      it 'returns appointment details for client' do
        get "/api/appointments/#{appointment.id}", headers: authenticated_headers(client)
        
        expect_json_api_resource_type('appointment')
        expect_json_api_attributes(:start_time, :end_time, :status, :notes)
      end
    end

    context 'as non-owner' do
      let(:other_user) { create(:user, :client) }

      it 'denies access' do
        get "/api/appointments/#{appointment.id}", headers: authenticated_headers(other_user)
        expect_authorization_required
      end
    end

    context 'with non-existent appointment' do
      it 'returns not found' do
        get '/api/appointments/999999', headers: authenticated_headers(client)
        expect_not_found_response
      end
    end
  end

  describe 'POST /api/appointments' do
    let(:valid_attributes) do
      {
        service_id: service.id,
        start_time: 1.day.from_now.iso8601,
        notes: 'Test appointment'
      }
    end

    context 'as a client' do
      it 'creates an appointment' do
        expect {
          post_json '/api/appointments', 
                   json_api_payload('appointment', valid_attributes),
                   authenticated_headers(client)
        }.to change(Appointment, :count).by(1)

        expect_json_api_resource_type('appointment')
        expect(json_data['attributes']['status']).to eq('pending')
        expect(json_data['relationships']['client']['data']['id']).to eq(client.id.to_s)
      end

      it 'validates required fields' do
        post_json '/api/appointments', 
                 json_api_payload('appointment', {}),
                 authenticated_headers(client)

        expect_json_api_validation_error('service_id', "can't be blank")
        expect_json_api_validation_error('start_time', "can't be blank")
      end

      it 'prevents booking in the past' do
        past_attributes = valid_attributes.merge(start_time: 1.day.ago.iso8601)
        
        post_json '/api/appointments', 
                 json_api_payload('appointment', past_attributes),
                 authenticated_headers(client)

        expect_json_api_validation_error('start_time', 'cannot be in the past')
      end

      it 'prevents double booking' do
        existing_time = 1.day.from_now
        create(:appointment, service: service, start_time: existing_time)
        
        conflicting_attributes = valid_attributes.merge(start_time: existing_time.iso8601)
        
        post_json '/api/appointments', 
                 json_api_payload('appointment', conflicting_attributes),
                 authenticated_headers(client)

        expect_json_api_validation_error('start_time', 'is not available')
      end
    end

    context 'as a provider' do
      it 'denies appointment creation' do
        post_json '/api/appointments', 
                 json_api_payload('appointment', valid_attributes),
                 authenticated_headers(provider)

        expect_authorization_required
      end
    end
  end

  describe 'PATCH /api/appointments/:id' do
    context 'as appointment provider' do
      it 'confirms an appointment' do
        patch_json "/api/appointments/#{appointment.id}",
                  json_api_payload('appointment', { status: 'confirmed' }, {}, appointment.id),
                  authenticated_headers(provider)

        expect_json_api_resource_type('appointment')
        expect(json_data['attributes']['status']).to eq('confirmed')
      end

      it 'cancels an appointment' do
        patch_json "/api/appointments/#{appointment.id}",
                  json_api_payload('appointment', { 
                    status: 'cancelled', 
                    cancellation_reason: 'Provider unavailable' 
                  }, {}, appointment.id),
                  authenticated_headers(provider)

        expect_json_api_resource_type('appointment')
        expect(json_data['attributes']['status']).to eq('cancelled')
        expect(json_data['attributes']['cancellation_reason']).to eq('Provider unavailable')
      end
    end

    context 'as appointment client' do
      it 'cancels own appointment' do
        patch_json "/api/appointments/#{appointment.id}",
                  json_api_payload('appointment', { 
                    status: 'cancelled',
                    cancellation_reason: 'Schedule conflict'
                  }, {}, appointment.id),
                  authenticated_headers(client)

        expect_json_api_resource_type('appointment')
        expect(json_data['attributes']['status']).to eq('cancelled')
      end

      it 'cannot confirm appointment' do
        patch_json "/api/appointments/#{appointment.id}",
                  json_api_payload('appointment', { status: 'confirmed' }, {}, appointment.id),
                  authenticated_headers(client)

        expect_authorization_required
      end
    end

    context 'as non-owner' do
      let(:other_user) { create(:user, :client) }

      it 'denies access' do
        patch_json "/api/appointments/#{appointment.id}",
                  json_api_payload('appointment', { status: 'confirmed' }, {}, appointment.id),
                  authenticated_headers(other_user)

        expect_authorization_required
      end
    end
  end

  describe 'DELETE /api/appointments/:id' do
    context 'as appointment client' do
      it 'deletes own appointment' do
        expect {
          delete_json "/api/appointments/#{appointment.id}", {}, authenticated_headers(client)
        }.to change(Appointment, :count).by(-1)

        expect(response).to have_http_status(:no_content)
      end
    end

    context 'as appointment provider' do
      it 'deletes appointment' do
        expect {
          delete_json "/api/appointments/#{appointment.id}", {}, authenticated_headers(provider)
        }.to change(Appointment, :count).by(-1)

        expect(response).to have_http_status(:no_content)
      end
    end

    context 'as admin' do
      it 'deletes any appointment' do
        expect {
          delete_json "/api/appointments/#{appointment.id}", {}, authenticated_headers(admin)
        }.to change(Appointment, :count).by(-1)

        expect(response).to have_http_status(:no_content)
      end
    end

    context 'as non-owner' do
      let(:other_user) { create(:user, :client) }

      it 'denies access' do
        delete_json "/api/appointments/#{appointment.id}", {}, authenticated_headers(other_user)
        expect_authorization_required
      end
    end
  end

  describe 'POST /api/appointments/:id/confirm' do
    let(:pending_appointment) { create(:appointment, service: service, client: client, status: 'pending') }

    context 'as provider' do
      it 'confirms appointment' do
        post_json "/api/appointments/#{pending_appointment.id}/confirm", {}, authenticated_headers(provider)

        expect_json_api_resource_type('appointment')
        expect(json_data['attributes']['status']).to eq('confirmed')
      end
    end

    context 'as client' do
      it 'denies confirmation' do
        post_json "/api/appointments/#{pending_appointment.id}/confirm", {}, authenticated_headers(client)
        expect_authorization_required
      end
    end

    context 'with already confirmed appointment' do
      let(:confirmed_appointment) { create(:appointment, service: service, client: client, status: 'confirmed') }

      it 'returns error' do
        post_json "/api/appointments/#{confirmed_appointment.id}/confirm", {}, authenticated_headers(provider)
        expect_json_api_error(:unprocessable_entity)
      end
    end
  end

  describe 'POST /api/appointments/:id/cancel' do
    let(:confirmed_appointment) { create(:appointment, service: service, client: client, status: 'confirmed') }

    context 'as provider' do
      it 'cancels appointment with reason' do
        post_json "/api/appointments/#{confirmed_appointment.id}/cancel",
                 { reason: 'Emergency' },
                 authenticated_headers(provider)

        expect_json_api_resource_type('appointment')
        expect(json_data['attributes']['status']).to eq('cancelled')
        expect(json_data['attributes']['cancellation_reason']).to eq('Emergency')
      end
    end

    context 'as client' do
      it 'cancels own appointment' do
        post_json "/api/appointments/#{confirmed_appointment.id}/cancel",
                 { reason: 'Cannot attend' },
                 authenticated_headers(client)

        expect_json_api_resource_type('appointment')
        expect(json_data['attributes']['status']).to eq('cancelled')
      end
    end

    context 'with already cancelled appointment' do
      let(:cancelled_appointment) { create(:appointment, service: service, client: client, status: 'cancelled') }

      it 'returns error' do
        post_json "/api/appointments/#{cancelled_appointment.id}/cancel", {}, authenticated_headers(provider)
        expect_json_api_error(:unprocessable_entity)
      end
    end
  end
end 