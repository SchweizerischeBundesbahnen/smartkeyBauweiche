#ifndef CREDENTIALS_LORA_h
#define CREDENTIALS_LORA_h
#include <Arduino.h>

#include <lmic.h> // https://doc.sm.tc/mac/programming.html
#include <hal/hal.h>


// dev EUI in LSB mode.
extern const u1_t PROGMEM DEVEUI[];

// App EUI in LSB mode
extern const u1_t PROGMEM APPEUI[];

// App Key in MSB mode
extern const u1_t PROGMEM APPKEY[];




#endif // end of CREDENTIALS_LORA_h
