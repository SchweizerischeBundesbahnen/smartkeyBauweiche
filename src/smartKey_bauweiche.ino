// *****************************************************************
// Software Properties
// *****************************************************************
#define VERSION "1.0"

// One of the following must be commented out
//#define V_LORA
#define V_SMS

// #include <ESP32_LoRaWAN.h>

// Load Standard Arduino Libraries
#include <Arduino.h>
#include <stdint.h>
#include <iostream>


// Chip-ID: 544e26c4f5fc
// Chip-License: 0x68611223,0xEDC3CCA1,0x00D0F44C,0x79379420

//#include "pins_arduino.h"


// for Feistel encryption
// from here: https://github.com/MatheusCTeixeira/FeistelCipher/blob/master/encrypt.cpp
// #ifdef V_SMS
//   using byte = unsigned char;
//   byte higherOrderBits(byte data);
//   byte lowerOrderBits(byte data);
//   byte f(byte right, byte key);
//   byte round(byte data, byte key, byte(*)(byte, byte));
//   byte unround(byte data, byte key, byte(*)(byte, byte));
//   String encrypt(String plaintext, int rounds);
//   String decrypt(String cipher, int rounds);
// #endif

// *****************************************************************
// SmartKey Bauweiche Properties
// *****************************************************************
const char weichen_id[2] = {0x12, 0xA1}; // WeichenId besteht aus 2x8-Bit Werten (2 Byte)

const char weichen_pid[] = "1234";
const char weichen_bid[] = "Esempio";
const char weichen_operating_from[] = "2020-06-01";
const char weichen_operating_to[] = "2020-06-30";
const char weichen_pname[] = "Test Esempio";
const bool weichen_sim = false;
const char weichen_condition_gleise[] = {0x66};  // 0x66 > 102
const char weichen_condition_weichen[] = {};
const bool weichen_fahrweg = false;  // true = rechts, false = links
// const char weichen_lastchange [] = ;
const char weichen_projid[] = {0x00, 0x01};
const unsigned long weichen_allowedTelefon [] = {794277033,794173362};
const char weichen_lang = 0x01; // 1 = Deutsch, 2 = Französisch, 3 = Italienisch, 4 = English
const char weichen_thingid [] = "5e9e98d75f847e2af727f154";
char weichen_encryptionKey[4] = {0x42, 0x41, 0x4b, 0xaf}; // Shared crypt key with Bauweichenmanager


// *****************************************************************
// SmartKey Bauweiche Zustände-Speicher
// *****************************************************************
uint8_t weichen_cur_position = 0x00; // 0 = links, 1 = mitte, 2 = rechts
bool weichen_cur_verriegelung = true;  // true = verriegelt, false = offen
bool weichen_bahnbetrieb = true; // true = Bahn färht, false = Strecke gesperrt


// *****************************************************************
// Menu LCD Zustände
// *****************************************************************
int mnCursorPos = 0;
int mnLevel = 0;
bool mnIsNavigating = true;
bool mnLcdIsUsed = true;
String mnCurInput = "________";
int mnCurInputPos = 0;
bool mnInputting = false;
String mnCurCode = "";

#define LOOP_PERIOD_SKIP 2000


// *****************************************************************
// HEX-Bytes für öffnen und verriegeln der Weiche
// Dieses Byte wird gesendet, wenn die Weiche verschlossen oder
// geöffnet werden soll
// *****************************************************************
#define BYTE_OPEN 0x16
#define BYTE_CLOSE 0x17

// *****************************************************************
// I2C Adressen
// *****************************************************************
#define I2C_ADR_KEYPAD 0x20
#define I2C_ADR_OLED   0x3C // (unveränderbar, auf Modul fix verbaut)
#define I2C_ADR_LCD    0x27
#define I2C_ADR_LED    0x21 // Für LEDs und sonstiges
#define SDA1_PIN 19
#define SCL1_PIN 21
#define SDA2_PIN 4
#define SCL2_PIN 15


// *****************************************************************
// Permanent Flash Storage
// see: https://www.arduino.cc/en/Reference/EEPROM
// use:
// EEPROM.write(ADDRESS, VALUE);
// EEPROM.read(ADDRESS);
// EEPROM.commit();
// *****************************************************************
// #include "EEPROM.h"
// #define EEPROM_SIZE 1


