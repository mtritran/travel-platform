import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MarketplacePage from './pages/MarketplacePage';
import TourDetailPage from './pages/TourDetailPage';
import MyBookingsPage from './pages/MyBookingsPage';
import TripRequestsPage from './pages/TripRequestsPage';
import BecomeGuidePage from './pages/BecomeGuidePage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminGuideApplications from './pages/admin/AdminGuideApplications';
import AdminReports from './pages/admin/AdminReports';
import AdminToursPage from './pages/admin/AdminToursPage';
import AdminDisputesPage from './pages/admin/AdminDisputesPage';
import AdminReviewsPage from './pages/admin/AdminReviewsPage';
import CreateTourPage from './pages/guide/CreateTourPage';
import EditTourPage from './pages/guide/EditTourPage';
import GuideToursPage from './pages/guide/GuideToursPage';
import GuideBookingsPage from './pages/guide/GuideBookingsPage';
import ProfilePage from './pages/ProfilePage';
import WalletPage from './pages/WalletPage';
import PaymentCallbackPage from './pages/PaymentCallbackPage';
import CreateTourRequestPage from './pages/customer/CreateTourRequestPage';
import PublicProfilePage from './pages/PublicProfilePage';
import MessagesPage from './pages/MessagesPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { LocationProvider } from './context/LocationContext';

// Improved Protected Route component with role support
const ProtectedRoute = ({ children, role }: { children: React.ReactNode, role?: string }) => {
  const { user, loading } = useAuth();
  const token = localStorage.getItem('token');

  if (loading) return <div style={{ textAlign: 'center', padding: '100px 0' }}>Đang tải...</div>;
  
  if (!token) return <Navigate to="/login" replace />;
  
  if (role && !user?.roles?.some(r => r.name === role)) {
    // If user is not admin and tries to access admin, send home
    if (role === 'ADMIN') return <Navigate to="/" replace />;
    // If admin tries to access user page, send to admin dashboard
    if (user?.roles?.some(r => r.name === 'ADMIN')) return <Navigate to="/admin" replace />;
    return <Navigate to="/" replace />;
  }

  // Auto-redirect Admin from home to dashboard if they land on "/"
  if (!role && window.location.pathname === '/' && user?.roles?.some(r => r.name === 'ADMIN')) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <LocationProvider>
          <NotificationProvider>
            <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Marketplace - Public Route */}
            <Route path="/" element={<MarketplacePage />} />

            <Route path="/tours/:id" element={<TourDetailPage />} />

            <Route path="/bookings" element={
              <ProtectedRoute>
                <MyBookingsPage />
              </ProtectedRoute>
            } />

            <Route path="/requests" element={
              <ProtectedRoute>
                <TripRequestsPage />
              </ProtectedRoute>
            } />

            <Route path="/become-guide" element={
              <ProtectedRoute>
                <BecomeGuidePage />
              </ProtectedRoute>
            } />

            <Route path="/customer/create-request" element={
              <ProtectedRoute>
                <CreateTourRequestPage />
              </ProtectedRoute>
            } />

            <Route path="/admin" element={
              <ProtectedRoute role="ADMIN">
                <AdminDashboard />
              </ProtectedRoute>
            } />

            <Route path="/admin/users" element={
              <ProtectedRoute role="ADMIN">
                <AdminUsersPage />
              </ProtectedRoute>
            } />

            <Route path="/admin/applications" element={
              <ProtectedRoute role="ADMIN">
                <AdminGuideApplications />
              </ProtectedRoute>
            } />

            <Route path="/admin/reports" element={
              <ProtectedRoute role="ADMIN">
                <AdminReports />
              </ProtectedRoute>
            } />

            <Route path="/admin/tours" element={
              <ProtectedRoute role="ADMIN">
                <AdminToursPage />
              </ProtectedRoute>
            } />

            <Route path="/admin/disputes" element={
              <ProtectedRoute role="ADMIN">
                <AdminDisputesPage />
              </ProtectedRoute>
            } />

            <Route path="/admin/reviews" element={
              <ProtectedRoute role="ADMIN">
                <AdminReviewsPage />
              </ProtectedRoute>
            } />

            <Route path="/guide/create-tour" element={
              <ProtectedRoute role="GUIDE">
                <CreateTourPage />
              </ProtectedRoute>
            } />

            <Route path="/guide/tours" element={
              <ProtectedRoute role="GUIDE">
                <GuideToursPage />
              </ProtectedRoute>
            } />

            <Route path="/guide/bookings" element={
              <ProtectedRoute role="GUIDE">
                <GuideBookingsPage />
              </ProtectedRoute>
            } />

            <Route path="/guide/edit-tour/:id" element={
              <ProtectedRoute role="GUIDE">
                <EditTourPage />
              </ProtectedRoute>
            } />

            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />

            <Route path="/profile/:id" element={
              <ProtectedRoute>
                <PublicProfilePage />
              </ProtectedRoute>
            } />

            <Route path="/wallet" element={
              <ProtectedRoute>
                <WalletPage />
              </ProtectedRoute>
            } />

            <Route path="/payment-callback" element={
              <ProtectedRoute>
                <PaymentCallbackPage />
              </ProtectedRoute>
            } />

            <Route path="/messages" element={
              <ProtectedRoute>
                <MessagesPage />
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </NotificationProvider>
      </LocationProvider>
    </AuthProvider>
    </Router>
  );
}

export default App;
