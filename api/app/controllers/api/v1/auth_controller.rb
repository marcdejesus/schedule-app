module Api
  module V1
    class AuthController < ApplicationController
      skip_before_action :authenticate_user_unless_public_endpoint!, except: [:oauth_verify]

      def email_confirmation
        user = User.confirm_by_token(params[:confirmation_token])
        
        if user.errors.empty?
          render json: {
            message: 'Your email has been successfully confirmed.',
            user: UserSerializer.new(user).serializable_hash[:data][:attributes]
          }, status: :ok
        else
          render json: { message: 'Confirmation token is invalid or has expired.' }, status: :unprocessable_entity
        end
      end
      
      def resend_confirmation
        user = User.find_by(email: params[:email])
        
        if user && !user.confirmed?
          user.send_confirmation_instructions
          render json: { message: 'Confirmation instructions have been sent to your email.' }, status: :ok
        elsif user && user.confirmed?
          render json: { message: 'Your account has already been confirmed.' }, status: :ok
        else
          render json: { message: 'No account found with that email address.' }, status: :unprocessable_entity
        end
      end
      
      def verify_confirmation_token
        user = User.find_by_confirmation_token(params[:confirmation_token])
        
        if user
          render json: {
            user: { email: user.email, name: user.name }
          }, status: :ok
        else
          render json: { message: 'Confirmation token is invalid or has expired.' }, status: :unprocessable_entity
        end
      end

      def reset_password_request
        user = User.find_by(email: params[:email])
        
        if user
          user.send_reset_password_instructions
          render json: { message: 'Password reset instructions have been sent to your email.' }, status: :ok
        else
          render json: { message: 'No account found with that email address.' }, status: :unprocessable_entity
        end
      end
      
      def reset_password
        user = User.reset_password_by_token(
          reset_password_token: params[:reset_password_token],
          password: params[:password],
          password_confirmation: params[:password_confirmation]
        )
        
        if user.errors.empty?
          render json: { message: 'Your password has been successfully reset.' }, status: :ok
        else
          render json: { message: 'Failed to reset password.', errors: user.errors.full_messages }, status: :unprocessable_entity
        end
      end
      
      def verify_reset_token
        user = User.find_by_reset_password_token(params[:reset_password_token])
        
        if user && user.reset_password_period_valid?
          render json: {
            user: { email: user.email, name: user.name }
          }, status: :ok
        else
          render json: { message: 'Password reset token is invalid or has expired.' }, status: :unprocessable_entity
        end
      end

      def oauth_verify
        # Verify JWT token and get user
        begin
          token = request.headers['Authorization']&.split(' ')&.last
          payload = JWT.decode(token, jwt_secret, true, { algorithm: 'HS256' })[0]
          user = User.find(payload['user_id'])

          # If this is a signup with role (new Google user), update the role
          if params[:role].present?
            # Only allow role update if this is a new user (created in last minute)
            if user.created_at > 1.minute.ago
              user.update!(role: params[:role])
            end
          end

          # Generate a fresh token
          fresh_token = encode_jwt_token(user)

          render json: {
            message: 'OAuth authentication successful',
            user: UserSerializer.new(user).serializable_hash[:data][:attributes],
            token: fresh_token
          }, status: :ok
        rescue JWT::DecodeError, ActiveRecord::RecordNotFound => e
          Rails.logger.error "OAuth verification failed: #{e.message}"
          render json: { message: 'Invalid or expired authentication token' }, status: :unauthorized
        rescue => e
          Rails.logger.error "OAuth verification error: #{e.message}"
          render json: { message: 'Authentication error' }, status: :internal_server_error
        end
      end

      private

      def encode_jwt_token(user)
        payload = {
          user_id: user.id,
          email: user.email,
          role: user.role,
          exp: 24.hours.from_now.to_i
        }
        
        JWT.encode(payload, jwt_secret, 'HS256')
      end

      def jwt_secret
        Rails.application.credentials.secret_key_base || ENV['JWT_SECRET'] || 'fallback_secret_for_development'
      end
    end
  end
end 