// *****************************************************************
// Wire / I2C
// *****************************************************************
#include "Wire.h"
TwoWire I2Cone = TwoWire(0);   // pointer to Wire Adress
TwoWire I2Ctwo = TwoWire(1);   // pointer to Wire Adress

// *****************************************************************
// OLED Bildschirm (Fest verbaut)
// Library: https://github.com/ThingPulse/esp8266-oled-ssd1306
// *****************************************************************
// #include "SSD1306TwoWire.h"
// #include "./oled/SSD1306Wire.h"
// SSD1306Wire display (I2C_ADR_OLED, OLED_SDA, OLED_SCL);
// #ifdef V_LORA
//   #define RST_OLED 0
//   #define SDA_OLED SDA
//   #define SCL_OLED SCL
// #endif
// SSD1306TwoWire display(I2C_ADR_OLED, &I2Cone, RST_OLED);

// *****************************************************************
// External Button
// Library: https://github.com/mathertel/OneButton
// *****************************************************************
#include "OneButton.h"
#define BUTTON_PIN 13
#define BUTTON_PIN_WU GPIO_NUM_13
OneButton btn = OneButton(
                  BUTTON_PIN,  // Input pin for the button
                  true,         // Button is active LOW
                  true         // Enable internal pull-up resistor
                );




// *****************************************************************
// I/O Port expander for LEDs
// https://github.com/xreef/PCF8574_library
// *****************************************************************
#include "PCF8574.h" // Customized for dynamic &wire
PCF8574 pcf8574 (&I2Ctwo, I2C_ADR_LED);

// *****************************************************************
// LEDs
// *****************************************************************
#define LED_BOARD 2  // Grüne LED auf ESP32-Board



// *****************************************************************
// SBB Tools
// *****************************************************************
#include "src/sbbtools/sbbtools.h"
#define X1 33
#define X2 25
#define X3 26
#define X4 27
#define MICROSWITCH_PIN 23
#define SERVO_PIN 22
#define LED_GREEN 32  // Grüne externe LED
#define LED_RED 14    // Rote externe LED
#ifdef V_SMS
  #define LED_GREEN 1  // Grüne externe LED
  #define LED_RED 0    // Rote externe LED
  #define LED_GREEN_RIGHT 2
  #define LED_BETRIEB 5
  #define LED_ERROR 6
  Weiche weiche(X1, X2, X3, X4, MICROSWITCH_PIN, SERVO_PIN, LED_GREEN, LED_RED, LED_GREEN_RIGHT, LED_BETRIEB, LED_ERROR, &pcf8574);
#endif
#ifdef V_LORA
  #define LED_GREEN 32  // Grüne externe LED
  #define LED_RED 14    // Rote externe LED
  Weiche weiche(X1, X2, X3, X4, MICROSWITCH_PIN, SERVO_PIN, LED_GREEN, LED_RED);
#endif                  // Gelb wird mittels rot+grün generiert




#ifdef V_SMS

  #include "src/sbbtools/sbbcrypt.h"
  SbbCrypt crypt;
  // *****************************************************************
  // Keypad
  // Keypad_I2C: https://github.com/joeyoung/arduino_keypads
  // Keypad: https://github.com/Chris--A/Keypad
  //
  // *****************************************************************
  #include "Keypad_I2C.h" // Customized version ready with dynamic &wire
  #include "Keypad.h"
  const byte ROWS = 4; //four rows
  const byte COLS = 3; //three columns
  char keys[ROWS][COLS] = {
    {'1', '2', '3'},
    {'4', '5', '6'},
    {'7', '8', '9'},
    {'*', '0', '#'}
  };
  byte rowPins[ROWS] = {7, 6, 0, 1}; //connect to the row pinouts of the keypad
  byte colPins[COLS] = {5, 4, 3}; //connect to the column pinouts of the keypad
  Keypad_I2C kpd( makeKeymap(keys), rowPins, colPins, ROWS, COLS, I2C_ADR_KEYPAD, 1, &I2Cone );


  // *****************************************************************
  // LiquidCrystal Display (LCD)
  // https://gitlab.com/tandembyte/LCD_I2C
  // LiquidCrystal_I2C(uint8_t lcd_Addr,uint8_t lcd_cols,uint8_t lcd_rows)
  // *****************************************************************
  // #include "LiquidCrystal_I2C.h"
  #include "LiquidCrystal_I2C.h"
  LiquidCrystal_I2C lcd(I2C_ADR_LCD, 20, 4, &I2Cone);

