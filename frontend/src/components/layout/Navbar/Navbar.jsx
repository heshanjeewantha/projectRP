import { NavLink, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  BrainCircuit,
  ChartColumnBig,
  Hand,
  History,
  House,
  LogOut,
  MessageSquare,
  ShieldCheck,
  Sparkles,
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
  { to: '/wristband', icon: Watch, label: 'Wristband' },
  { to: '/history', icon: History, label: 'History' },
];

const adminNavItems = [
  { to: '/admin', icon: ShieldCheck, label: 'Dashboard' },
  { to: '/admin/analytics', icon: ChartColumnBig, label: 'Analytics' },
  { to: '/admin/repeated-alerts', icon: History, label: 'Alerts' },
  { to: '/upload', icon: Upload, label: 'Upload' },
];

const Navbar = () => {
  const navigate = useNavigate();
  const { currentUser, userRole, logout } = useStore();

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
      <div className="flex w-[min(1460px,100%)] flex-col gap-2.5 rounded-[24px] border border-white/[0.06] bg-[linear-gradient(180deg,rgba(9,14,11,0.96),rgba(6,10,8,0.96))] p-3 shadow-[0_14px_34px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:rounded-[28px] sm:p-4 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
        {/* Brand Logo & Mode Badge */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-[0_0_12px_rgba(52,211,153,0.1)] sm:h-12 sm:w-12 sm:rounded-2xl">
              <BrainCircuit size={22} />
            </div>
            <div className="min-w-0">
              <h1 className="text-[1.3rem] font-black tracking-tight text-white sm:text-[1.6rem] md:text-[1.8rem]">
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

          {/* System Mode Pill for Small Screens */}
          <div className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1 text-xs text-text-muted sm:hidden">
            <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
            <span className="text-[10px] font-semibold text-white">
              {userRole === 'admin' ? 'Admin' : 'Active'}
            </span>
          </div>
        </div>

        {/* System Mode Pill for Desktop */}
        <div className="hidden xl:flex items-center gap-2.5 rounded-2xl border border-white/[0.04] bg-white/[0.02] px-4 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse" />
          <div className="text-left">
            <div className="text-[10px] font-bold uppercase tracking-wider text-primary">System Mode</div>
            <div className="text-xs font-semibold text-white">
              {userRole === 'admin' ? 'Admin Content Pipeline' : 'Live Concept Checkpoints'}
            </div>
          </div>
        </div>

        {/* Navigation Items - Smooth swipe on mobile, clean row on desktop */}
        <div className="flex min-w-0 items-center overflow-x-auto no-scrollbar scroll-smooth">
          <div className="flex w-full min-w-max items-center gap-1.5 rounded-[18px] bg-white/[0.02] p-1.5 sm:gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `relative flex items-center justify-center gap-2 rounded-[14px] px-3 py-2 text-xs font-medium transition sm:px-3.5 sm:py-2.5 sm:text-sm ${
                    isActive ? 'text-white font-semibold' : 'text-text-muted hover:text-white hover:bg-white/[0.04]'
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

            {currentUser && (
              <button
                type="button"
                onClick={handleLogout}
                className="relative flex items-center justify-center gap-2 rounded-[14px] px-3 py-2 text-xs font-medium text-text-muted transition hover:bg-red-500/10 hover:text-red-300 sm:px-3.5 sm:py-2.5 sm:text-sm"
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
