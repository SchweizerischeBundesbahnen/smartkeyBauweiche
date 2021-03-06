#include "./sbbcrypt.h"


void SbbCrypt::setKey(char* key, int key_len) {
  char* __key = (char*) malloc(key_len * sizeof(char));
  for (int i = 0; i<key_len;i++) {
    __key[i] = key[i];
  }
  _key = __key;
  _key_len = key_len;
}

// drop the trailing byte of the key and add new random byte at the beginning
// returns the new randomly generated byte
byte SbbCrypt::rotateKey() {
  Serial.print("Old Key is: ");
  for (int i = 0; i < _key_len; i++){
    Serial.print("0x");
    if (_key[i] < 0x10)
      Serial.print("0");
    Serial.print(_key[i], HEX);
    Serial.print(", ");
  }
  Serial.println();
  byte rb = randByte();
  for (int i = _key_len-1;i>0;i--) {
    _key[i] = _key[i-1];
  }
  _key[0] = rb;
  Serial.print("New Key is: ");
  for (int i = 0; i < _key_len; i++){
    Serial.print("0x");
    if (_key[i] < 0x10)
      Serial.print("0");
    Serial.print(_key[i], HEX);
    Serial.print(", ");
  }
  Serial.println();
  return rb;
}



// Wandelt ein hex-string "CAFEBABE" nach {0xCA, 0xFE, 0xBA, 0xBE} um
void SbbCrypt::hexCharacterStringToBytes(byte *byteArray, const char *hexString) {
  bool oddLength = strlen(hexString) & 1;
  byte currentByte = 0;
  byte byteIndex = 0;
  for (byte charIndex = 0; charIndex < strlen(hexString); charIndex++)  {
    bool oddCharIndex = charIndex & 1;
    if (oddLength) {
      // If the length is odd
      if (oddCharIndex) {
        // odd characters go in high nibble
        currentByte = _nibble(hexString[charIndex]) << 4;
      }
      else {
        // Even characters go into low nibble
        currentByte |= _nibble(hexString[charIndex]);
        byteArray[byteIndex++] = currentByte;
        currentByte = 0;
      }
    }
    else  {
      // If the length is even
      if (!oddCharIndex)  {
        // Odd characters go into the high nibble
        currentByte = _nibble(hexString[charIndex]) << 4;
      }
      else  {
        // Odd characters go into low nibble
        currentByte |= _nibble(hexString[charIndex]);
        byteArray[byteIndex++] = currentByte;
        currentByte = 0;
      }
    }
  }
}


String SbbCrypt::bytesToHexCharacterString(const char * data, int len) {
  String string = "";
  char const hex_chars[16] = { '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F' };
  for ( int i = 0; i < len; ++i ) {
    char const byte = data[i];
    string += hex_chars[ ( byte & 0xF0 ) >> 4 ];
    string += hex_chars[ ( byte & 0x0F ) >> 0 ];
  }
  return string;
}


void SbbCrypt::decimalToHexString(int decimal, char* hex) {
    char hexDigits[] = "0123456789ABCDEF";
    char sHex[40];
    int remaindar;
    int i = 0;
    while(decimal != 0) {
        remaindar = decimal % 16;
        sHex[i] = hexDigits[remaindar];
        decimal /= 16;
        i++;
    }
    sHex[i] = '\0';
    memcpy(hex, sHex, i+1);
    _reverseCharArray(hex, i+1);
    Serial.println(hex);
    char* cutHex = (char*) malloc((i+1) * sizeof(char));
    for (int s = 0;s<i+1;s++) {
      cutHex[s] = hex[s];
    }
    hex = cutHex;
}


void SbbCrypt::_reverseCharArray(char *data, int data_len) {
    char rdata[data_len];
    for (int i = 0; i < data_len-1;i++) {
      rdata[data_len-i-2] = data[i];
    }
    rdata[data_len-1] = '\0';
    for (int i = 0; i < data_len;i++) {
      data[i] = rdata[i];
    }
}

// HEX to decimal
int SbbCrypt::charToDec(char snum[], int hex_len) {
  int dec = 0;
  for (int i = 0; i < hex_len; i++) {
    dec += (snum[i] & 0xff) << ((hex_len-1-i)*8);
  }
  return dec;
}


char SbbCrypt::getFirstKeyByte() {
  return _key[0];
}


void SbbCrypt::xor_crypt(char *data, int len) {
  for (int i = 0; i<len;i++) {
    Serial.print(" ");
    Serial.print(data[i], HEX);
  }
  Serial.print(" > \"");
  for (int i = 0; i<_key_len;i++) {
    Serial.print(_key[i], HEX);
  }
  Serial.print("\" > ");
    for (int i = 0; i < len; i++)
        data[i] ^= _key[ i % _key_len ];
  for (int i = 0; i<sizeof(data);i++) {
    Serial.print(" ");
    Serial.print(data[i], HEX);
  }
  Serial.print(" ; ");
}

// Outputs random byte
byte SbbCrypt::randByte() {
  int rn;
  char hex[2];
  srand(time(NULL));
  rn = (rand() % 255) + 1;
  decimalToHexString(rn, hex);
  byte byteArray[2];
  hexCharacterStringToBytes(byteArray, hex);
  Serial.print("Random Byte: "); Serial.println(byteArray[0], HEX);
  return byteArray[0];
}


void SbbCrypt::dumpByteArray(byte * byteArray, byte arraySize) {
  for (int i = 0; i < arraySize; i++){
    Serial.print("0x");
    if (byteArray[i] < 0x10)
      Serial.print("0");
    Serial.print(byteArray[i], HEX);
    Serial.print(", ");
  }
  Serial.println();
}


byte SbbCrypt ::_nibble(char c) {
  if (c >= '0' && c <= '9')
    return c - '0';
  if (c >= 'a' && c <= 'f')
    return c - 'a' + 10;
  if (c >= 'A' && c <= 'F')
    return c - 'A' + 10;
  return 0;  // Not a valid hexadecimal character
}
