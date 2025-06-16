require 'rails_helper'

RSpec.describe Appointment, type: :model do
  let(:provider) { create(:user, :provider) }
  let(:client) { create(:user, :client) }
  
  describe 'associations' do
    it { should belong_to(:provider).class_name('User') }
    it { should belong_to(:client).class_name('User') }
  end

  describe 'validations' do
    it { should validate_presence_of(:start_time) }
    it { should validate_presence_of(:end_time) }
    it { should validate_presence_of(:provider_id) }
    it { should validate_presence_of(:client_id) }
  end

  describe 'enums' do
    it { should define_enum_for(:status).with_values(pending: 0, confirmed: 1, cancelled: 2, completed: 3, no_show: 4) }
  end

  describe 'scopes' do
    let!(:past_appointment) { create(:appointment, provider: provider, client: client, start_time: 1.day.ago, end_time: 1.day.ago + 1.hour) }
    let!(:future_appointment) { create(:appointment, provider: provider, client: client, start_time: 1.day.from_now, end_time: 1.day.from_now + 1.hour) }
    let!(:confirmed_appointment) { create(:appointment, provider: provider, client: client, status: :confirmed) }
    let!(:cancelled_appointment) { create(:appointment, provider: provider, client: client, status: :cancelled) }

    describe '.past' do
      it 'returns appointments in the past' do
        expect(Appointment.past).to include(past_appointment)
        expect(Appointment.past).not_to include(future_appointment)
      end
    end

    describe '.upcoming' do
      it 'returns future appointments' do
        expect(Appointment.upcoming).to include(future_appointment)
        expect(Appointment.upcoming).not_to include(past_appointment)
      end
    end

    describe '.for_provider' do
      it 'returns appointments for a specific provider' do
        expect(Appointment.for_provider(provider)).to include(past_appointment, future_appointment)
      end
    end

    describe '.for_client' do
      it 'returns appointments for a specific client' do
        expect(Appointment.for_client(client)).to include(past_appointment, future_appointment)
      end
    end

    describe '.with_status' do
      it 'returns appointments with specific status' do
        expect(Appointment.with_status(:confirmed)).to include(confirmed_appointment)
        expect(Appointment.with_status(:cancelled)).to include(cancelled_appointment)
      end
    end
  end

  describe 'instance methods' do
    let(:appointment) { build(:appointment, provider: provider, client: client) }

    describe '#duration_in_minutes' do
      it 'calculates duration correctly' do
        appointment.start_time = Time.current
        appointment.end_time = Time.current + 30.minutes
        expect(appointment.duration_in_minutes).to eq(30)
      end
    end

    describe '#can_be_cancelled?' do
      it 'returns true for pending appointments' do
        appointment.status = :pending
        expect(appointment.can_be_cancelled?).to be true
      end

      it 'returns true for confirmed appointments' do
        appointment.status = :confirmed
        expect(appointment.can_be_cancelled?).to be true
      end

      it 'returns false for completed appointments' do
        appointment.status = :completed
        expect(appointment.can_be_cancelled?).to be false
      end

      it 'returns false for cancelled appointments' do
        appointment.status = :cancelled
        expect(appointment.can_be_cancelled?).to be false
      end
    end

    describe '#can_be_confirmed?' do
      it 'returns true for pending appointments' do
        appointment.status = :pending
        expect(appointment.can_be_confirmed?).to be true
      end

      it 'returns false for confirmed appointments' do
        appointment.status = :confirmed
        expect(appointment.can_be_confirmed?).to be false
      end
    end

    describe '#overlaps_with?' do
      let(:base_appointment) { build(:appointment, start_time: Time.current, end_time: Time.current + 1.hour) }
      let(:overlapping_appointment) { build(:appointment, start_time: Time.current + 30.minutes, end_time: Time.current + 90.minutes) }
      let(:non_overlapping_appointment) { build(:appointment, start_time: Time.current + 2.hours, end_time: Time.current + 3.hours) }

      it 'detects overlapping appointments' do
        expect(base_appointment.overlaps_with?(overlapping_appointment)).to be true
      end

      it 'detects non-overlapping appointments' do
        expect(base_appointment.overlaps_with?(non_overlapping_appointment)).to be false
      end
    end

    describe '#formatted_date_time' do
      it 'formats date and time correctly' do
        appointment.start_time = Time.parse('2023-12-01 14:30:00')
        result = appointment.formatted_date_time
        expect(result).to include('December 1, 2023')
        expect(result).to include('2:30 PM')
      end
    end
  end

  describe 'validations' do
    context 'with valid attributes' do
      it 'is valid' do
        appointment = build(:appointment, provider: provider, client: client)
        expect(appointment).to be_valid
      end
    end

    context 'with invalid attributes' do
      it 'is invalid without start_time' do
        appointment = build(:appointment, provider: provider, client: client, start_time: nil)
        expect(appointment).not_to be_valid
        expect(appointment.errors[:start_time]).to include("can't be blank")
      end

      it 'is invalid without end_time' do
        appointment = build(:appointment, provider: provider, client: client, end_time: nil)
        expect(appointment).not_to be_valid
        expect(appointment.errors[:end_time]).to include("can't be blank")
      end

      it 'is invalid when end_time is before start_time' do
        appointment = build(:appointment, 
          provider: provider, 
          client: client,
          start_time: Time.current + 1.hour,
          end_time: Time.current
        )
        expect(appointment).not_to be_valid
        expect(appointment.errors[:end_time]).to include('must be after start time')
      end

      it 'is invalid when provider is not a provider role' do
        non_provider = create(:user, :client)
        appointment = build(:appointment, provider: non_provider, client: client)
        expect(appointment).not_to be_valid
        expect(appointment.errors[:provider]).to include('must be a provider')
      end

      it 'is invalid when client is not a client role' do
        non_client = create(:user, :provider)
        appointment = build(:appointment, provider: provider, client: non_client)
        expect(appointment).not_to be_valid
        expect(appointment.errors[:client]).to include('must be a client')
      end
    end

    context 'overlapping appointments' do
      let!(:existing_appointment) {
        create(:appointment, 
          provider: provider, 
          client: client,
          start_time: Time.current + 1.hour,
          end_time: Time.current + 2.hours
        )
      }

      it 'prevents overlapping appointments for the same provider' do
        overlapping_appointment = build(:appointment,
          provider: provider,
          client: create(:user, :client),
          start_time: Time.current + 90.minutes,
          end_time: Time.current + 150.minutes
        )
        
        expect(overlapping_appointment).not_to be_valid
        expect(overlapping_appointment.errors[:base]).to include('Provider is not available during this time')
      end

      it 'allows non-overlapping appointments' do
        non_overlapping_appointment = build(:appointment,
          provider: provider,
          client: create(:user, :client),
          start_time: Time.current + 3.hours,
          end_time: Time.current + 4.hours
        )
        
        expect(non_overlapping_appointment).to be_valid
      end
    end
  end
end 