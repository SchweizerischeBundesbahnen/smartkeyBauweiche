#ifndef SBBTOOLS_H
#define SBBTOOLS_H

#include <Arduino.h>
#include "./sbbcrypt.h"
#include "../oled/SSD1306TwoWire.h"
#include "ESP32Servo.h" // Library: https://github.com/jkb-git/ESP32Servo
#include "PCF8574.h" // GPIO I2C Expansion



#define WEICHE_DELAY 5



#define SERVO_POS_CLOSE 0
#define SERVO_POS_OPEN 160
#define SERVO_SPEED 20



// *****************************************************************
// SBB Logo
// create Image and export in GIMP as .xbm image
// *****************************************************************
const uint8_t sbbLogo128x16[] PROGMEM = {
   0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
   0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
   0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
   0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
   0x00, 0x42, 0x08, 0x00, 0x5c, 0xf8, 0xc3, 0x0f, 0x80, 0x07, 0x3f, 0x7e,
   0xc0, 0x8f, 0x1f, 0x3e, 0x00, 0x43, 0x18, 0x00, 0xc6, 0xf8, 0xc7, 0x1f,
   0xe0, 0x0f, 0x3f, 0x7e, 0xe0, 0x8f, 0x1f, 0x63, 0x80, 0x60, 0x10, 0x00,
   0x06, 0x08, 0x46, 0x38, 0x30, 0x08, 0x01, 0x02, 0x60, 0x80, 0x00, 0x41,
   0xc0, 0x60, 0x70, 0x00, 0x06, 0x08, 0x46, 0x18, 0x10, 0x00, 0x01, 0x02,
   0x60, 0x80, 0x00, 0x03, 0xe0, 0xff, 0xff, 0x00, 0x3c, 0xf8, 0xc3, 0x1f,
   0x10, 0x00, 0x1f, 0x3e, 0xe0, 0x87, 0x1f, 0x0e, 0xe0, 0xff, 0xff, 0x00,
   0xf8, 0xf8, 0xc3, 0x1f, 0x10, 0x00, 0x1f, 0x3e, 0xe0, 0x87, 0x1f, 0x3c,
   0xc0, 0x60, 0x60, 0x00, 0xc0, 0x08, 0x46, 0x10, 0x10, 0x00, 0x01, 0x06,
   0x60, 0x80, 0x00, 0xe0, 0x80, 0x61, 0x38, 0x00, 0x80, 0x08, 0x44, 0x30,
   0x30, 0x18, 0x01, 0x02, 0x60, 0x80, 0x00, 0xc0, 0x00, 0x63, 0x18, 0x00,
   0x82, 0x08, 0x46, 0x30, 0x30, 0x18, 0x01, 0x02, 0x60, 0x80, 0x00, 0xc3,
   0x00, 0x42, 0x08, 0x00, 0xfc, 0xf8, 0xc7, 0x1f, 0xc0, 0x0f, 0x01, 0x02,
   0x60, 0x80, 0x00, 0x3f, 0x00, 0x00, 0x00, 0x00, 0x78, 0xf8, 0xc1, 0x07,
   0x00, 0x07, 0x01, 0x00, 0x40, 0x80, 0x00, 0x1c, 0x00, 0x00, 0x00, 0x00,
   0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
   0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
   0x00, 0x00, 0x00, 0x00 };




class SBBLogo {
  public:
    SBBLogo(SSD1306TwoWire * display, int showTime);
    void drawLogoSBB();
    void displayLogoSBB();
  private:
    SSD1306TwoWire * myDisplay;
};







class Weiche {
  public:
      Weiche (uint8_t x1Pin, uint8_t x2Pin, uint8_t x3Pin, uint8_t x4Pin, uint8_t microswitch, uint8_t servopin, uint8_t green, uint8_t red);
      Weiche (uint8_t x1Pin, uint8_t x2Pin, uint8_t x3Pin, uint8_t x4Pin, uint8_t microswitch, uint8_t servopin, uint8_t greenleft, uint8_t red, uint8_t greenright, uint8_t baubetrieb, uint8_t error, PCF8574 * pcf8574);
      uint8_t getPosition();
      void verriegeln();
      void entriegeln();
      void init(const char * weichen_id, bool fahrweg);
      void statusUpdate();
      bool getFahrweg();
      bool getVerriegelung();
      bool isFahrbetriebLage();
      bool isFahrbetrieb();
      uint8_t encodedStatus();
      String statusCode(SbbCrypt crypt);
      void endProcess();
  private:
    int _WEICHE_LAGEKONTAKT_1;
    int _WEICHE_LAGEKONTAKT_2;
    int _WEICHE_LAGEKONTAKT_3;
    int _WEICHE_LAGEKONTAKT_4;
    uint8_t _MICROSWITCH_PIN;
    void ioInit(uint8_t x1p, uint8_t x2p, uint8_t x3p, uint8_t x4p);
    void set(uint8_t pin1, uint8_t state1);
    void set(uint8_t pin1, uint8_t state1, uint8_t pin2, uint8_t state2);
    Servo _servo;
    int _SERVO_PIN;
    int _servoPos;
    uint8_t _redPin;
    uint8_t _greenPin;
    uint8_t _green2Pin;
    uint8_t _ledBaubetriebPin;
    uint8_t _ledErrorPin;
    bool _fahrweg;
    const char * _weichen_id;
    bool _verriegelt = false;
    uint8_t _position = 0x00;
    byte _encodebool (bool *arr, int len);
    PCF8574 * _i2cExpansion;
    bool _processStarted = false;
    char _newKey;
};


// class Sbb {
// public:
// private:
//
// }







#endif // SBBTOOLS_H
