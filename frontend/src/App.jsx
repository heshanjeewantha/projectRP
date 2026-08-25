import { BrowserRouter, Navigate, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/layout/Navbar/Navbar';
import Footer from './components/layout/Footer/Footer';
import FloatingChatbot from './modules/component-03-adaptive-chatbot/components/FloatingChatbot';
import StudentView from './modules/component-01-attention-monitoring/pages/StudentView';
import History from './modules/component-01-attention-monitoring/pages/History';
import ChatbotPage from './modules/component-03-adaptive-chatbot/pages/ChatbotPage';
import LessonSummaryPage from './modules/component-03-adaptive-chatbot/pages/LessonSummaryPage';
import TeacherAnalyticsDashboard from './modules/component-03-adaptive-chatbot/pages/TeacherAnalyticsDashboard';
import RepeatedQueryAlertsPage from './modules/component-03-adaptive-chatbot/pages/RepeatedQueryAlertsPage';
import SignAvatarPage from './modules/component-04-sign-avatar-lecture-generator/pages/SignAvatarPage';
import WristbandPage from './modules/component-05-smart-wristband-iot/pages/WristbandPage';
import SignCoursePage from './modules/component-05-smart-wristband-iot/pages/SignCoursePage';
import HomePage from './modules/shared-app/pages/HomePage';
import AdminUpload from './modules/shared-app/pages/AdminUpload';
import AdminDashboardPage from './modules/shared-app/pages/AdminDashboardPage';
import AdminAttentionReportsPage from './modules/component-01-attention-monitoring/pages/AdminAttentionReportsPage';
import LoginPage from './modules/shared-app/pages/LoginPage';
import SignupPage from './modules/shared-app/pages/SignupPage';
import useStore from './modules/shared-app/utils/useStore';

const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.4, ease: "easeOut" }}
    className="flex w-full justify-center"
  >
    {children}
  </motion.div>
);

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, userRole } = useStore();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to={userRole === 'admin' ? '/admin' : '/'} replace />;
  }

  return children;
};

const PublicOnlyRoute = ({ children }) => {
  const { currentUser, userRole } = useStore();
  if (currentUser) {
    return <Navigate to={userRole === 'admin' ? '/admin' : '/'} replace />;
  }
  return children;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<PublicOnlyRoute><PageWrapper><LoginPage /></PageWrapper></PublicOnlyRoute>} />
        <Route path="/signup" element={<PublicOnlyRoute><PageWrapper><SignupPage /></PageWrapper></PublicOnlyRoute>} />
        <Route path="/" element={<ProtectedRoute allowedRoles={['student']}><PageWrapper><HomePage /></PageWrapper></ProtectedRoute>} />
        <Route path="/lesson" element={<ProtectedRoute allowedRoles={['student']}><PageWrapper><StudentView /></PageWrapper></ProtectedRoute>} />
        <Route path="/chatbot" element={<ProtectedRoute allowedRoles={['student']}><PageWrapper><ChatbotPage /></PageWrapper></ProtectedRoute>} />
        <Route path="/lesson-summary/:topicId" element={<ProtectedRoute allowedRoles={['student']}><PageWrapper><LessonSummaryPage /></PageWrapper></ProtectedRoute>} />
        <Route path="/sign-avatar" element={<ProtectedRoute allowedRoles={['student']}><PageWrapper><SignAvatarPage /></PageWrapper></ProtectedRoute>} />
        <Route path="/sign-course" element={<ProtectedRoute allowedRoles={['student']}><PageWrapper><SignCoursePage /></PageWrapper></ProtectedRoute>} />
        <Route path="/wristband" element={<ProtectedRoute allowedRoles={['student']}><PageWrapper><WristbandPage /></PageWrapper></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute allowedRoles={['student']}><PageWrapper><History /></PageWrapper></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><PageWrapper><AdminDashboardPage /></PageWrapper></ProtectedRoute>} />
        <Route path="/admin/attention-reports" element={<ProtectedRoute allowedRoles={['admin']}><PageWrapper><AdminAttentionReportsPage /></PageWrapper></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['admin']}><PageWrapper><TeacherAnalyticsDashboard /></PageWrapper></ProtectedRoute>} />
        <Route path="/admin/repeated-alerts" element={<ProtectedRoute allowedRoles={['admin']}><PageWrapper><RepeatedQueryAlertsPage /></PageWrapper></ProtectedRoute>} />
        <Route path="/upload" element={<ProtectedRoute allowedRoles={['admin']}><PageWrapper><AdminUpload /></PageWrapper></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

const AppShell = () => {
  const location = useLocation();
  const authRoutes = ['/login', '/signup'];
  const hideNav = authRoutes.includes(location.pathname);
  const hideFooter =
    hideNav ||
    location.pathname === '/lesson' ||
    location.pathname === '/chatbot' ||
    location.pathname.startsWith('/lesson-summary') ||
    location.pathname === '/sign-avatar' ||
    location.pathname === '/sign-course' ||
    location.pathname === '/wristband' ||
    location.pathname === '/history' ||
    location.pathname === '/upload' ||
    location.pathname === '/admin' ||
    location.pathname === '/admin/analytics' ||
    location.pathname === '/admin/attention-reports' ||
    location.pathname === '/admin/repeated-alerts';

  return (
    <div className="flex min-h-screen flex-col bg-bg-dark selection:bg-primary/30">
      {!hideNav && <Navbar />}
      <main className="flex w-full flex-1 justify-center min-w-0">
        <AnimatedRoutes />
      </main>
      {!hideFooter && <Footer />}
      {!['/login', '/signup', '/chatbot'].includes(location.pathname) && (
        <FloatingChatbot pathname={location.pathname} />
      )}
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

export default App;