#endif


// *****************************************************************
// Wifi / Webserver
// credentials is personal file with WiFi Credentials
// *****************************************************************
#include "WiFi.h"
#include "src/Credentials/credentials.h"
const char* WIFI_SSID     = mySSID;
const char* WIFI_PASSWORD = myPASSWORD;


// *****************************************************************
// OTA
// OTA Webadress is: <GIVEN_IP>:8080/webota
// *****************************************************************
#include <ArduinoOTA.h>


// *****************************************************************
// NTP Zeit
// *****************************************************************
// #include "time.h"
// const char* ntpServer = "pool.ntp.org";
// const long  gmtOffset_sec = 7200; // UTC+2h
// const int   daylightOffset_sec = 0; // Soomer/Winterzeit



#ifdef V_LORA
  // *****************************************************************
  // WebRTOS
  // *****************************************************************
  TaskHandle_t threadLoraStuffHandle; // für multithread (LoraStuff läuft auf core 1)
  TaskHandle_t threadNonLoraStuffHandle; // für multithread (nonLoraStuff läuft auf core 1)


  // *****************************************************************
  // LoRa
  // Library: https://github.com/matthijskooijman/arduino-lmic
  // Documentation: https://doc.sm.tc/mac/programming.html
  // Credentials werden aus externem File geladen mit folgendem Format
  // credentials_lora.cpp
  /*
     #include "credentials_lora1.h"
     const u1_t PROGMEM DEVEUI[8] = { 0x99, 0x99, 0x99, 0x99, 0x99, 0x99, 0x99, 0x99 };
     const u1_t PROGMEM APPEUI[8] = { 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 };
     const u1_t PROGMEM APPKEY[16] = { 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 };
  */
  // credentials_lora.h
  /*
    #ifndef CREDENTIALS_LORA_h
    #define CREDENTIALS_LORA_h
    #include <Arduino.h>
    #include <lmic.h>
    #include <hal/hal.h>
    extern const u1_t PROGMEM DEVEUI[];
    extern const u1_t PROGMEM APPEUI[];
    extern const u1_t PROGMEM APPKEY[];
    #endif
  */
  // *****************************************************************
  #include "src/Credentials/credentials_lora1.h"
  #include <rn2xx3.h>          // https://github.com/jpmeijers/RN2483-Arduino-Library/
  #include <HardwareSerial.h> // ist bereits teil von Arduino IDE
  // HardwareSerial Serial(1); // Für die Ausgabe am Serial Monitor
  HardwareSerial SerialLora(2); // 1 = USB Serial, wir können also 2 oder 3 wählen
  #define RESET 5
  rn2xx3 myLora(SerialLora);
  unsigned int counter = 0; // Counter zum Zählen der Lora Pakete
  static uint8_t LORAWAN_PORT = 1; // default Lora Port
  // Zwischenspeicher für uplink payload/message
  static uint8_t message[52] = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"; // 51 bytes maximale Länge Lora Payload; letztes ist "\0"
  static int mLength = 51;
#endif


// IoT Variant only functions
#ifdef V_LORA
  static void loraInit ();
  bool do_send();
  void threadLoraStuff ( void * pvParameters );
  void threadNonLoraStuff ( void * pvParameters );
#endif

// SMS Variant only functions
#ifdef V_SMS
  void handleKeys(char key);
  void setLCDScreenRows (char row1[], char row2[], char row3[], char row4[], bool center);
  void mainMenu ();
  long random4Digit();
  void codeTypeing(char key);
  void resetInputing ();
#endif

