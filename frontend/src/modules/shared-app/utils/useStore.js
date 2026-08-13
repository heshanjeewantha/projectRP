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

  // Live sign caption
  liveSignText:        null,         // e.g. "COMPUTER"
  liveSignConfidence:  0,
  liveSignExplanation: '',
  setLiveSign:         (text, confidence, explanation) =>
    set({ liveSignText: text, liveSignConfidence: confidence, liveSignExplanation: explanation }),

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
