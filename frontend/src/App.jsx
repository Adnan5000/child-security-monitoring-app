import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { authAPI } from './services/api'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import Dashboard from './pages/Dashboard'
import ChildrenList from './pages/ChildrenList'
import AddChild from './pages/AddChild'
import EditChild from './pages/EditChild'
import './App.css'

// Protected Route Component
function ProtectedRoute({ children }) {
  const isAuthenticated = authAPI.isAuthenticated()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

// Public Route Component (redirect to dashboard if already logged in)
function PublicRoute({ children }) {
  const isAuthenticated = authAPI.isAuthenticated()
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        <Route 
          path="/signup" 
          element={
            <PublicRoute>
              <SignUp />
            </PublicRoute>
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/children" 
          element={
            <ProtectedRoute>
              <ChildrenList />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/add-child" 
          element={
            <ProtectedRoute>
              <AddChild />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/edit-child/:childId" 
          element={
            <ProtectedRoute>
              <EditChild />
            </ProtectedRoute>
          } 
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
