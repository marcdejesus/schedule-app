FROM ruby:3.1.0-alpine

# Install dependencies
RUN apk add --no-cache \
    build-base \
    postgresql-dev \
    git \
    tzdata \
    nodejs \
    npm

# Set working directory
WORKDIR /app

# Copy Gemfile and install gems
COPY Gemfile ./
COPY Gemfile.lock ./
RUN bundle config set --local without 'development test' && \
    bundle install

# Copy application code
COPY . .

# Expose port
EXPOSE 3001

# Start the application
CMD ["bundle", "exec", "rails", "server", "-b", "0.0.0.0", "-p", "3001"] 