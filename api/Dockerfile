FROM ruby:3.2.3-alpine

# Install dependencies
RUN apk add --no-cache \
    build-base \
    postgresql-dev \
    git \
    tzdata \
    nodejs \
    npm \
    curl

# Set working directory
WORKDIR /app

# Create a non-root user
RUN addgroup -g 1000 app && \
    adduser -u 1000 -G app -s /bin/sh -D app

# Copy Gemfile and install gems
COPY Gemfile ./
COPY Gemfile.lock ./

# Install bootsnap and gems
RUN gem install bootsnap -v '1.18.6' && \
    bundle config set --local without 'development test' && \
    bundle install && \
    rm -rf /usr/local/bundle/cache/*.gem && \
    find /usr/local/bundle/gems/ -name "*.c" -delete && \
    find /usr/local/bundle/gems/ -name "*.o" -delete

# Copy application code
COPY . .

# Set proper ownership
RUN chown -R app:app /app

# Switch to non-root user
USER app

# Expose port
EXPOSE 3001

# Start the application
CMD ["bundle", "exec", "rails", "server", "-b", "0.0.0.0", "-p", "3001"] 