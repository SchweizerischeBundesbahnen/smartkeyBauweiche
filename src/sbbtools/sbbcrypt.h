









#ifndef SBBCRYPT_H
#define SBBCRYPT_H

#include <Arduino.h>


class SbbCrypt {
  public:
    void setKey (char* key, int key_len);
    void hexCharacterStringToBytes(byte *byteArray, const char *hexString);
    String bytesToHexCharacterString(const char * data, int len);
    int charToDec(char snum[], int hex_len);
    void xor_crypt(char *data, int len);
    void decimalToHexString(int decimal, char* hex);
    void dumpByteArray(byte * byteArray, byte arraySize);
    byte randByte();
    byte rotateKey();
    char getFirstKeyByte();
  private:
    char * _key;
    int _key_len;
    void _reverseCharArray(char *data, int data_len);
    byte _nibble(char c);

};



// class Sbb {
// public:
// private:
//
// }







#endif // SBBCRYPT_H