// Shared functions
void handleButtonClick();
byte encodebool (bool *arr ) ;
unsigned long time_now = 0;
unsigned long time_now_button = 0;
void connectWiFi();

int upCounter = 0;



// -----------------------------------------------------------------
// Bootfunktion
// -----------------------------------------------------------------
void setup() {

  Serial.begin(115200);
  //  LED_BUILTIN aktivieren (für Lora32 Board)
  pinMode(LED_BOARD, OUTPUT);
  int i = 0;
  for (i = 0; i < 2; i++) { // blink onboard led twice
    digitalWrite(LED_BOARD, HIGH); delay(100); digitalWrite(LED_BOARD, LOW); delay(100);
  }

  // OLED Display
  // display.flipScreenVertically ();


  #ifdef V_SMS
    I2Cone.begin(SDA1_PIN, SCL1_PIN);
    // LCD & Welcome Screen
    lcd.init();    // initialize the lcd
    lcd.backlight();
    setLCDScreenRows("Willkommen!","SmartKey Bauweiche","Version " VERSION, "Copyright 2020 SBB", true);

    // display.connect();
    // display.init();
    // SBBLogo sbbLogo(&display, 2000); // Show Logo for x seconds

    // Setup oled display and show stuff
    // display.setFont (ArialMT_Plain_10);
    // display.setTextAlignment (TEXT_ALIGN_LEFT);
    // display.clear();
    // display.drawString (0, 0, "Bootloader...."); Serial.println(F("Bootloader...."));
    // display.display ();
  #endif


  // WIFI
  connectWifi();

  // OTA
  // ArduinoOTA.setHostname("SmartkeyBauweiche");
  // ArduinoOTA.begin();


  // EEPROM initialize
  // EEPROM.begin(EEPROM_SIZE);

  // I2Ctwo > LEDs
  #ifdef V_SMS
    I2Ctwo.begin(SDA2_PIN, SCL2_PIN);
    byte error;
    I2Ctwo.beginTransmission(I2C_ADR_LED);
    error = I2Ctwo.endTransmission();
    if (error == 0) {
        Serial.print("Second I2C-device found at address 0x");
        Serial.println(I2C_ADR_LED, HEX);
    }
    // set all pins to output
    for(int i=0;i<8;i++) {
      pcf8574.pinMode(i, OUTPUT);
    }
    // blink all LEDs
    for(int i=0;i<8;i++) {
      pcf8574.digitalWrite(i, HIGH); delay(500); pcf8574.digitalWrite(i, LOW);
    }
  #endif


  // External Button
  // Single Click event attachment
  // in SMS-Mode, button is only used to reset/wakeup device
  #ifdef V_LORA
    btn.setDebounceTicks(200);
    btn.setClickTicks(300);
    btn.attachClick(handleButtonClick);
  #endif

  // Weiche initialisieren
  weiche.init(weichen_id, weichen_fahrweg);


  #ifdef V_SMS
    // set cryptic key
    crypt.setKey(weichen_encryptionKey, sizeof(weichen_encryptionKey));

    // Keypad
    kpd.begin();
    kpd.pinState_set();
    // LCD Screen show Project Data
    char data[20];
    sprintf(data,"2020-%i",(weichen_projid[0] << 8) | (weichen_projid[1]));
    setLCDScreenRows("Projekt-ID-Nr.:", data, "", "", false);
    delay(2000);
    // display Main Menu
    mainMenu();
  #endif

  // Time
  //configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);

  #ifdef V_LORA
    pinMode(LED_GREEN, OUTPUT);
    pinMode(LED_RED, OUTPUT);
    SerialLora.begin(57600);
    loraInit();
    // // CPU Threads
    // // Pin webserver to cpu core 1 (0/1)
    // // see https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-reference/system/freertos.html
    // xTaskCreatePinnedToCore(
    //   threadNonLoraStuff,   /* Task function. */
    //   "threadNonLoraStuff",     /* name of task. */
    //   64000,       /* Stack size of task */
    //   (void *)1,        /* parameter of the task */
    //   0,           /* priority of the task 0=low, 1=normal, 2=priviliged */
    //   &threadNonLoraStuffHandle,/* Task handle to keep track of created task */
    //   0);          /* pin task to core 0 */
  #endif


  // enable wake up for Button press
  esp_sleep_enable_ext0_wakeup(BUTTON_PIN_WU, 0); //1 = High, 0 = Low
}


