# Child Security & Monitoring App

A comprehensive child security and monitoring application built with React (frontend) and Python FastAPI (backend), initially designed for Android devices.

## Project Structure

```
child-security-monitoring-app/
├── frontend/          # React application (Vite)
├── backend/           # Python FastAPI backend
└── Diagrams/          # UML diagrams and documentation
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Python (v3.8 or higher)
- npm or yarn
- PostgreSQL (v12 or higher)
- Redis (v6 or higher)

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies (if not already installed):
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment (recommended):
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

5. Set up PostgreSQL database:
```bash
# Create database
createdb child_security_db

# Or using psql:
psql -U postgres
CREATE DATABASE child_security_db;
\q
```

6. Run database migrations:
```bash
# Create initial migration
alembic revision --autogenerate -m "Initial migration"

# Apply migrations
alembic upgrade head
```

7. Start Redis (if not running as a service):
```bash
# macOS (using Homebrew)
brew services start redis

# Or run directly
redis-server
```

8. Start the backend server:
```bash
python run.py
```

Or using uvicorn directly:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend API will be available at `http://localhost:8000`

API documentation (Swagger UI) will be available at `http://localhost:8000/docs`

## Development

### Running Both Servers

You'll need to run both the frontend and backend servers in separate terminals:

**Terminal 1 - Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 2 - Backend:**
```bash
cd backend
python run.py
```

## Features (Planned)

- 📍 Real-time location tracking
- 🚨 Emergency alerts and SOS functionality
- 📱 Device status monitoring
- 👨‍👩‍👧‍👦 Parent dashboard
- 📞 Emergency contact management
- 🔔 Push notifications

## Technology Stack

- **Frontend**: React 19, Vite
- **Backend**: FastAPI, Python 3.8+
- **Database**: PostgreSQL (with SQLAlchemy ORM)
- **Cache**: Redis (for real-time location caching)
- **Migrations**: Alembic
- **Target Platform**: Android (initially)

## Database Architecture

The application uses a **PostgreSQL + Redis** architecture:

- **PostgreSQL**: Primary database for all persistent data (users, children, locations, alerts, etc.)
- **Redis**: Real-time caching layer for:
  - Current location data (TTL: 5 minutes)
  - Device status (TTL: 1 minute)
  - Fast lookups and real-time updates

### Database Models

The database schema is based on the UML class diagram and includes:
- Users & Parents
- Children profiles
- Location tracking (with history)
- Emergency contacts
- Alerts & Alert distributions
- Device status
- Shake detector configuration

See `backend/app/models/` for all model definitions.

## License

This project is part of a university project for child security monitoring.

