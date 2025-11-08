# Task Management Backend

Real-Time Collaborative Task Management System Backend built with NestJS, TypeORM, PostgreSQL, and MongoDB.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=task_management
MONGODB_URI=mongodb://localhost:27017/task_management
REDIS_HOST=localhost
REDIS_PORT=6379
USE_REDIS=true
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h
PORT=3000
FRONTEND_URL=http://localhost:3001
```

3. Make sure PostgreSQL, MongoDB, and Redis are running

   **Redis Setup:**
   - Install Redis: `sudo apt-get install redis-server` (Ubuntu/Debian) or `brew install redis` (macOS)
   - Start Redis: `redis-server` or `sudo systemctl start redis` (Linux)
   - Verify Redis is running: `redis-cli ping` (should return `PONG`)
   - To disable Redis and use in-memory cache: Set `USE_REDIS=false` in `.env`

4. Run development server:
```bash
npm run start:dev
```

5. Run tests:
```bash
npm test
```

## API Endpoints

### Authentication
- POST `/auth/register` - Register new user
- POST `/auth/login` - Login user

### Users
- GET `/users` - Get all users (Admin only)
- GET `/users/profile` - Get current user profile
- PUT `/users/profile` - Update current user profile
- PUT `/users/:id` - Update user (Admin only)
- DELETE `/users/:id` - Delete user (Admin only)

### Tasks
- GET `/tasks` - Get all tasks
- GET `/tasks/:id` - Get task by id
- POST `/tasks` - Create task
- PATCH `/tasks/:id` - Update task
- DELETE `/tasks/:id` - Delete task

## WebSocket Events

- `task-update` - Emitted when any task is updated
- `task-assigned` - Emitted when task is assigned to a user
- `task-created` - Emitted when a new task is created

