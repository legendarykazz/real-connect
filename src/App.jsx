import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';

// Lazy-loaded pages — only downloaded when the user navigates to them
const BrowseLands = React.lazy(() => import('./pages/BrowseLands'));
const PropertyDetails = React.lazy(() => import('./pages/PropertyDetails'));
const ListProperty = React.lazy(() => import('./pages/ListProperty'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const Login = React.lazy(() => import('./pages/Login'));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword'));
const PrivacyPolicy = React.lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = React.lazy(() => import('./pages/TermsOfService'));
const ContactUs = React.lazy(() => import('./pages/ContactUs'));

// -------------------------------------------------------
// ADMIN EMAILS — only these emails can access /admin
// -------------------------------------------------------
const ADMIN_EMAILS = [
  'amjustsam28@gmail.com',
  'zephaniahmusa99@gmail.com',
];

// Loading spinner shown while lazy pages load
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="w-10 h-10 border-4 border-brand-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-500 font-semibold text-sm">Loading...</p>
    </div>
  </div>
);

// Protected route: only logged-in users can access
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// Admin-only route: must be logged in AND have an admin email
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!ADMIN_EMAILS.includes(user.email)) {
    // Logged in but not the admin — show access denied
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 font-sans">
        <div className="bg-white rounded-3xl shadow-lg p-12 max-w-md text-center border border-gray-100">
          <div className="text-6xl mb-6">🔒</div>
          <h1 className="text-2xl font-extrabold text-brand-dark mb-3">Access Denied</h1>
          <p className="text-gray-500 mb-8">This page is restricted to RealConnect administrators only. If you believe this is an error, please contact support.</p>
          <a href="/" className="inline-block bg-brand-green text-white font-bold px-8 py-3 rounded-xl hover:bg-green-700 transition-colors">
            Go Back Home
          </a>
        </div>
      </div>
    );
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Router>
          <div className="min-h-screen font-sans bg-brand-light selection:bg-brand-green selection:text-white">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/browse" element={<BrowseLands />} />
                <Route path="/property/:id" element={<PropertyDetails />} />
                <Route path="/list-property" element={
                  <ProtectedRoute>
                    <ListProperty />
                  </ProtectedRoute>
                } />
                <Route path="/login" element={<Login />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/contact" element={<ContactUs />} />
                {/* Admin: only the owner email can access */}
                <Route path="/admin" element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                } />
              </Routes>
            </Suspense>
          </div>
        </Router>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
