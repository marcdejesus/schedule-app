# frozen_string_literal: true

require 'rails_helper'

RSpec.describe User, type: :model do
  describe 'validations' do
    it 'is valid with valid attributes' do
      user = User.new(
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
        role: 'client',
        timezone: 'UTC'
      )
      expect(user).to be_valid
    end

    it 'requires an email' do
      user = User.new(
        name: 'Test User',
        password: 'password123',
        role: 'client',
        timezone: 'UTC'
      )
      expect(user).to_not be_valid
      expect(user.errors[:email]).to include("can't be blank")
    end

    it 'requires a name' do
      user = User.new(
        email: 'test@example.com',
        password: 'password123',
        role: 'client',
        timezone: 'UTC'
      )
      expect(user).to_not be_valid
      expect(user.errors[:name]).to include("can't be blank")
    end
  end

  describe 'enums' do
    it 'has the expected roles' do
      expect(User.roles.keys).to include('client', 'provider', 'admin')
    end
  end

  describe 'instance methods' do
    it 'responds to basic methods' do
      user = User.new
      expect(user).to respond_to(:email)
      expect(user).to respond_to(:name)
      expect(user).to respond_to(:role)
    end
  end
end 