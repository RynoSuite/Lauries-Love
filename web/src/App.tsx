import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './lib/auth';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Onboarding } from './pages/Onboarding';
import { Feed } from './pages/Feed';
import { Groups } from './pages/Groups';
import { Messages } from './pages/Messages';
import { Profile } from './pages/Profile';
import { MapPage } from './pages/MapPage';
import { UserProfile } from './pages/UserProfile';
import { PostDetail } from './pages/PostDetail';
import { Support } from './pages/Support';
import { GroupDetail } from './pages/GroupDetail';
import { Donate } from './pages/Donate';
import { Notifications } from './pages/Notifications';
import { Sponsorships } from './pages/Sponsorships';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminFeatures } from './pages/admin/Features';
import { AdminMembers } from './pages/admin/Members';
import { AdminModeration } from './pages/admin/Moderation';
import { AdminSupportInbox } from './pages/admin/SupportInbox';
import { AdminGroups } from './pages/admin/Groups';
import { AdminBranding } from './pages/admin/Branding';
import { AdminCustomFields } from './pages/admin/CustomFields';
import { AdminPlatformConfig } from './pages/admin/PlatformConfig';

export default function App() {
  const { loading } = useAuth();
  if (loading)
    return (
      <div className="grid min-h-screen place-items-center text-heading">
        Loading…
      </div>
    );

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Member web app */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Feed />} />
        <Route path="welcome" element={<Onboarding />} />
        <Route path="groups" element={<Groups />} />
        <Route path="groups/:id" element={<GroupDetail />} />
        <Route path="messages" element={<Messages />} />
        <Route path="profile" element={<Profile />} />
        <Route path="map" element={<MapPage />} />
        <Route path="users/:id" element={<UserProfile />} />
        <Route path="posts/:id" element={<PostDetail />} />
        <Route path="donate" element={<Donate />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="support" element={<Support />} />
        <Route path="sponsors" element={<Sponsorships />} />
      </Route>

      {/* Admin console (staff only) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requireStaff>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="members" element={<AdminMembers />} />
        <Route path="support" element={<AdminSupportInbox />} />
        <Route path="moderation" element={<AdminModeration />} />
        <Route path="features" element={<AdminFeatures />} />
        <Route path="groups" element={<AdminGroups />} />
        <Route path="branding" element={<AdminBranding />} />
        <Route path="custom-fields" element={<AdminCustomFields />} />
        <Route path="settings" element={<AdminPlatformConfig />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
