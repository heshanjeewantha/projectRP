/**
 * Web Bluetooth (BLE) Controller for ESP32 Smart Wristband
 * Handles wireless connection, vibration motor triggers, and OLED message updates directly from browser.
 */

const NORDIC_UART_SERVICE = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const TX_CHARACTERISTIC = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'; // write to ESP32
const RX_CHARACTERISTIC = '6e400003-b5a3-f393-e0a9-e50e24dcca9e'; // receive from ESP32

class WristbandBleController {
  constructor() {
    this.device = null;
    this.server = null;
    this.txChar = null;
    this.rxChar = null;
    this.isConnected = false;
    this.listeners = new Set();
  }

  isSupported() {
    return typeof navigator !== 'undefined' && Boolean(navigator.bluetooth);
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(state) {
    this.listeners.forEach((fn) => fn(state));
  }

  async connect() {
    if (!this.isSupported()) {
      throw new Error('Web Bluetooth is not supported in this browser. Please use Chrome/Edge.');
    }

    try {
      this.device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: 'SignLearn' }, { namePrefix: 'ESP32' }, { namePrefix: 'Wristband' }],
        optionalServices: [NORDIC_UART_SERVICE, 'generic_access'],
      });

      this.device.addEventListener('gattserverdisconnected', this.handleDisconnect.bind(this));

      this.server = await this.device.gatt.connect();
      const service = await this.server.getPrimaryService(NORDIC_UART_SERVICE);
      this.txChar = await service.getCharacteristic(TX_CHARACTERISTIC);

      try {
        this.rxChar = await service.getCharacteristic(RX_CHARACTERISTIC);
        await this.rxChar.startNotifications();
        this.rxChar.addEventListener('characteristicvaluechanged', (e) => {
          const text = new TextDecoder().decode(e.target.value);
          this.notify({ type: 'DATA_RECEIVED', payload: text });
        });
      } catch (err) {
        console.warn('BLE RX notifications optional:', err);
      }

      this.isConnected = true;
      this.notify({ type: 'CONNECTED', deviceName: this.device.name || 'Smart Wristband' });
      return true;
    } catch (error) {
      this.isConnected = false;
      this.notify({ type: 'ERROR', error: error.message });
      throw error;
    }
  }

  handleDisconnect() {
    this.isConnected = false;
    this.txChar = null;
    this.server = null;
    this.notify({ type: 'DISCONNECTED' });
  }

  async disconnect() {
    if (this.device && this.device.gatt.connected) {
      this.device.gatt.disconnect();
    }
    this.handleDisconnect();
  }

  async sendCommand(commandObj) {
    const payloadStr = JSON.stringify(commandObj) + '\n';
    if (this.isConnected && this.txChar) {
      const encoder = new TextEncoder();
      await this.txChar.writeValue(encoder.encode(payloadStr));
      return true;
    }
    return false;
  }

  async triggerVibration(pattern = 'Repeated Pulse', oledMessage = 'RETRY SIGN', intensity = 85, duration = 1200) {
    return this.sendCommand({
      action: 'VIBRATE',
      pattern,
      oled: oledMessage,
      intensity,
      duration,
    });
  }
}

export const wristbandBle = new WristbandBleController();
export default wristbandBle;
