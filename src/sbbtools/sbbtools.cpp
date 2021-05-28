#include "./sbbtools.h"


#define EMPTY_PIN 3



SBBLogo::SBBLogo(SSD1306TwoWire * display, int showTime) {
  myDisplay = display;
  if (showTime > 0) {
    displayLogoSBB();
    delay(showTime);
  }
}


// -----------------------------------------------------------------
// Draw SBB Logo to OLED Display
// -----------------------------------------------------------------
void SBBLogo::drawLogoSBB() {
    myDisplay->drawXbm(0, 16, 128, 16, sbbLogo128x16);
}


void SBBLogo::displayLogoSBB() {
  drawLogoSBB();
  myDisplay->display();
}


// Weiche erstellen für Variante IoT
Weiche::Weiche(uint8_t x1Pin, uint8_t x2Pin, uint8_t x3Pin, uint8_t x4Pin, uint8_t microswitch, uint8_t servopin, uint8_t green, uint8_t red) {
  _WEICHE_LAGEKONTAKT_1 = x1Pin;
  _WEICHE_LAGEKONTAKT_2 = x2Pin;
  _WEICHE_LAGEKONTAKT_3 = x3Pin;
  _WEICHE_LAGEKONTAKT_4 = x4Pin;
  _MICROSWITCH_PIN = microswitch;
  _SERVO_PIN = servopin;
  _redPin = red;
  _greenPin = green;
  _green2Pin = EMPTY_PIN;
  _ledBaubetriebPin = EMPTY_PIN;
  _ledErrorPin = EMPTY_PIN;
  _i2cExpansion = NULL;
}


// Weiche erstellen für Vairante Konventionell
Weiche::Weiche (uint8_t x1Pin, uint8_t x2Pin, uint8_t x3Pin, uint8_t x4Pin, uint8_t microswitch, uint8_t servopin, uint8_t greenleft, uint8_t red, uint8_t greenright, uint8_t baubetrieb, uint8_t error, PCF8574 * pcf8574) {
  _WEICHE_LAGEKONTAKT_1 = x1Pin;
  _WEICHE_LAGEKONTAKT_2 = x2Pin;
  _WEICHE_LAGEKONTAKT_3 = x3Pin;
  _WEICHE_LAGEKONTAKT_4 = x4Pin;
  _MICROSWITCH_PIN = microswitch;
  _SERVO_PIN = servopin;
  _redPin = red;
  _greenPin = greenleft;
  _green2Pin = greenright;
  _ledBaubetriebPin = baubetrieb;
  _ledErrorPin = error;
  _i2cExpansion = pcf8574;
}


// Weiche initialisieren
// fahrweg: true = rechts, false = links
void Weiche::init(const char * weichen_id, bool fahrweg) {
  // Microswitch
  pinMode(_MICROSWITCH_PIN, INPUT_PULLUP);
  _servoPos = 0;
  _fahrweg = fahrweg;
  _weichen_id = weichen_id;
}


bool Weiche::getFahrweg() {
  return _fahrweg; // fahrweg: true = rechts, false = links
}


// Prüft, ob Weiche im Fahrbetrieb ist
// dies ist der Fall, wenn sowohl die Weichenlage im Fahrbetrieb ist
// und die Weiche verriegelt ist
// wenn nicht Fahrbetrieb, dann ist "Baubetrieb"
bool Weiche::isFahrbetrieb() {
  if (isFahrbetriebLage() && getVerriegelung()) {
    if (_i2cExpansion != NULL) {
      _i2cExpansion->digitalWrite(_ledBaubetriebPin, LOW);
    }
    return true;
  }
  if (_i2cExpansion != NULL) {
    _i2cExpansion->digitalWrite(_ledBaubetriebPin, HIGH);
  }
  return false;
}

void Weiche::endProcess() {
  _processStarted = false;
}


String Weiche::statusCode(SbbCrypt crypt) {
  Serial.print("Position: "); Serial.println(_position, HEX);
  Serial.print("Verriegelt: "); Serial.println(_verriegelt, HEX);
  char status[1] = {encodedStatus()};
  Serial.print("Statuscode: "); Serial.println(status[0], HEX);
  crypt.xor_crypt(status, sizeof(status));
  Serial.print("Statuscode encoded: "); Serial.println(status[0], HEX);
  char statusFull[4];
  statusFull[0] = _weichen_id[0];
  statusFull[1] = _weichen_id[1];
  statusFull[2] = status[0];
  if (!_processStarted) {
    char newKey = crypt.rotateKey();
    _processStarted = true;
    statusFull[3] = newKey;
  }
  else {
    statusFull[3] = crypt.getFirstKeyByte();
  }
  return crypt.bytesToHexCharacterString(statusFull, 4);
}