// -----------------------------------------------------------------
// loop bootfunktion
// Keine Verwendung, da Multithreaded verwendet wird
// -----------------------------------------------------------------
void loop() {
  // OTA handeln
  // ArduinoOTA.handle();

  #ifdef V_SMS
    // Keypad interrupt
    handleKeys(kpd.getKey());
    // etwas nur all <period> ausführen
  #endif

  #ifdef V_LORA
  // unused
  #endif

  // Do only ever LOOP_PERIOD_SKIP seconds
  if (millis() > time_now + LOOP_PERIOD_SKIP) {
    weiche.statusUpdate();
    time_now = millis();
  }

  // only every 1 Minute
  if (millis() > time_now_button + 60000) {
    // Sleep after 10 Minutes of inactivity
    upCounter += 1;
    if (upCounter >= 5) {
      startDeepSleep();
    }
    time_now_button = millis();
  }


  // Check btn every loop()
  btn.tick();
}



// -----------------------------------------------------------------
// initiate deep sleep
// -----------------------------------------------------------------
void startDeepSleep() {
  Serial.println("Going to sleep due to inactivity");
  #ifdef V_SMS
    setLCDScreenRows("","sleeping...","Press Button","to wake up",true);
    lcd.setBacklight(0);
  #endif
  esp_deep_sleep_start();
}


// -----------------------------------------------------------------
// Button Click handle
// -----------------------------------------------------------------
void handleButtonClick() {
  Serial.println("Button pressed!");
  // display.clear(); display.drawString (0, 0, "Anfrage gestartet...."); display.display (); vTaskDelay(1000);
  #ifdef V_LORA
    weiche.statusUpdate();
    uplinkSensorData();
  #endif
}


#ifdef V_SMS
// -----------------------------------------------------------------
// Event für Keypressing auf dem Keypad
// -----------------------------------------------------------------
void handleKeys(char key) {
  if (key) {
    upCounter = 0; // reset sleep timeout
    Serial.print("Key on Keypad pressed: ");
    Serial.println(key);
    // Up **************************
    if (key=='8' && mnIsNavigating) {
      mnCursorPos++;
      if (mnLevel ==  0  && mnCursorPos > 2) mnCursorPos = 0; // Level 0
    }
    // Down **************************
    if (key=='2' && mnIsNavigating) {
      mnCursorPos--;
      if (mnLevel ==  0  && mnCursorPos < 0) mnCursorPos = 2;  // Level 0
    }
    // Entering **************************
    if (key=='#' && mnIsNavigating) {
      mnLevel++;
      // Freigabecode > Stopp Navigation
      if (mnLevel == 1 && mnCursorPos == 0) {
        mnIsNavigating = false;
        mnInputting = true;
      }
    }
    // Back **************************
    // + aboards any inputting
    if (key=='*') {
      mnLevel--;
      if (mnLevel<0) mnLevel = 0;
      resetInputing();
    }
    // if (key=='1' && mnIsNavigating) weiche.verriegeln();
    // if (key=='3' && mnIsNavigating) weiche.entriegeln();

    // Inputting Code (only numbers can be entered, thus excluding * and #)
    if (!mnIsNavigating && mnInputting && key!='*' && key!='#') {
      codeTypeing(key);
    }
    // reload Menu everytime a key is pressed
    mainMenu();
  }
}


