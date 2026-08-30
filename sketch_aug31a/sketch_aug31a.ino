#include <WiFi.h>
#include <WebServer.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

const char* DEVICE_NAME = "SignLearn ESP32 Band";
const char* FIRMWARE_VERSION = "0.2.0-http-notify";

// ===============================
// Wi-Fi
// ===============================

const char* WIFI_SSID = "SLT-4G_BD8DB";
const char* WIFI_PASSWORD = "prolink12345";

// ===============================
// OLED
// ===============================

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64

#define OLED_SDA 21
#define OLED_SCL 22

Adafruit_SSD1306 display(
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  &Wire,
  -1
);

// ===============================
// VIBRATION MOTOR
// ===============================

#define MOTOR_PIN 26

// Most NPN/MOSFET motor driver circuits turn ON with HIGH.
// If your motor module turns ON with LOW, change this to false and upload again.
#define MOTOR_ACTIVE_HIGH true

// ===============================
// Web Server
// ===============================

WebServer server(80);

void motorOn();
void motorOff();


// ===============================
// HTTP HELPERS
// ===============================

void sendCorsHeaders() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  server.sendHeader("Access-Control-Allow-Private-Network", "true");
}

void handleCorsPreflight() {
  sendCorsHeaders();
  server.send(204, "text/plain", "");
}

String jsonEscape(String value) {
  value.replace("\\", "\\\\");
  value.replace("\"", "\\\"");
  value.replace("\n", "\\n");
  value.replace("\r", "");
  return value;
}

void sendText(int code, String message) {
  sendCorsHeaders();
  server.send(code, "text/plain", message);
}

void sendJson(int code, String body) {
  sendCorsHeaders();
  server.send(code, "application/json", body);
}

void sendHtml(int code, String body) {
  sendCorsHeaders();
  server.send(code, "text/html", body);
}


// ===============================
// OLED DISPLAY FUNCTION
// ===============================

void showOLED(String message) {

  display.clearDisplay();

  display.setTextColor(SSD1306_WHITE);

  display.setTextSize(2);
  display.setCursor(0, 0);
  display.println("WRISTBAND");

  display.setTextSize(1);
  display.setCursor(0, 30);
  display.println(message);

  display.display();
}


void vibrateForMs(int durationMs) {
  int safeDuration = constrain(durationMs, 60, 5000);
  motorOn();
  delay(safeDuration);
  motorOff();
}


// ===============================
// VIBRATION PATTERN
// ===============================

void motorOn() {
  digitalWrite(
    MOTOR_PIN,
    MOTOR_ACTIVE_HIGH ? HIGH : LOW
  );
}


void motorOff() {
  digitalWrite(
    MOTOR_PIN,
    MOTOR_ACTIVE_HIGH ? LOW : HIGH
  );
}


void motorTestPulse() {
  Serial.println("Motor test: ON for 2 seconds");
  showOLED("MOTOR TEST ON");

  motorOn();
  delay(2000);
  motorOff();

  showOLED("MOTOR TEST OK");
  Serial.println("Motor test: OFF");
}


void vibratePattern(String pattern) {

  Serial.print("Pattern received: ");
  Serial.println(pattern);

  for (int i = 0; i < pattern.length(); i++) {

    char signal = pattern.charAt(i);

    if (signal == '1') {

      // VIBRATION ON
      motorOn();

      Serial.println("1 = MOTOR ON");

      delay(300);
    }

    else if (signal == '0') {

      // VIBRATION OFF
      motorOff();

      Serial.println("0 = MOTOR OFF");

      delay(300);
    }
  }

  // Always stop motor after pattern
  motorOff();

  Serial.println("Pattern finished");
}


bool isBinaryPattern(String pattern) {
  if (pattern.length() == 0) {
    return false;
  }

  for (int i = 0; i < pattern.length(); i++) {
    char signal = pattern.charAt(i);
    if (signal != '0' && signal != '1') {
      return false;
    }
  }

  return true;
}


void playNamedPattern(String pattern, int durationMs) {
  pattern.trim();

  if (isBinaryPattern(pattern)) {
    vibratePattern(pattern);
    return;
  }

  Serial.print("Named pattern received: ");
  Serial.println(pattern);

  if (pattern == "Short Pulse") {
    vibrateForMs(min(durationMs, 300));
  } else if (pattern == "Double Pulse") {
    vibrateForMs(180);
    delay(140);
    vibrateForMs(180);
  } else if (pattern == "Long Pulse") {
    vibrateForMs(max(durationMs, 900));
  } else if (pattern == "Short + Long") {
    vibrateForMs(180);
    delay(140);
    vibrateForMs(max(durationMs - 320, 650));
  } else if (pattern == "Repeated Pulse") {
    for (int i = 0; i < 5; i++) {
      vibrateForMs(170);
      delay(110);
    }
  } else if (pattern == "Emergency Pulse") {
    for (int i = 0; i < 8; i++) {
      vibrateForMs(110);
      delay(70);
    }
  } else {
    vibrateForMs(200);
  }

  motorOff();
  Serial.println("Named pattern finished");
}


