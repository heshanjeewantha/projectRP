/**
 * Direct Wi-Fi HTTP controller for the sketch_aug31a ESP32 wristband sketch.
 * The ESP32 exposes /status and /notify on its local network IP address.
 */

const STORAGE_KEY = 'signlearn_esp32_wristband_endpoint';
const DEFAULT_TIMEOUT_MS = 4500;
const DEFAULT_WRISTBAND_ENDPOINT = import.meta.env.VITE_WRISTBAND_ENDPOINT || 'http://192.168.1.19';

const LEGACY_PATTERN_MAP = {
  'Short Pulse': '1',
  'Double Pulse': '101',
  'Long Pulse': '111',
  'Short + Long': '10111',
  'Repeated Pulse': '101010101',
  'Emergency Pulse': '111010111',
};

const normalizeEndpoint = (value) => {
  const trimmed = String(value || '').trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
};

export const getDefaultWristbandEndpoint = () => DEFAULT_WRISTBAND_ENDPOINT;

export const resolveWristbandEndpoint = (endpoint) => {
  return normalizeEndpoint(endpoint) || DEFAULT_WRISTBAND_ENDPOINT;
};

const fetchWithTimeout = async (url, options = {}, expectReadableResponse = true) => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), options.timeoutMs || DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    if (expectReadableResponse && !response.ok) {
      throw new Error(`Request failed (${response.status}).`);
    }

    return response;
  } finally {
    window.clearTimeout(timeout);
  }
};

const fireAndForget = async (url) => {
  try {
    await fetchWithTimeout(
      url,
      {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-store',
        timeoutMs: 2500,
      },
      false
    );
    return true;
  } catch {
    return false;
  }
};

export const getStoredWristbandEndpoint = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_WRISTBAND_ENDPOINT;
  } catch {
    return DEFAULT_WRISTBAND_ENDPOINT;
  }
};

export const setStoredWristbandEndpoint = (endpoint) => {
  const normalized = resolveWristbandEndpoint(endpoint);
  try {
    localStorage.setItem(STORAGE_KEY, normalized);
  } catch {
    // localStorage can be unavailable in private or restricted browser contexts.
  }
  return normalized;
};

export const getHttpWristbandStatus = async (endpoint) => {
  const baseUrl = normalizeEndpoint(endpoint);
  if (!baseUrl) {
    throw new Error('Enter the ESP32 wristband IP address first.');
  }

  try {
    const response = await fetchWithTimeout(`${baseUrl}/status`, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-store',
    });

    return response.json();
  } catch (error) {
    const reachable = await fireAndForget(baseUrl);
    if (!reachable) {
      throw error;
    }

    return {
      ok: true,
      legacy: true,
      deviceName: 'ESP32 Wristband',
      firmwareVersion: 'legacy-message-vibrate',
      ip: baseUrl.replace(/^https?:\/\//i, ''),
    };
  }
};

export const sendLegacyHttpWristbandNotification = async ({
  endpoint,
  oledMessage,
  vibrationPattern,
}) => {
  const baseUrl = normalizeEndpoint(endpoint);
  if (!baseUrl) {
    return { skipped: true, reason: 'No ESP32 endpoint configured.' };
  }

  const message = String(oledMessage || 'SIGNLEARN READY').toUpperCase().slice(0, 24);
  const binaryPattern = LEGACY_PATTERN_MAP[vibrationPattern] || vibrationPattern || '101';
  const messageUrl = `${baseUrl}/message?message=${encodeURIComponent(message)}`;
  const vibrateUrl = `${baseUrl}/vibrate?pattern=${encodeURIComponent(binaryPattern)}`;

  const vibrationSent = await fireAndForget(vibrateUrl);
  const messageSent = await fireAndForget(messageUrl);

  if (!messageSent && !vibrationSent) {
    throw new Error('ESP32 legacy endpoints did not respond.');
  }

  return {
    ok: true,
    mode: 'legacy',
    message,
    pattern: binaryPattern,
  };
};

export const sendHttpWristbandNotification = async ({
  endpoint,
  oledMessage,
  vibrationPattern,
  intensity = 70,
  duration = 1000,
}) => {
  const baseUrl = normalizeEndpoint(endpoint);
  if (!baseUrl) {
    return { skipped: true, reason: 'No ESP32 endpoint configured.' };
  }

  const params = new URLSearchParams({
    message: String(oledMessage || 'SIGNLEARN READY').toUpperCase().slice(0, 24),
    pattern: String(vibrationPattern || 'Short Pulse'),
    intensity: String(intensity),
    duration: String(duration),
  });

  try {
    const response = await fetchWithTimeout(`${baseUrl}/notify?${params.toString()}`, {
      method: 'GET',
      mode: 'cors',
      cache: 'no-store',
    });

    return response.json();
  } catch (error) {
    console.warn('ESP32 /notify failed. Trying legacy /message + /vibrate endpoints.', error);
    return sendLegacyHttpWristbandNotification({
      endpoint: baseUrl,
      oledMessage,
      vibrationPattern,
    });
  }
};