// -----------------------------------------------------------------
// Gibt das Menu aus
// -----------------------------------------------------------------
void mainMenu () {
  Serial.println("calling mainMenu();");
  const String CURSOR = "> ";
  const String WS = "  ";

  Serial.print("Level: "); Serial.println(mnLevel);
  Serial.print("Zeile: "); Serial.println(mnCursorPos);

  // One line has 22 chars > so array [0-21]
  char line1 [21];
  char line2 [21];
  char line3 [21];
  char line4 [21];
  String titel;
  String line1S;
  String line2S;
  String line3S;
  String line4S;
  weichen_bahnbetrieb = weiche.isFahrbetrieb();
  Serial.println("Setting up Menu lines");
  // Top-Level
  if (mnLevel == 0) {
    Serial.println("Menu: Top");
    titel = weichen_bahnbetrieb ? String("*** Bahnbetrieb ***") : String("*** Baubetrieb ***");
    titel.toCharArray(line1, titel.length());
    line2S = ((mnCursorPos == 0?CURSOR:WS) + (weichen_bahnbetrieb?String("Entriegeln"):String("Verriegeln")));
    line2S.toCharArray(line2, line2S.length()+1);
    line3S = ((mnCursorPos == 1?CURSOR:WS) + String("Projektdaten"));
    line3S.toCharArray(line3, line3S.length()+1);
    line4S = ((mnCursorPos == 2?CURSOR:WS) + String("Config"));
    line4S.toCharArray(line4, line4S.length()+1);
  }
  // Entriegeln
  else if (mnCursorPos == 0 && mnLevel == 1) {
    Serial.println("Menu: Entriegeln");
    titel = String("*** Entriegeln ***");
    titel.toCharArray(line1, titel.length());
    line2S = String("Code an BWM senden");
    line2S.toCharArray(line2, line2S.length()+1);
    line3S = weiche.statusCode(crypt);
    line3S.toCharArray(line3, line3S.length()+1);
    line4S = String("Out: ") + mnCurInput;
    line4S.toCharArray(line4, line4S.length()+1);
  }
  // Proj-Daten
  else if (mnCursorPos == 1 && mnLevel == 1) {
    Serial.println("Menu: Projektdaten");
    titel = String("*** Proj-Daten ***");
    titel.toCharArray(line1, titel.length());
    line2S = (String("Weiche: ") + String(weichen_pname));
    line2S.toCharArray(line2, line2S.length()+1);
    line3S = (String("Fahrweg: ") + (weichen_fahrweg?String("Rechts"):String("Links")));
    line3S.toCharArray(line3, line3S.length()+1);
    line4S = (String(""));
    line4S.toCharArray(line4, line4S.length()+1);
  }
  // Config TODO
  else if (mnCursorPos == 2 && mnLevel == 1) {
    Serial.println("Menu: Config");
    titel = String("*** Config ***");
    titel.toCharArray(line1, titel.length());
    line2S = String ("leer");
    line2S.toCharArray(line2, line2S.length()+1);
    line3S = String("leer");
    line3S.toCharArray(line3, line3S.length()+1);
    line4S = String("leer");
    line4S.toCharArray(line4, line4S.length()+1);
  }
  setLCDScreenRows(line1, line2, line3, line4, false);
}

// -----------------------------------------------------------------
// Gibt 4 Zeilen auf dem Display aus und richtet diese mittig aus
// -----------------------------------------------------------------
void setLCDScreenRows (char row1[], char row2[], char row3[], char row4[], bool center) {
  Serial.println("calling setLCDScreenRows();");
  Serial.println("clearing lcd.");
  lcd.clear();
  int left = 0;
  if (center) left = (20-strlen(row1))/2;
  lcd.setCursor(left, 0);
  lcd.print(row1);
  if (center) left = (20-strlen(row2))/2;
  lcd.setCursor(left, 1);
  lcd.print(row2);
  if (center) left = (20-strlen(row3))/2;
  lcd.setCursor(left, 2);
  lcd.print(row3);
  if (center) left = (20-strlen(row4))/2;
  lcd.setCursor(left, 3);
  lcd.print(row4);
}


