# Rental Hub Backend

A comprehensive property management platform backend built with Node.js, Express, and AdminJS.

## Features

- User authentication and authorization
- Property management
- Tenant management
- Lease management
- Maintenance request tracking
- Payment processing
- Document management
- Admin dashboard

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v8 or higher)
- npm or yarn

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a MySQL database:
   ```sql
   CREATE DATABASE rental_hub_db;
   ```

4. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update the following variables:
     ```
     DB_HOST=localhost
     DB_USER=your_mysql_username
     DB_PASSWORD=your_mysql_password
     DB_NAME=rental_hub_db
     JWT_SECRET=your_jwt_secret
     SESSION_SECRET=your_session_secret
     ```

5. Start the server:
   ```bash
   npm start
   ```

## API Endpoints

### Authentication
- POST /api/auth/register - Register new user
- POST /api/auth/login - Login user
- GET /api/auth/me - Get current user
- PUT /api/auth/profile - Update user profile
- PUT /api/auth/change-password - Change password

### Properties
- GET /api/properties - Get all properties
- GET /api/properties/:id - Get single property
- POST /api/properties - Create new property
- PUT /api/properties/:id - Update property
- DELETE /api/properties/:id - Delete property
- GET /api/properties/:id/maintenance - Get property maintenance history
- GET /api/properties/:id/leases - Get property lease history

### Tenants
- GET /api/tenants - Get all tenants
- GET /api/tenants/:id - Get single tenant
- POST /api/tenants - Create new tenant
- PUT /api/tenants/:id - Update tenant
- DELETE /api/tenants/:id - Delete tenant
- GET /api/tenants/:id/leases - Get tenant's lease history
- POST /api/tenants/:id/check-affordability - Check tenant affordability

### Leases
- GET /api/leases - Get all leases
- GET /api/leases/:id - Get single lease
- POST /api/leases - Create new lease
- PUT /api/leases/:id - Update lease
- DELETE /api/leases/:id - Delete lease
- GET /api/leases/:id/payments - Get lease payments
- POST /api/leases/:id/payments - Record payment
- POST /api/leases/:id/generate-document - Generate lease document

### Maintenance
- GET /api/maintenance - Get all maintenance requests
- GET /api/maintenance/:id - Get single maintenance request
- POST /api/maintenance - Create new maintenance request
- PUT /api/maintenance/:id - Update maintenance request
- DELETE /api/maintenance/:id - Delete maintenance request
- PUT /api/maintenance/:id/assign - Assign maintenance request
- PUT /api/maintenance/:id/complete - Complete maintenance request

## Admin Dashboard

The AdminJS dashboard is available at `/admin` after logging in with admin credentials.

## Security

- JWT-based authentication
- Role-based access control
- Password hashing
- Input validation
- CORS enabled
- Helmet security headers

## Error Handling

The API includes comprehensive error handling for:
- Authentication errors
- Authorization errors
- Validation errors
- Database errors
- Not found errors

## Development

To run the server in development mode with hot reloading:
```bash
npm run dev
```

## Testing

To run tests:
```bash
npm test
```

## License

MIT 