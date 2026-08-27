import { NavLink, useNavigate } from 'react-router-dom';
import {
  Activity,
  BookOpen,
  BrainCircuit,
  ChartColumnBig,
  Hand,
  History,
  House,
  LogOut,
  MessageSquare,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  Upload,
  Watch,
} from 'lucide-react';
import { motion } from 'framer-motion';
import useStore from '../../../modules/shared-app/utils/useStore';

const studentNavItems = [
  { to: '/', icon: House, label: 'Home' },
  { to: '/lesson', icon: BookOpen, label: 'Lesson' },
  { to: '/chatbot', icon: MessageSquare, label: 'Chatbot' },
  { to: '/sign-avatar', icon: Hand, label: 'Sign Avatar' },
  { to: '/sign-course', icon: Sparkles, label: 'Sign Course' },
  { to: '/wristband', icon: Watch, label: 'Wristband' },
  { to: '/history', icon: History, label: 'History' },
];

const adminNavItems = [
  { to: '/admin', icon: ShieldCheck, label: 'Dashboard' },
  { to: '/admin/analytics', icon: ChartColumnBig, label: 'Analytics' },
  { to: '/admin/attention-reports', icon: Activity, label: 'Reports' },
  { to: '/admin/repeated-alerts', icon: History, label: 'Alerts' },
  { to: '/upload', icon: Upload, label: 'Upload' },
];

const Navbar = () => {
  const navigate = useNavigate();
  const { currentUser, userRole, logout, theme, toggleTheme } = useStore();

  const navItems = userRole === 'admin' ? adminNavItems : studentNavItems;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <motion.nav
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32 }}
      className="sticky top-0 z-50 flex w-full justify-center px-2 pt-2 sm:px-4 sm:pt-4"
    >
      <div className="flex w-[min(1460px,100%)] flex-col gap-2.5 rounded-[24px] border border-[var(--nav-border)] bg-[var(--nav-bg)] p-3 shadow-[0_14px_34px_rgba(0,0,0,0.15)] backdrop-blur-xl sm:rounded-[28px] sm:p-4 lg:flex-row lg:items-center lg:justify-between lg:gap-4 transition-colors duration-300">
        {/* Brand Logo & Mode Badge */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-[0_0_12px_rgba(52,211,153,0.1)] sm:h-12 sm:w-12 sm:rounded-2xl">
              <BrainCircuit size={22} />
            </div>
            <div className="min-w-0">
              <h1 className="text-[1.3rem] font-black tracking-tight text-text-main sm:text-[1.6rem] md:text-[1.8rem]">
                SignLearn AI
              </h1>
              <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-primary sm:text-[10px]">
                <Sparkles size={10} className="shrink-0" />
                <span className="truncate">
                  {userRole === 'admin' ? 'Admin Pipeline' : 'Adaptive ICT Tutor'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:hidden">
            {/* Theme Toggle Button Mobile */}
            <button
              type="button"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-border)] bg-bg-card/80 text-text-main transition-all hover:bg-primary/10 hover:text-primary"
            >
              {theme === 'dark' ? (
                <Sun size={17} className="text-amber-400" />
              ) : (
                <Moon size={17} className="text-primary" />
              )}
            </button>

            {/* System Mode Pill for Small Screens */}
            <div className="flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-bg-card/50 px-3 py-1 text-xs text-text-muted">
              <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
              <span className="text-[10px] font-semibold text-text-main">
                {userRole === 'admin' ? 'Admin' : 'Active'}
              </span>
            </div>
          </div>
        </div>

        {/* System Mode Pill for Desktop */}
        <div className="hidden xl:flex items-center gap-2.5 rounded-2xl border border-[var(--color-border)] bg-bg-card/40 px-4 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse" />
          <div className="text-left">
            <div className="text-[10px] font-bold uppercase tracking-wider text-primary">System Mode</div>
            <div className="text-xs font-semibold text-text-main">
              {userRole === 'admin' ? 'Admin Content Pipeline' : 'Live Concept Checkpoints'}
            </div>
          </div>
        </div>

        {/* Navigation Items & Theme Toggle */}
        <div className="flex min-w-0 items-center justify-between gap-2 overflow-x-auto no-scrollbar scroll-smooth">
          <div className="flex w-full min-w-max items-center gap-1 rounded-[18px] bg-bg-card/30 p-1.5 sm:gap-1.5 lg:gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `relative flex items-center justify-center gap-2.5 rounded-[14px] px-4 py-2.5 text-xs font-medium transition-all min-h-[40px] sm:px-5 sm:py-2.5 sm:text-[13px] ${
                    isActive ? 'text-white font-semibold' : 'text-text-muted hover:text-text-main hover:bg-primary/5'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="header-active-pill"
                        className="absolute inset-0 rounded-[14px] bg-[linear-gradient(90deg,rgba(44,151,103,0.9),rgba(91,194,140,0.85))] shadow-[0_0_12px_rgba(34,197,94,0.2)]"
                        transition={{ type: 'spring', stiffness: 340, damping: 30 }}
                      />
                    )}
                    <item.icon size={16} className="relative z-10 shrink-0" />
                    <span className="relative z-10 whitespace-nowrap">{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}

            {/* Theme Toggle Desktop */}
            <button
              type="button"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              className="hidden sm:flex relative items-center justify-center gap-2 rounded-[14px] px-3 py-2 text-xs font-semibold text-text-main border border-[var(--color-border)] bg-bg-card/60 transition-all min-h-[40px] hover:bg-primary/10 hover:border-primary/30 hover:text-primary"
            >
              {theme === 'dark' ? (
                <>
                  <Sun size={16} className="text-amber-400" />
                  <span className="whitespace-nowrap">Light</span>
                </>
              ) : (
                <>
                  <Moon size={16} className="text-primary" />
                  <span className="whitespace-nowrap">Dark</span>
                </>
              )}
            </button>

            {currentUser && (
              <button
                type="button"
                onClick={handleLogout}
                className="relative flex items-center justify-center gap-2.5 rounded-[14px] px-4 py-2.5 text-xs font-medium text-text-muted transition-all min-h-[40px] hover:bg-red-500/10 hover:text-red-500 sm:px-5 sm:py-2.5 sm:text-[13px]"
              >
                <LogOut size={16} className="shrink-0" />
                <span className="whitespace-nowrap">Logout</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;