// extension of handlekeys when inputing code
void codeTypeing (char key) {
  // setCharAt is from Arduino.h
  // see: https://www.arduino.cc/reference/en/language/variables/data-types/string/functions/setcharat/
  mnCurInput.setCharAt(mnCurInputPos, key); 
  mnCurInputPos++;
  
  int code = mnCurInput.toInt();
  Serial.print("code: "); Serial.println(code);
  char hex[10];
  crypt.decimalToHexString(code, hex);
  byte byteArr[3];
  crypt.hexCharacterStringToBytes(byteArr, hex);
  Serial.print("bytes encoded: "); Serial.print(byteArr[0], HEX);Serial.print(byteArr[1], HEX);Serial.println(byteArr[2], HEX);
  char hexx[3];
  for (int i = 0; i < 3; i++) {
    hexx[i] = static_cast<char>(byteArr[i]);
  }
  Serial.print("char encoded: "); Serial.print(hexx[0], HEX);Serial.print(hexx[1], HEX);Serial.println(hexx[2], HEX);
  // Code decodieren
  crypt.xor_crypt(hexx, sizeof(hexx));
  Serial.print("char decoded: "); Serial.print(hexx[0], HEX);Serial.print(hexx[1], HEX);Serial.println(hexx[2], HEX);
  Serial.print("Code translates into HEX-Value: ");
  for (int i = 0; i < 3; i++){
    Serial.print("0x");
    if (hex[i] < 0x10)
      Serial.print("0");
    Serial.print(hex[i], HEX);
    Serial.print(", ");
  }
  Serial.println();
  // Check if first byte is action-byte
  if (hexx[0] == 0x03) {
    Serial.println("Code Korrekt!");
    weiche.endProcess();
    mnLevel = 0;
    resetInputing();
    // weiche entriegeln
    if (hexx[1] == 0x01) {
      weiche.entriegeln();
    }
    // verriegeln
    else if (hexx[1] == 0x02) {
      weiche.verriegeln();
    }
  }
  // too long code is also wrong
  else if (mnCurInputPos > 7) {
    Serial.println("Code Falsch!");
    resetInputing();
    mnLevel = 0;
  }
}


// reset Code Inputting and setting all variables back to original empty state
void resetInputing () {
  mnInputting = false;
  mnIsNavigating = true;
  mnCurInputPos = 0;
  mnCurInput = "________";
  mnCurCode = "";
}


// Generieren Zufallszahl als 4 int-Aray ******************************************
long random4Digit () {                                                           //*
  long  oCode;                                                                    //*
  oCode = random(1000,9999);
  return oCode;                                                                 //*
}                                                                               //*
// End Generieren Zufallszahl *****************************************************




#endif


// Lora Stuff
#ifdef V_LORA


bool uplinkSensorData() {
  LORAWAN_PORT = 11;
  mLength = 3;
  message[0] = weichen_id[0]; // weichen_id #1
  message[1] = weichen_id[1]; // weichen_id #2      macht 65536 Weichen möglich
  message[2] = weiche.encodedStatus();
  return do_send();
}

// Process a downlink
void processDownlink(String dl) {
  dl.trim();
  Serial.println(dl);
  weiche.statusUpdate();

  // dl: 0x10=verriegeln, 0x11=öffnen
  // RN2483 stores the HEX-Value in a String (without preciding 0x)

  // Um die Verriegelung zu manipulieren, muss die Weiche auf Stellung
  // Fahrbetrieb sein, also Weichen-Zunge in Fahr-Lage
  if (weiche.isFahrbetriebLage()) {
    // Downlink zum verriegeln
    if (dl == String("10") && !weiche.getVerriegelung()) {
      Serial.println("Befehl via Downlink empfangen: Verriegeln!");
      weiche.verriegeln();
    }
    // Downlink zum entriegeln
    else if (dl == String("11") && weiche.getVerriegelung()) {
      Serial.println("Befehl via Downlink empfangen: Entriegeln!");
      weiche.entriegeln();
    }
    uplinkSensorData();
  }
}


// -----------------------------------------------------------------
// Non-LoRa Thread
//
// -----------------------------------------------------------------
// void threadNonLoraStuff( void * pvParameters ) {
//   Serial.print("threadNonLoraStuff running on core: "); Serial.println(xPortGetCoreID());
//   for (;;) {
//     // OTA handeln
//     // ArduinoOTA.handle();
//
//     // Button interrupt
//     btn.tick();
//
//     // etwas nur all <period> ausführen
//     if (millis() > time_now + LOOP_PERIOD_SKIP) {
//       handleSensors();
//       time_now = millis();
//     }
//   }
//   // os_runloop_once();
//   vTaskDelay(200);
// }

