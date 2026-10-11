import { create } from 'zustand';

const STORAGE_KEY = 'signlearn-auth-user';
const THEME_KEY = 'signlearn-theme';

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

const readStoredTheme = () => {
  if (typeof window === 'undefined') return 'dark';
  try {
    const raw = window.localStorage.getItem(THEME_KEY);
    return raw === 'light' ? 'light' : 'dark';
  } catch (error) {
    return 'dark';
  }
};

const applyThemeToDOM = (theme) => {
  if (typeof window === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
};

const initialUser = readStoredUser();
const initialTheme = readStoredTheme();
applyThemeToDOM(initialTheme);

const useStore = create((set) => ({
  // Theme state ('dark' | 'light')
  theme: initialTheme,
  setTheme: (theme) =>
    set(() => {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(THEME_KEY, theme);
      }
      applyThemeToDOM(theme);
      return { theme };
    }),
  toggleTheme: () =>
    set((state) => {
      const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(THEME_KEY, nextTheme);
      }
      applyThemeToDOM(nextTheme);
      return { theme: nextTheme };
    }),

  // Auth state
  currentUser: initialUser,
  userId:      initialUser?.id   || '',
  userRole:    initialUser?.role || '',
  sessionId:   createSessionId(),
  setAuthenticatedUser: (user) =>
    set(() => {
      persistUser(user);
      return {
        currentUser: user,
        userId:      user?.id   || '',
        userRole:    user?.role || '',
        sessionId:   createSessionId(),
      };
    }),
  logout: () =>
    set(() => {
      persistUser(null);
      return {
        currentUser:     null,
        userId:          '',
        userRole:        '',
        currentVideo:    null,
        activePopup:     null,
        isWebcamActive:  false,
        sessionId:       createSessionId(),
        // Reset attention state
        attentionStatus:   'attentive',
        attentionDetail:   null,
        attentionEvents:   [],
      };
    }),

  // Video state
  currentVideo:    null,
  setCurrentVideo: (video) => set({ currentVideo: video }),

  // ── Attention state (basic) ──────────────────────────────────────────────
  attentionStatus:    'attentive',   // 'attentive' | 'not_attentive'
  setAttentionStatus: (status) => set({ attentionStatus: status }),

  // ── Attention state (extended) ───────────────────────────────────────────
  attentionDetail:    null,          // full latest WS payload
  setAttentionDetail: (detail) => set({ attentionDetail: detail }),

  // Drowsiness
  drowsinessScore:    0,             // 0.0 – 1.0
  perclos:            0,             // 0.0 – 1.0
  setDrowsiness:      (score, perclos) => set({ drowsinessScore: score, perclos }),

  // Phone
  phoneDetected:      false,
  phoneDetectedCount: 0,             // session total phone detection events
  setPhoneDetected:   (detected) =>
    set((state) => ({
      phoneDetected:      detected,
      phoneDetectedCount: detected ? state.phoneDetectedCount + 1 : state.phoneDetectedCount,
    })),

  // Yawning
  yawning:     false,
  setYawning:  (v) => set({ yawning: v }),

  // Gaze
  gazeDirection:    'center',        // 'center'|'left'|'right'|'up'|'down'|'unknown'
  setGazeDirection: (dir) => set({ gazeDirection: dir }),

  // Blink rate
  blinkRate:    0,                   // blinks per minute
  setBlinkRate: (rate) => set({ blinkRate: rate }),

  // Engagement score
  engagementScore:    100,           // 0-100
  setEngagementScore: (score) => set({ engagementScore: score }),

  // Live sign caption & Smart Lesson Gestures
  liveSignText:        null,         // e.g. "COMPUTER" | "PALM" | "PEACE" | "FIST"
  liveSignConfidence:  0,
  liveSignExplanation: '',
  gestureAction:       null,         // 'SKIP_FORWARD_10S' | 'SKIP_BACKWARD_10S' | 'TOGGLE_PLAY_PAUSE' | null
  setLiveSign:         (text, confidence, explanation, gestureAction = null) =>
    set({ liveSignText: text, liveSignConfidence: confidence, liveSignExplanation: explanation, gestureAction }),

  // Session attention event log (for heatmap)
  attentionEvents: [],               // [{ timestamp, status, reason, engagementScore }]
  addAttentionEvent: (evt) =>
    set((state) => ({
      attentionEvents: [...state.attentionEvents.slice(-500), evt],  // keep last 500
    })),

  // Popup state
  activePopup:    null,
  setActivePopup: (popup) => set({ activePopup: popup }),

  // System flags
  isWebcamActive:  false,
  setWebcamActive: (isActive) => set({ isWebcamActive: isActive }),
}));

export default useStore;
