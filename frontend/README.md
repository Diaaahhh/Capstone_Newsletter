# EWU Newsletter Backend

A full-stack web application with user authentication using Node.js, Express.js, and MongoDB.

## Features

- User registration and login with JWT authentication
- Password hashing with bcrypt
- Role-based access control (Student, Faculty, Admin)
- Protected routes with authentication middleware
- MongoDB integration with Mongoose

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)

## Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd NewLetterEWU
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:

   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/ewunewsletter
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=7d
   ```

4. Start MongoDB service on your local machine.

## Usage

### Development Mode

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

The server will start on port 5000 (or the port specified in your `.env` file).

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get authenticated user profile

### Example Protected Routes

- `GET /api/example/protected` - Accessible to all authenticated users
- `GET /api/example/admin-only` - Accessible to admin users only
- `GET /api/example/faculty-or-admin` - Accessible to faculty and admin users only

## Role-Based Access

The system automatically assigns roles based on email domains:

- `@std.ewubd.edu` - Student
- `@ewubd.edu` (but not @std.ewubd.edu) - Faculty
- `admin@ewubd.edu` - Admin

## Frontend Integration

Refer to `FRONTEND_INTEGRATION.md` for detailed instructions on integrating the backend API with the existing frontend pages.

## Project Structure

```
NewLetterEWU/
├── config/
│   └── db.js              # Database configuration
├── controllers/
│   └── authController.js   # Authentication controller
├── middleware/
│   └── auth.js             # Authentication middleware
├── models/
│   └── User.js             # User model
├── routes/
│   ├── auth.js             # Authentication routes
│   └── example.js          # Example protected routes
├── .env                    # Environment variables
├── package.json            # Project dependencies
├── server.js               # Main server file
├── FRONTEND_INTEGRATION.md # Frontend integration guide
└── README.md               # Project documentation
```

## Dependencies

- express: Web framework
- mongoose: MongoDB object modeling
- bcryptjs: Password hashing
- jsonwebtoken: JWT implementation
- cors: Cross-Origin Resource Sharing
- dotenv: Environment variable management

## Development Dependencies

- nodemon: Auto-restart server during development

## Security Considerations

- Passwords are hashed using bcrypt before storing in the database
- JWT tokens are used for authentication
- CORS is enabled for all origins (configure as needed for production)
- Environment variables are used for sensitive configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a pull request

## License

This project is licensed under the MIT License.