// -----------------------------------------------------------------
// Sendet ein Uplink
// Kopiert die Message in den Payload
// -----------------------------------------------------------------
bool do_send() {

  Serial.println("Sending Message...");
  uint8_t payload[mLength + 1];
  memcpy(payload, message, mLength);

  Serial.println("Payload: ");
  for (int i = 0; i < sizeof(payload); i++) {
    Serial.println(String(payload[i], HEX));
  }
  Serial.println("END OF HEX Payload ");
  bool success = false;

  // Data Format von Payload ist: uint8_t[], max size 51
  switch(myLora.txBytes(payload, sizeof(payload))) //one byte, blocking function
  {
    case TX_FAIL:
    {
      Serial.println("TX unsuccessful or not acknowledged");
      break;
    }
    case TX_SUCCESS:
    {
      Serial.println("TX successful and acknowledged");
      success = true;
      break;
    }
    case TX_WITH_RX:
    {
      String received = myLora.getRx();
      Serial.print("Received downlink: ");
      processDownlink(received);
      success = true;
      break;
    }
    default:
    {
      Serial.println("Unknown response from TX function");
    }
  }
  return success;
    // display.clear();
    // display.drawString (0, 0, "Sending uplink packet...");
    // display.drawString (0, 50, String (++counter));
    // display.display ();
}

// -----------------------------------------------------------------
// Lora settings
// -----------------------------------------------------------------
void loraInit () {
  Serial.println("Initializing Lora....");
  //reset RN2xx3
  pinMode(RESET, OUTPUT);
  digitalWrite(RESET, LOW);
  delay(100);
  digitalWrite(RESET, HIGH);

  delay(100); //wait for the RN2xx3's startup message
  SerialLora.flush();


  //check communication with radio
  String hweui = myLora.hweui();
  while(hweui.length() != 16)
  {
    Serial.println("Communication with RN2xx3 unsuccessful. Power cycle the board.");
    Serial.println(hweui);
    delay(10000);
    hweui = myLora.hweui();
  }

  //print out the HWEUI so that we can register it via ttnctl
  Serial.println("When using OTAA, register this DevEUI: ");
  Serial.println(hweui);
  Serial.println("RN2xx3 firmware version:");
  Serial.println(myLora.sysver());

  //configure your keys and join the network
  Serial.println("Trying to join the Network");
  bool join_result = false;


  //OTAA: initOTAA(String AppEUI, String AppKey);
  join_result = myLora.initOTAA("70B3D57ED0037859", "EE4C31AE90202C83BE5FBFDA66F1BF0C");

  while(!join_result)
  {
    Serial.println("Unable to join. Are your keys correct, and do you have Network coverage?");
    delay(60000); //delay a minute before retry
    join_result = myLora.init();
  }
  Serial.println("Successfully joined the Network");

  myLora.setFrequencyPlan(TTN_EU);
  myLora.setDR(3); // 5 = SF7, 4 = SF8, 3 = SF9, 2 = SF10, 1 = SF11, 0 = SF12 (default),
  Serial.println("finished initializing Lora");
}

#endif




// Handles WiFi connection
void connectWifi() {
  Serial.print("Connecting to Wifi: ");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int i = 0;
  while (WiFi.status() != WL_CONNECTED && i < 10) { // try 10 times then continue
    delay(250);
    Serial.print(".");
    i++;
  }
  // Connection was successfull
  if (i <= 10) {
    IPAddress ip = WiFi.localIP();
    String ipStr = String(ip[0]) + '.' + String(ip[1]) + '.' + String(ip[2]) + '.' + String(ip[3]);
    // display.drawString (0, 20, "WiFi verbunden!");
    // display.drawString (0, 40, "My IP: " + ipStr);
    // display.display ();
    Serial.println("WiFi connected");
    Serial.println("IP address: ");
    Serial.println(WiFi.localIP());
    Serial.print("Your Hostname: ");
    Serial.println(WiFi.getHostname());
  }
  // Wifi connection was unsuccessfull
  else {
    // display.drawString (0, 40, "WiFi not connected");
    // display.display ();
    Serial.println("Could not connect to WiFi");
  }
}
