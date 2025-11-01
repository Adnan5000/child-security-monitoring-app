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

4. Start the backend server:
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
- **Target Platform**: Android (initially)

## License

This project is part of a university project for child security monitoring.

