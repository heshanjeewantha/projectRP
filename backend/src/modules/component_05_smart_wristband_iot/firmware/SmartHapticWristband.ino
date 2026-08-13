#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define MOTOR_PIN 16
#define BUTTON_PIN 4

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

const char* WIFI_SSID = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* DEVICE_ID = "band-student_demo_123";
const char* STUDENT_ID = "student_demo_123";
const char* API_BASE = "http://192.168.1.10:8000/api/wristband";

unsigned long lastPollAt = 0;
unsigned long lastStatusAt = 0;
const unsigned long POLL_INTERVAL_MS = 6000;
const unsigned long STATUS_INTERVAL_MS = 15000;

void connectToWiFi() {
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  showOLEDMessage("CONNECTING");

  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
  }

  showOLEDMessage("CONNECTED");
}

void showOLEDMessage(String message) {
  String compact = message;
  compact.toUpperCase();
  if (compact.length() > 18) {
    compact = compact.substring(0, 18);
  }

  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("SIGNLEARN BAND");
  display.println("----------------");
  display.setTextSize(2);
  display.setCursor(0, 28);
  display.println(compact);
  display.display();
}

void vibrateFor(int durationMs) {
  digitalWrite(MOTOR_PIN, HIGH);
  delay(durationMs);
  digitalWrite(MOTOR_PIN, LOW);
}

void playVibrationPattern(String pattern) {
  if (pattern == "Short Pulse") {
    vibrateFor(200);
  } else if (pattern == "Double Pulse") {
    vibrateFor(200);
    delay(150);
    vibrateFor(200);
  } else if (pattern == "Long Pulse") {
    vibrateFor(1000);
  } else if (pattern == "Short + Long") {
    vibrateFor(200);
    delay(150);
    vibrateFor(800);
  } else if (pattern == "Repeated Pulse") {
    for (int i = 0; i < 5; i++) {
      vibrateFor(200);
      delay(130);
    }
  } else if (pattern == "Emergency Pulse") {
    for (int i = 0; i < 8; i++) {
      vibrateFor(120);
      delay(80);
    }
  } else {
    vibrateFor(180);
  }
}

void sendDeviceStatus() {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }

  HTTPClient http;
  String url = String(API_BASE) + "/notify";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<256> payload;
  payload["studentId"] = STUDENT_ID;
  payload["deviceId"] = DEVICE_ID;
  payload["alertType"] = "Chatbot Reply";
  payload["vibrationPattern"] = "Short Pulse";
  payload["oledMessage"] = "STATUS OK";
  payload["intensity"] = 20;
  payload["duration"] = 200;

  String body;
  serializeJson(payload, body);
  http.POST(body);
  http.end();
}

void fetchNotification() {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }

  HTTPClient http;
  String url = String(API_BASE) + "/config/" + STUDENT_ID;
  http.begin(url);
  int httpCode = http.GET();

  if (httpCode == 200) {
    String response = http.getString();
    StaticJsonDocument<768> doc;
    deserializeJson(doc, response);

    String message = doc["oledMessage"] | "READY";
    String pattern = doc["vibrationPattern"] | "Short Pulse";
    showOLEDMessage(message);
    playVibrationPattern(pattern);
  }

  http.end();
}

void setup() {
  pinMode(MOTOR_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  Serial.begin(115200);

  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    return;
  }

  display.clearDisplay();
  display.display();

  connectToWiFi();
}

void loop() {
  unsigned long now = millis();

  if (now - lastPollAt >= POLL_INTERVAL_MS) {
    lastPollAt = now;
    fetchNotification();
  }

  if (now - lastStatusAt >= STATUS_INTERVAL_MS) {
    lastStatusAt = now;
    sendDeviceStatus();
  }

  if (digitalRead(BUTTON_PIN) == LOW) {
    showOLEDMessage("TEST MODE");
    playVibrationPattern("Double Pulse");
    delay(700);
  }
}