// ===============================
// /vibrate API
// ===============================

void handleVibrate() {

  if (!server.hasArg("pattern")) {

    sendText(
      400,
      "Pattern missing"
    );

    return;
  }

  String pattern = server.arg("pattern");

  Serial.print("Received: ");
  Serial.println(pattern);

  // Show pattern on OLED
  showOLED("Pattern: " + pattern);

  // Vibrate
  vibratePattern(pattern);

  sendText(
    200,
    "Vibration completed: " + pattern
  );
}


// ===============================
// /message API
// ===============================

void handleMessage() {

  if (!server.hasArg("message")) {

    sendText(
      400,
      "Message missing"
    );

    return;
  }

  String message = server.arg("message");

  Serial.print("OLED Message: ");
  Serial.println(message);

  showOLED(message);

  sendText(
    200,
    "OLED updated"
  );
}


// ===============================
// /notify API FOR SIGNLEARN APP
// ===============================

void handleStatus() {
  String ip = WiFi.localIP().toString();
  String body = "{";
  body += "\"ok\":true,";
  body += "\"deviceName\":\"" + jsonEscape(DEVICE_NAME) + "\",";
  body += "\"firmwareVersion\":\"" + jsonEscape(FIRMWARE_VERSION) + "\",";
  body += "\"ip\":\"" + jsonEscape(ip) + "\",";
  body += "\"wifi\":\"" + jsonEscape(WiFi.SSID()) + "\",";
  body += "\"rssi\":" + String(WiFi.RSSI());
  body += "}";

  sendJson(200, body);
}


void handleNotify() {
  String message = server.hasArg("message") ? server.arg("message") : "SIGNLEARN READY";
  String pattern = server.hasArg("pattern") ? server.arg("pattern") : "Short Pulse";
  int duration = server.hasArg("duration") ? server.arg("duration").toInt() : 1000;
  int intensity = server.hasArg("intensity") ? server.arg("intensity").toInt() : 70;

  message.trim();
  pattern.trim();

  if (message.length() == 0) {
    message = "SIGNLEARN READY";
  }

  if (message.length() > 24) {
    message = message.substring(0, 24);
  }

  Serial.println("SignLearn notification received");
  Serial.print("Message: ");
  Serial.println(message);
  Serial.print("Pattern: ");
  Serial.println(pattern);
  Serial.print("Intensity: ");
  Serial.println(intensity);
  Serial.print("Duration: ");
  Serial.println(duration);

  showOLED(message);
  playNamedPattern(pattern, duration);

  String body = "{";
  body += "\"ok\":true,";
  body += "\"message\":\"" + jsonEscape(message) + "\",";
  body += "\"pattern\":\"" + jsonEscape(pattern) + "\",";
  body += "\"duration\":" + String(duration) + ",";
  body += "\"intensity\":" + String(intensity);
  body += "}";

  sendJson(200, body);
}


// ===============================
// MOTOR TEST API
// ===============================

void handleMotorControl() {
  String state = server.hasArg("state") ? server.arg("state") : "test";
  state.toLowerCase();

  if (state == "on") {
    Serial.println("Manual motor control: ON");
    showOLED("MOTOR ON");
    motorOn();
    sendJson(200, "{\"ok\":true,\"motor\":\"on\"}");
    return;
  }

  if (state == "off") {
    Serial.println("Manual motor control: OFF");
    motorOff();
    showOLED("MOTOR OFF");
    sendJson(200, "{\"ok\":true,\"motor\":\"off\"}");
    return;
  }

  motorTestPulse();
  sendJson(200, "{\"ok\":true,\"motor\":\"test\"}");
}


// ===============================
// HOME PAGE
// ===============================

