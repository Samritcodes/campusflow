import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicLayout from './layouts/PublicLayout';
import StudentLayout from './layouts/StudentLayout';
import OrganizerLayout from './layouts/OrganizerLayout';
import AdminLayout from './layouts/AdminLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import EventDiscovery from './pages/EventDiscovery';
import EventDetails from './pages/EventDetails';
import StudentDashboard from './pages/student/StudentDashboard';
import MyPassesPage from './pages/student/MyPassesPage';
import StudentAnnouncementsPage from './pages/student/StudentAnnouncementsPage';
import StudentDepartmentsPage from './pages/student/StudentDepartmentsPage';
import StudentProfilePage from './pages/student/StudentProfilePage';
import CampusCalendarPage from './pages/student/CampusCalendarPage';
import OrganizerDashboard from './pages/organizer/OrganizerDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminDepartmentsPage from './pages/admin/AdminDepartmentsPage';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import DiagnosticsPage from './pages/dev/DiagnosticsPage';
import CommandPalette from './components/common/CommandPalette';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <CommandPalette />
          <Routes>
            {/* Public Editorial Campus Experience */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/events" element={<EventDiscovery />} />
              <Route path="/events/:slug" element={<EventDetails />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/dev/diagnostics" element={<DiagnosticsPage />} />
            </Route>

            {/* Student Workspace */}
            <Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
              <Route path="/student" element={<StudentLayout />}>
                <Route index element={<StudentDashboard />} />
                <Route path="discover" element={<EventDiscovery />} />
                <Route path="calendar" element={<CampusCalendarPage />} />
                <Route path="events/:slug" element={<EventDetails />} />
                <Route path="passes" element={<MyPassesPage />} />
                <Route path="announcements" element={<StudentAnnouncementsPage />} />
                <Route path="departments" element={<StudentDepartmentsPage />} />
                <Route path="profile" element={<StudentProfilePage />} />
              </Route>
            </Route>

            {/* Organizer & Department Manager Workspace */}
            <Route element={<ProtectedRoute allowedRoles={['ORGANIZER', 'DEPARTMENT_MANAGER', 'ADMIN']} />}>
              <Route path="/organizer" element={<OrganizerLayout />}>
                <Route index element={<OrganizerDashboard />} />
                <Route path="calendar" element={<CampusCalendarPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="events/:slug" element={<EventDetails />} />
                <Route path="verify-pass" element={<OrganizerDashboard />} />
                <Route path="announcements" element={<StudentAnnouncementsPage />} />
                <Route path="team" element={<AdminUsersPage />} />
              </Route>
            </Route>

            {/* Admin Workspace */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="calendar" element={<CampusCalendarPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="events/:slug" element={<EventDetails />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="departments" element={<AdminDepartmentsPage />} />
                <Route path="announcements" element={<StudentAnnouncementsPage />} />
                <Route path="verify-pass" element={<OrganizerDashboard />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