// Prüft ob Weiche in richtiger Endlage ist
// Prüft nicht, ob Weiche verriegelt
// dies muss separat passieren via getVerriegelung()
bool Weiche::isFahrbetriebLage() {
  Serial.println("Prüfen ob Weiche im Fahrbetrieb (korrekte Endlage).");
  // Weiche verriegelt und Fahrweg entspricht dem Fahrweg für Betrieb
  // dann befinden wir uns im Prozess
  // Weiche entriegeln
  // weichen_fahrweg/getFahrweg(): true = rechts, false = links
  // weichen_cur_pos: 0x01=rechts, 0x02=links, 0x00=keine Endlage
  // dl: 10=verriegeln, 11=öffnen
  bool fahrweg = getFahrweg();
  int lage = getPosition();
  Serial.print("Fahrweg: ");Serial.print(fahrweg); Serial.print("; Lage: ");Serial.print(lage);
  if ((fahrweg && lage == 0x01) || (!fahrweg && lage == 0x02)) { // in richtiger Lage
    Serial.println("; Weiche befindet sich in korrekter Endlage.");
    return true;
  }
  Serial.println("; Weiche befindet sich nicht in korrekter Endlage.");
  return false;
}


bool Weiche::getVerriegelung(){
  return _verriegelt;
}


void Weiche::statusUpdate() {
  // Read All Sensors
  // Set LED
    _verriegelt = digitalRead(_MICROSWITCH_PIN)==1?false:true;
    Serial.print("Verriegelung: "); Serial.print(_verriegelt);
    _position = getPosition();
    Serial.print("; Weichenposition: ");
    Serial.println(_position, HEX);

    // Set LED to left, middle right for Variante Konventionell
    if (_green2Pin != 3) {
      if (_position == 0x02) { // Links
        _i2cExpansion->digitalWrite(_greenPin, HIGH);
        _i2cExpansion->digitalWrite(_green2Pin, LOW);
        _i2cExpansion->digitalWrite(_redPin, LOW);
      }
      else if (_position == 0x01) { // rechts
        _i2cExpansion->digitalWrite(_greenPin, LOW);
        _i2cExpansion->digitalWrite(_green2Pin, HIGH);
        _i2cExpansion->digitalWrite(_redPin, LOW);
      }
      else {
        _i2cExpansion->digitalWrite(_greenPin, LOW);
        _i2cExpansion->digitalWrite(_green2Pin, LOW);
        _i2cExpansion->digitalWrite(_redPin, HIGH);
      }
    }

    // Variante IoT
    if (_green2Pin == 3) {
        // Weiche in Endlage => grün
        if ((_fahrweg && _position == 0x01) || (!_fahrweg && _position == 0x02)) {
          digitalWrite(_greenPin, HIGH);
          digitalWrite(_redPin, LOW);
        }
        // weiche hat keine Endlage => rot
        else {
          digitalWrite(_greenPin, LOW);
          digitalWrite(_redPin, HIGH);
        }
    }
}


uint8_t Weiche::encodedStatus() {
  // {links, mitte, rechts,verriegelt,empt,empt,empt,  empt }
  bool links  = _position == 0x02 ? true : false;
  bool mitte  = _position == 0x00 ? true : false;
  bool rechts = _position == 0x01 ? true : false;
  // fill empty spots with random values to obfuscate the value more
  srand(time(NULL)+45684);
  int rand1 = rand() % 100;
  bool empt1  = rand1 > 48 ? true : false; srand(time(NULL)+15657);rand1 = rand() % 100;
  bool empt2  = rand1 > 48 ? true : false; srand(time(NULL)+64543);rand1 = rand() % 100;
  bool empt3  = rand1 > 48 ? true : false; srand(time(NULL)+46532);rand1 = rand() % 100;
  bool empt4  = rand1 > 48 ? true : false;
  bool arr[8] = {links, mitte, rechts, _verriegelt, empt1, empt2, empt3, empt4 };
  return _encodebool(arr, 8);
}