void handleRoot() {

  String html = "";

  html += "<!DOCTYPE html>";
  html += "<html>";
  html += "<head>";

  html += "<meta name='viewport' content='width=device-width, initial-scale=1'>";

  html += "<title>ESP32 Wristband</title>";

  html += "</head>";

  html += "<body>";

  html += "<h1>ESP32 Smart Wristband</h1>";
  html += "<p><b>Status:</b> SignLearn notification API ready</p>";
  html += "<p><b>IP:</b> ";
  html += WiFi.localIP().toString();
  html += "</p>";

  html += "<h3>Vibration Test</h3>";

  html += "<button onclick=\"location.href='/motor-test'\">";
  html += "MOTOR TEST 2 SEC";
  html += "</button>";

  html += "<br><br>";

  html += "<button onclick=\"location.href='/motor?state=on'\">";
  html += "MOTOR ON";
  html += "</button>";

  html += "<br><br>";

  html += "<button onclick=\"location.href='/motor?state=off'\">";
  html += "MOTOR OFF";
  html += "</button>";

  html += "<br><br>";

  html += "<button onclick=\"location.href='/vibrate?pattern=10101'\">";
  html += "VIBRATE 10101";
  html += "</button>";

  html += "<br><br>";

  html += "<button onclick=\"location.href='/vibrate?pattern=100'\">";
  html += "VIBRATE 100";
  html += "</button>";

  html += "<br><br>";

  html += "<button onclick=\"location.href='/vibrate?pattern=111'\">";
  html += "VIBRATE 111";
  html += "</button>";

  html += "<h3>OLED Test</h3>";

  html += "<button onclick=\"location.href='/message?message=TEST OK'\">";
  html += "OLED TEST";
  html += "</button>";

  html += "<h3>SignLearn Notification Test</h3>";
  html += "<button onclick=\"location.href='/notify?message=SIGN%20PASSED&pattern=Short%20Pulse&intensity=70&duration=400'\">";
  html += "SIGN PASSED ALERT";
  html += "</button>";

  html += "<br><br>";

  html += "<button onclick=\"location.href='/notify?message=RETRY%20SIGN&pattern=Repeated%20Pulse&intensity=90&duration=1200'\">";
  html += "RETRY SIGN ALERT";
  html += "</button>";

  html += "</body>";

  html += "</html>";

  sendHtml(
    200,
    html
  );
}


// ===============================
// SETUP
// ===============================

void setup() {

  Serial.begin(115200);

  // -------------------------------
  // Motor
  // -------------------------------

  pinMode(MOTOR_PIN, OUTPUT);

  motorOff();


  // -------------------------------
  // OLED
  // -------------------------------

  Wire.begin(
    OLED_SDA,
    OLED_SCL
  );

  if (!display.begin(
        SSD1306_SWITCHCAPVCC,
        0x3C
      )) {

    Serial.println("OLED NOT FOUND!");

    while (true) {
      delay(1000);
    }
  }

  Serial.println("OLED FOUND!");

  showOLED("Starting...");


  // -------------------------------
  // Wi-Fi
  // -------------------------------

  WiFi.begin(
    WIFI_SSID,
    WIFI_PASSWORD
  );

  Serial.print("Connecting WiFi");

  while (
    WiFi.status() != WL_CONNECTED
  ) {

    delay(500);

    Serial.print(".");
  }

  Serial.println();

  Serial.println("WiFi Connected!");

  Serial.print("ESP32 IP: ");

  Serial.println(
    WiFi.localIP()
  );


  // Show IP on OLED
  display.clearDisplay();

  display.setTextColor(
    SSD1306_WHITE
  );

  display.setTextSize(1);

  display.setCursor(0, 0);

  display.println(
    "WiFi Connected!"
  );

  display.setCursor(0, 20);

  display.println(
    "IP:"
  );

  display.setCursor(0, 35);

  display.println(
    WiFi.localIP()
  );

  display.display();


  // -------------------------------
  // Web Server Routes
  // -------------------------------

  server.on(
    "/",
    handleRoot
  );

  server.on(
    "/",
    HTTP_OPTIONS,
    handleCorsPreflight
  );

  server.on(
    "/vibrate",
    handleVibrate
  );

  server.on(
    "/vibrate",
    HTTP_OPTIONS,
    handleCorsPreflight
  );

  server.on(
    "/message",
    handleMessage
  );

  server.on(
    "/message",
    HTTP_OPTIONS,
    handleCorsPreflight
  );

  server.on(
    "/motor",
    HTTP_GET,
    handleMotorControl
  );

  server.on(
    "/motor",
    HTTP_OPTIONS,
    handleCorsPreflight
  );

  server.on(
    "/motor-test",
    HTTP_GET,
    handleMotorControl
  );

  server.on(
    "/motor-test",
    HTTP_OPTIONS,
    handleCorsPreflight
  );

  server.on(
    "/status",
    HTTP_GET,
    handleStatus
  );

  server.on(
    "/status",
    HTTP_OPTIONS,
    handleCorsPreflight
  );

  server.on(
    "/notify",
    HTTP_GET,
    handleNotify
  );

  server.on(
    "/notify",
    HTTP_POST,
    handleNotify
  );

  server.on(
    "/notify",
    HTTP_OPTIONS,
    handleCorsPreflight
  );


  // -------------------------------
  // Start Server
  // -------------------------------

  server.begin();

  Serial.println(
    "Web server started!"
  );
}


// ===============================
// LOOP
// ===============================

void loop() {

  server.handleClient();
}
