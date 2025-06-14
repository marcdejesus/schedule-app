# Smart Scheduling SaaS

A scalable, service-oriented scheduling platform designed for professionals to manage availability, book appointments, and receive notifications.

## Architecture

This application follows a microservice architecture with the following components:

- **Auth Service**: User registration, login, role-based access (JWT + Devise)
- **Scheduling Service**: Core Rails API with endpoints for availability, bookings, and calendars
- **Notification Service**: Queued emails and reminders using Sidekiq
- **Frontend**: React (Next.js) client application

## Tech Stack

- **Backend**: Ruby on Rails (API mode)
- **Frontend**: React with Next.js
- **Database**: PostgreSQL
- **Cache/Queue**: Redis
- **Authentication**: Devise + OmniAuth (Google)
- **Background Jobs**: Sidekiq
- **Containerization**: Docker & Docker Compose
- **Testing**: RSpec (backend), React Testing Library (frontend)

## Quick Start

1. Clone the repository
2. Install dependencies: `./scripts/setup.sh`
3. Start services: `docker-compose up`
4. Visit http://localhost:3000 for the frontend
5. API available at http://localhost:3002

## Development

### Prerequisites

- Docker & Docker Compose
- Node.js 18+
- Ruby 3.1+
- PostgreSQL 14+
- Redis

### Setup

```bash
# Install dependencies
./scripts/setup.sh

# Start all services
docker-compose up

# Run tests
./scripts/test.sh
```

### Services

- **Frontend**: http://localhost:3000 (Next.js)
- **API**: http://localhost:3002 (Rails API)
- **Notifications**: Background service (Sidekiq)

## API Documentation

API documentation is available at http://localhost:3002/api-docs when running in development mode.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details. 