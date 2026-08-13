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
      className="sticky top-0 z-50 flex w-full justify-center pt-4"
    >
      <div className="grid w-[min(1460px,calc(100%-2rem))] gap-3 rounded-[28px] border border-white/[0.05] bg-[linear-gradient(180deg,rgba(9,14,11,0.95),rgba(6,10,8,0.94))] px-5 py-4 shadow-[0_14px_34px_rgba(0,0,0,0.16)] backdrop-blur-xl md:px-6 xl:grid-cols-[minmax(220px,0.88fr)_minmax(210px,0.58fr)_minmax(0,1.74fr)] xl:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-primary/10 bg-primary/10 text-primary shadow-[0_0_10px_rgba(52,211,153,0.04)] md:h-13 md:w-13">
            <BrainCircuit size={22} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="text-[1.55rem] font-black tracking-tight text-white sm:text-[1.82rem] md:text-[2rem] xl:text-[2.1rem]">
                SignLearn AI
              </h1>
            </div>
            <div className="mt-1 inline-flex max-w-full items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary md:text-[11px]">
              <Sparkles size={12} />
              <span className="break-words">
                {userRole === 'admin' ? 'Admin Control Center' : 'Knowledge Graph Tutor'}
              </span>
            </div>
          </div>
        </div>

        <div className="justify-self-start xl:justify-self-center">
          <div className="rounded-[20px] bg-white/[0.025] px-4 py-3 xl:min-w-[230px]">
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary md:text-[12px]">
              System Mode
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[0.92rem] font-semibold text-white md:text-[0.98rem]">
              <span className="h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_10px_rgba(52,211,153,0.18)]" />
              {userRole === 'admin' ? 'Admin Content Pipeline' : 'Live Concept Checkpoints'}
            </div>
          </div>
        </div>

        <div className="flex min-w-0 justify-start xl:justify-end">
          <div className="flex w-full flex-wrap items-center gap-3 rounded-[20px] bg-white/[0.02] p-2.5 xl:w-full xl:flex-nowrap xl:justify-end">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `relative flex min-w-[92px] flex-1 items-center justify-center gap-2.5 rounded-[16px] px-3.5 py-2.5 text-sm font-medium transition sm:flex-none md:min-w-[102px] md:text-[0.94rem] xl:min-w-fit xl:flex-none xl:px-4 ${
                    isActive ? 'text-white' : 'text-text-muted hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="header-active-pill"
                        className="absolute inset-0 rounded-[18px] bg-[linear-gradient(90deg,rgba(44,151,103,0.92),rgba(91,194,140,0.78))] shadow-[0_0_14px_rgba(34,197,94,0.12)]"
                        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                      />
                    )}
                    <item.icon size={18} className="relative z-10" />
                    <span className="relative z-10">{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}

            {currentUser && (
              <button
                type="button"
                onClick={handleLogout}
                className="relative flex min-w-[92px] flex-1 items-center justify-center gap-2.5 rounded-[16px] px-3.5 py-2.5 text-sm font-medium text-text-muted transition hover:bg-white/[0.06] hover:text-white sm:flex-none md:min-w-[102px] md:text-[0.94rem] xl:min-w-fit xl:flex-none xl:px-4"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
