import { create } from 'zustand';

const STORAGE_KEY = 'signlearn-auth-user';

const createSessionId = () => `sess_${Math.random().toString(36).slice(2, 11)}`;

const readStoredUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('Failed to read stored auth user', error);
    return null;
  }
};

const persistUser = (user) => {
  if (typeof window === 'undefined') return;
  if (!user) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
};

const initialUser = readStoredUser();

const useStore = create((set) => ({
  // Auth state
  currentUser: initialUser,
  userId: initialUser?.id || '',
  userRole: initialUser?.role || '',
  sessionId: createSessionId(),
  setAuthenticatedUser: (user) =>
    set(() => {
      persistUser(user);
      return {
        currentUser: user,
        userId: user?.id || '',
        userRole: user?.role || '',
        sessionId: createSessionId(),
      };
    }),
  logout: () =>
    set(() => {
      persistUser(null);
      return {
        currentUser: null,
        userId: '',
        userRole: '',
        currentVideo: null,
        activePopup: null,
        isWebcamActive: false,
        sessionId: createSessionId(),
      };
    }),

  // Video state
  currentVideo: null,
  setCurrentVideo: (video) => set({ currentVideo: video }),

  // Attention state
  attentionStatus: 'attentive',
  setAttentionStatus: (status) => set({ attentionStatus: status }),

  // Popup state
  activePopup: null,
  setActivePopup: (popup) => set({ activePopup: popup }),

  // System flags
  isWebcamActive: false,
  setWebcamActive: (isActive) => set({ isWebcamActive: isActive }),
}));

export default useStore;