// ************* Rückgaben: keine Eindalge: 0, Rechte Eindalge: 1; Linke Endlage: 2, *********
uint8_t Weiche::getPosition (){
  // *************** versuchen ob Endalge rechts vorhanden ***********************************
  ioInit(OUTPUT, INPUT, INPUT, INPUT);
  set(_WEICHE_LAGEKONTAKT_1, LOW);
  if ((digitalRead(_WEICHE_LAGEKONTAKT_2)==HIGH) && (digitalRead(_WEICHE_LAGEKONTAKT_3)== HIGH) && (digitalRead(_WEICHE_LAGEKONTAKT_4)== LOW)) {
    //Serial.println("halbe rechte Endlage vorhanden: X2=LOW, X3=LOW, X4=HIGH");
    ioInit(OUTPUT, OUTPUT, INPUT, INPUT);
    set(_WEICHE_LAGEKONTAKT_1, HIGH, _WEICHE_LAGEKONTAKT_2, LOW);
    if ((digitalRead(_WEICHE_LAGEKONTAKT_3) == LOW) && (digitalRead(_WEICHE_LAGEKONTAKT_4) == HIGH)) {
      //Serial.println("rechte Endlage vorhanden: X3=LOW, X4=HIGH");
      return 0x01;
    }
  }
  // *************** versuchen ob Endalge links vorhanden ************************************
  set(_WEICHE_LAGEKONTAKT_1, LOW);
  if ((digitalRead(_WEICHE_LAGEKONTAKT_2)== HIGH) && (digitalRead(_WEICHE_LAGEKONTAKT_3)== LOW) && (digitalRead(_WEICHE_LAGEKONTAKT_4)== HIGH)) {
    //Serial.println("halbe linke Endlage vorhanden: X2=LOW, X3=HIGH, X4=LOW");
    ioInit(OUTPUT, OUTPUT, INPUT, INPUT);
    set(_WEICHE_LAGEKONTAKT_1, HIGH, _WEICHE_LAGEKONTAKT_2, LOW);
    if ((digitalRead(_WEICHE_LAGEKONTAKT_3)== HIGH)&&(digitalRead(_WEICHE_LAGEKONTAKT_4)== LOW)) {
      //Serial.println("linke Endlage vorhanden: X3=LOW, X4=HIGH");
      return 0x02;
    }
  }
  return 0x00;
}


void Weiche::ioInit(uint8_t x1p, uint8_t x2p, uint8_t x3p, uint8_t x4p) {
  pinMode (_WEICHE_LAGEKONTAKT_1, x1p);
  pinMode (_WEICHE_LAGEKONTAKT_2, x2p);
  pinMode (_WEICHE_LAGEKONTAKT_3, x3p);
  pinMode (_WEICHE_LAGEKONTAKT_4, x4p);
  delay(WEICHE_DELAY);
}


void Weiche::set(uint8_t pin1, uint8_t state1) {
  digitalWrite(pin1, state1);
  delay(WEICHE_DELAY);
}
void Weiche::set(uint8_t pin1, uint8_t state1, uint8_t pin2, uint8_t state2) {
  digitalWrite(pin1, state1);
  delay(WEICHE_DELAY);
  digitalWrite(pin2, state2);
  delay(WEICHE_DELAY);
}


// Gibt dem Servo den Auftrag zum Verriegeln, bzw Entriegeln
void Weiche::verriegeln() {
  _servo.attach(_SERVO_PIN);
  delay(100);
  int pos = 0;
  Serial.print("Weichenverriegelung ist bei Position "); Serial.println(_servoPos);
    for (pos = _servoPos; pos >= SERVO_POS_CLOSE; pos--) {
      _servo.write(pos);
      delay(SERVO_SPEED);
    }
    _servoPos = pos;
    Serial.println("Weichenverreigelung aktiv!");
    // _verriegelt = true;
    Serial.print("Weichenverriegelung ist jetzt bei: "); Serial.println(pos - 1);
  _servo.detach();
}


// Verriegelt mittels Servo die Weiche
void Weiche::entriegeln() {
  _servo.attach(_SERVO_PIN);
  delay(100);
  int pos = 0;
  Serial.print("Weichenverriegelung ist bei Position "); Serial.println(_servoPos);
    for (pos = _servoPos; pos <= SERVO_POS_OPEN; pos++) {
      _servo.write(pos);
      delay(SERVO_SPEED);
    }
    _servoPos = pos;
    Serial.println("Weichenverreigelung geöffnet!");
    // _verriegelt = false;
    Serial.print("Weichenverriegelung ist jetzt bei: "); Serial.println(pos - 1);
  _servo.detach();
}



// -----------------------------------------------------------------
//
// -----------------------------------------------------------------
byte Weiche::_encodebool (bool *arr, int len ) {
  byte val = 0;
  for (int i = 0; i < len; i++) {
    val <<= 1;
    if (arr[i]) val |= 1;
  }
  return val;
}
