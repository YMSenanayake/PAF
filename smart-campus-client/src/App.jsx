import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import OAuthRedirect from './components/OAuthRedirect';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './components/Dashboard';
import Resources from './components/Resources';
import Bookings from './components/Bookings';
import Tickets from './components/Tickets';
import Notifications from './components/Notifications';
import UserManagement from './components/admin/UserManagement';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/oauth-redirect" element={<OAuthRedirect />} />

          {/* Protected dashboard routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="resources" element={<Resources />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="tickets" element={<Tickets />} />
            <Route path="notifications" element={<Notifications />} />
            {/* Admin-only */}
            <Route path="users" element={
              <ProtectedRoute requiredRole="ADMIN">
                <UserManagement />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;