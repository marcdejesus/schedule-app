# Blueprint: Schedule App – Smart Scheduling SaaS

## Application Overview

* **Application Name:** SchedulEase
* **Frameworks:** Ruby on Rails (API mode), React (Next.js)
* **Platform:** Web (Desktop and Mobile Responsive)
* **Description:** A scalable, service-oriented scheduling platform designed for professionals to manage availability, book appointments, and receive notifications. Inspired by Calendly, but designed to showcase technical ownership of SOA, API design, frontend-backend integration, and developer ergonomics.

## Key Features

* Time zone-aware calendar and availability management
* Appointment scheduling and booking logic
* User roles (Admin, Provider, Client) with permissions
* Notification system (email + optional SMS via SendGrid/Twilio)
* OAuth login with Google (Devise + OmniAuth)
* RESTful API with Swagger/OpenAPI documentation
* Background job processing with Sidekiq and Redis
* Scalable Dockerized microservice architecture
* PostgreSQL relational data model

## Technical Architecture

**Services:**

1. **Auth Service** – Handles user registration, login, role-based access (JWT + Devise)
2. **Scheduling Service** – Core Rails API with endpoints for availability, bookings, and calendars
3. **Notification Service** – Node.js or Rails sidekick-powered service for queued emails and reminders

**Infrastructure:**

* Containerized via Docker Compose
* Kubernetes-ready YAML config for cloud scaling
* CI/CD with GitHub Actions + Heroku/GCP deployment

## Core Data Models (Rails)

* **User:** name, email, role (enum), timezone
* **AvailabilitySlot:** user\_id, start\_time, end\_time, recurring
* **Appointment:** provider\_id, client\_id, time\_slot, status (enum)
* **Notification:** appointment\_id, message, type (email/SMS), sent\_at

## API Endpoints (Sample)

* `GET /api/availabilities/:user_id` – Fetch availability
* `POST /api/appointments` – Create new booking
* `GET /api/users/me` – Authenticated profile fetch
* `POST /api/notifications/send` – Trigger reminder queue

## UI/UX Flow

1. **Onboarding:** Sign up with Google, select role, set timezone
2. **Dashboard:** Availability editor (calendar drag/drop), upcoming appointments, quick actions
3. **Booking View:** Public page for clients to book available time
4. **Notifications:** Preferences UI and reminder previews
5. **Mobile-first:** Responsive views for booking and dashboards

## DevOps & Testing

* **Docker Compose** for local dev with Postgres + Redis
* **RSpec** + **FactoryBot** for backend test coverage
* **React Testing Library** for frontend
* **GitHub Actions** for CI + auto-deploy

## Future Enhancements

* GraphQL endpoint for flexible client dev
* Analytics dashboard (admin view)
* API rate-limiting with Rack::Attack
* Full i18n and a11y support

## GitHub Presence & Documentation

* Public GitHub repo with MIT license
* `/docs` folder with architecture diagrams, setup guides, and API schema
* Open issues tagged as "good first issue" to encourage contributions

## Strategic Purpose

This project is designed to:

* Demonstrate full ownership of a Ruby on Rails backend in a mixed stack
* Showcase real-world SOA patterns and microservice orchestration
* Reflect Calendly’s architecture and domain challenges at a smaller scale
* Serve as a deployable, testable SaaS prototype for potential employers
