/* global $ */

var WEICHEN = [{
      weichenId: { name: 'Weichen-ID', value: '12A1' },
      pid: { name: 'Weichenbezeichnung', value: '5' },
      bid: { name: 'Betriebspunkt', value: 'Esempio' },
      operating: { name: 'Zeitraum der Bautätigkeit', value: { von: '2020-06-01', bis: '2020-06-30' } },
      pName: { name: 'Projektname', value: 'Test Esempio' },
      sim: { name: 'Simulation der Weichenüberwachung', value: false },
      condition: { name: 'Voraussetzung für das Öffnen der Verschraubung', value: { gleise: [102], weichen: [] } },
      fahrweg: { name: 'Vereinbarter Fahrweg', value: 'links' }, // links = 2, rechts = 1
      last_change: { name: 'letzte Änderung der Projektierung', value: '2020-01-01_22:30' },
      projId: { name: 'Projektierungsfall', value: '1234' },
      telefon: { name: 'Erlaubte Telefon Nummern', value: ['+41794277033', '+41794173362'] },
      sprache: { name: 'Sprache', value: 'deutsch' },
      thingsId: { name: 'Thing-ID', value: '5fa411180e685a110734e5e1' },
      devEUI: { name: 'devEUI', value: '0004A30B00ECB8E6' },
      // devEUI: { name: 'devEUI', value: '3FE58F3F38F99999' },  // lora Mock
      type: { name: 'Technologie-Typ der Weiche', value: 'iot' },
      status: {
            locked: true
      },
      encryptionKey: [0x42, 0x41, 0x4b, 0xaf], // Shared crypt key with Bauweichenmanager
}];

const TYPE_UNLOCK = 0;
const TYPE_LOCK = 1;
const TYPE_UNDEFINED = 2;


// Status von Iltis (Objekt enhält alle infos aus Info, wird bei änderungen ausgetauscht zwischen BWM und Iltis)
let iltis;

// Twilio
const SMS_sid = '';
const SMS_t = '';

const SMS_MESSAGES = {
      WEICHE_UNKNOWN: 'Diese Weiche mit der ID "%S0%" ist im Bauweichenmanager nicht registriert. Überprüfen Sie, ob Sie die ID korrekt übermittelt haben.',
      TELEFON_UNKNOWN: 'Sie sind nicht berechtigt, diese Weiche zu manipulieren!',
      TELEFON_SUCCESS: 'Authentifizierung der Weiche "%S0%" erfolgreich! Sie haben 5 Minuten Zeit um die Weiche in die richtige Position zu bringen und den Knopf zur Bestätigung drücken.'
};


// DeviceWise
// Test
// const deviceWiseEndpoint = "https://api-test.iotcloud.swisscom.com/api";
// const APP_TOKEN = "l05fOGOpbALFjEI4";
// const APP_ID = "5eba60975f847e5b7716c773"; // in deviceWise>Developer>Current_organization>Name:SBB@ID:?????
// Prod
const deviceWiseEndpoint = "https://api.iotcloud.swisscom.com/api";
const APP_TOKEN = "";
const APP_ID = ""; // in deviceWise>Developer>Current_organization>Name:SBB@ID:?????
const THING_KEY = "lpn-device";


const timeoutAnfrage = 5; // in Minuten



// Table des Bauweichenmanagers
const bwmTable = {
      cols: [{
            title: 'Var',
            key: 'variante',
            type: 'byte',
            check: false
      }, {
            title: 'Eingang',
            key: 'startTimestamp',
            type: 'datetime',
            check: false
      }, {
            title: 'Type',
            key: 'type',
            type: 'type_lock',
            check: false
      }, {
            title: 'Weichen-ID',
            key: 'weichenId',
            type: 'string',
            check: 'default'
      }, {
            title: 'Telefon',
            key: 'telefon',
            type: 'string',
            check: 'default'
      }, {
            title: 'Weichenposition',
            key: 'curPos',
            type: 'int',
            check: 'default'
      }, {
            title: 'Verriegelung',
            key: 'verriegelung',
            type: 'int',
            check: 'default'
      }, {
            title: 'Sperrung',
            key: 'sperre',
            type: 'int',
            check: 'default'
      }],
      backgroundColor: {
            good: 'green',
            bad: 'red'
      },
      domCellRender: function(anfrage, col) {
            let td = document.createElement('td');
            let value = '';
            switch (col.type) {
                  case 'datetime':
                        value = getDateTimeLeadingZeros(anfrage.params[col.key]).join(' ');
                        break;
                  case 'int':
                        value = anfrage.params[col.key];
                        if (col.key === 'curPos') value = value === 2 ? 'links' : value === 1 ? 'rechts' : 'keine Endlage';
                        break;
                  case 'type_lock':
                        value = anfrage.type === 0 ? 'öffnen' : anfrage.type === 1 ? 'verriegeln' : 'unklar';
                        break;
                  case 'byte':
                        value = anfrage.params[col.key] === 0x01 ? 'IoT' : 'SMS';
                        break;
                  default:
                        value = anfrage.params[col.key];
            }
            td.innerHTML = value;
            if (col.check === 'default') td.style.backgroundColor = anfrage.status[col.key] ? this.backgroundColor.good : this.backgroundColor.bad;
            return td;
      },
      // rendert eine DOM-Row in der Tabelle mit der Anfage
      domRow: function(anfrage) {
            let tr = document.createElement('tr');
            for (let i = 0; i < bwmTable.cols.length; i++) {
                  tr.appendChild(this.domCellRender(anfrage, this.cols[i]));
            }
            return tr;
      },
      thead: function() {
            let thead = document.createElement('thead');
            let tr = document.createElement('tr');
            for (let i = 0; i < this.cols.length; i++) {
                  let th = document.createElement('th');
                  th.innerHTML = this.cols[i].title;
                  tr.appendChild(th);
            }
            thead.appendChild(tr);
            return thead;
      }
};



/**
 *
 * Klasse Anfrage
 * Anfragen werden hier geprüft und abgelegt
 *
 *
 */
class Anfragen {
      constructor() {
            this.items = [];
      }

      /**
       * Adds a new Anfrage
       * Checks if Anfrage already exists; if exists return -1
       *
       */
      add(anfrage) {
            let key = this.checkIfExists(anfrage);
            if (key < 0) { // Neue Anfrage
                  this.items.push(anfrage);
                  // Rotate key mit neuem Byte
                  let index = anfrage.weichenArrayIndex();
                  let cryptKey = WEICHEN[index].encryptionKey;
                  for (let i = cryptKey.length - 1; i > 0; i--) cryptKey[i] = cryptKey[i - 1];
                  cryptKey[0] = anfrage.params.keyByte;
                  WEICHEN[index].encryptionKey = cryptKey;
                  console.log('rotated encryptionKey: ');
                  console.log(WEICHEN[index].encryptionKey);
                  console.log('BWM: neue Anrfage erstellt mit weichenId "' + anfrage.params.weichenId + '" und dem Index ' + (this.items.length - 1));
                  this.items[this.items.length - 1].check();
            }
            else { // if Anfrage-Item already exists, merge
                  this.merge(anfrage, key);
            }
            this.sortByDateDesc();
            this.updateTable();

            return key;
      }

      get() {
            return this.items;
      }

      merge(anfrageNew, anfrageOldIndex) {
            let anfrageOld = this.items[anfrageOldIndex];
            let change = false;
            // Update SMS when there is a telephone and check if anfrage is newer
            if (anfrageNew.params.telefon !== '' && (anfrageOld.params.telefon === '' || anfrageNew.params.smsTimestamp > anfrageOld.params.smsTimestamp)) {
                  anfrageOld.params.telefon = anfrageNew.params.telefon;
                  anfrageOld.params.smsTimestamp = anfrageNew.params.smsTimestamp;
                  change = true;
            }
            // Update curPos
            if (anfrageNew.params.curPos > -1 && (anfrageOld.params.curPos < 0 || anfrageNew.params.loraTimestamp > anfrageOld.params.loraTimestamp)) {
                  anfrageOld.params.curPos = anfrageNew.params.curPos;
                  change = true;
            }
            // Update verriegelung
            if (anfrageNew.params.verriegelung > -1 && (anfrageOld.params.verriegelung < 0 || anfrageNew.params.loraTimestamp > anfrageOld.params.loraTimestamp)) {
                  anfrageOld.params.verriegelung = anfrageNew.params.verriegelung;
                  anfrageOld.params.loraTimestamp = anfrageNew.params.loraTimestamp;
                  change = true;
            }
            if (change) {
                  console.log('Anfrage aktualisiert');
                  this.items[anfrageOldIndex].check();
            }
      }


      /**
       * prüft, ob bereits eine Anfrage zu dieser Weiche läuft
       *
       * gibt true zurück, wenn es bereits eine Anfrage innerhalb des Zeitraumes threshold gibt
       * gibt false zurück, falls es noch keine Anfrage gibt
       */
      checkIfExists(anfrage) {
            let weichenId = anfrage.params.weichenId;
            let timestamp = anfrage.params.startTimestamp;
            for (let i in this.items) {
                  if (this.items[i].params.weichenId !== weichenId) continue;
                  let threshold = new Date(this.items[i].params.startTimestamp.getTime());
                  threshold.setSeconds(threshold.getSeconds() + timeoutAnfrage * 60);
                  if (timestamp <= threshold) { // es besteht schon eine eine Anfrage zu dieser Weiche
                        return i; // Index der Anfrage zurücksenden
                  }
            }
            return -1;
      }

      // sort Anfragen by date desc (newest first)
      sortByDateDesc() {
            this.items.sort((a, b) => {
                  let x = a.params.startTimestamp,
                        y = b.params.startTimestamp;
                  return x < y ? 1 : x > y ? -1 : 0;
            });
      }

      // Anfragen in Tabelle
      updateTable() {
            $('#bwmTable').empty();
            $('#bwmTable').append(bwmTable.thead());
            $('#bwmTable').append(document.createElement('tbody'));
            $('#bwmTable').css({
                  overflow: 'auto',
                  display: 'block',
                  height: '150px'
            });
            for (let i = 0; i < this.items.length; i++) {
                  $('#bwmTable tbody').append(bwmTable.domRow(this.items[i]));
            }
      }
}
var anfragen = new Anfragen();












/**
 *
 * Klasse für eine Anfrage
 * Anfragen werden in anfragen.items[] gespeichert
 *
 *
 */

var Anfrage = function(params) {
      let now = new Date();
      let self = this;
      this.id = now.valueOf(); // setzt eine unique Id mittels timestamp in millisekunden
      this.type = null; // type of Anfrage can be TYPE_UNLOCK or TYPE_LOCK

      // set default params
      this.params = {
            startTimestamp: now,
            smsTimestamp: null,
            loraTimestamp: null,
            closeTimestamp: -1,
            weichenId: -1,
            telefon: '',
            curPos: -1,
            verriegelung: -1,
            sperre: -1,
            type: '', // can be 'open' or 'lock'
            variante: 0x00, // Variante Konventionell oder IoT
            statusEncoded: null, // kodierter Status
            keyByte: null
      };
      // Speichert, welche SMS bereits gesendet wurden damit diese nur einmal gesendet werden
      this.sms = {
            weichenId: false,
            telefon: false
      };
      // Speichert, ob Anfrage-Status gründ oder rot
      this.status = {
            weichenId: false, // existiert die angeforderte Weichen-ID?
            telefon: false, // berechtigte Telefonnummer
            curPos: false, // momentane position der Weiche korrekt
            verriegelung: false, // ist weiche verriegelt?
            sperre: false, // ob betroffenes Gleis gesperrt ist oder nicht (information kommt aus Iltis)
            shouldLock: false, // wenn true, dann kann Weiche verriegelt werden; noch nicht locked, da dies zuerst von der Weiche bestätigt werden muss
            locked: false
      };

      // set parameters
      for (let i in params) {
            this.params[i] = params[i];
      }

      // make variante top accessible
      this.variante = this.params.variante;


      // Normalize weichenId 12a1 => '12A1'
      this.params.weichenId = String(this.params.weichenId).replace(/[^A-Za-z0-9.]/mig, "").toUpperCase();

      // wenn eine encodierter Status vorhanden ist, dann muss dieser decodiert werden
      if (this.params.statusEncoded !== undefined) {
            // weichen index suchen
            let key;
            let i = 0;
            for (i; i < WEICHEN.length; i++) {
                  if (self.params.weichenId == WEICHEN[i].weichenId.value) break;
            }
            key = WEICHEN[i].encryptionKey;
            // console.log('encryptionKey');
            // console.log(key);
            this.params.statusDecoded = xor_crypt(this.params.statusEncoded, toHexString(key));
            // console.log('status decoded:');
            // console.log(this.params.statusDecoded);
            // {links, mitte, rechts,verriegelt,empt,empt,empt,  empt }
            let status = hex2bin(this.params.statusDecoded).split('');
            this.params.curPos = status[0] === '1' ? 2 : status[1] === '1' ? 0 : 1; // links=2, mitte=0, rechts=1
            this.params.verriegelung = status[3];
      }

      /**
       * Gibt die Array Position der Weiche zurück
       *
       */
      this.weichenArrayIndex = function() {
            for (let i = 0; i < WEICHEN.length; i++) {
                  if (self.params.weichenId == WEICHEN[i].weichenId.value) return i;
            }
            return -1;
      };




      // gibt true zurück, wenn Fahrweg stimmt, false, wenn falscher Fahrweg von Lora-Device übertragen wurde
      let checkFahrweg = function(wIndex) {
            return ['', 'rechts', 'links'][parseInt(self.params.curPos, 10)] === WEICHEN[wIndex].fahrweg.value ? true : false;
      };

      // gibt true zurück, wenn telefonnummer der Anfrage sich in Liste von erlaubten Telefonnummern befindet. Ansonsten false
      let checkTelefon = function(wIndex) {
            for (let i = 0; i < WEICHEN[wIndex].telefon.value.length; i++) {
                  // Nur Zahlen-Teil der Telefon vergleichen; also keine '+' u.ä.
                  if (self.params.telefon.toString().replace(/[^0-9.]/g, "") === WEICHEN[wIndex].telefon.value[i].replace(/[^0-9.]/g, "")) return true;
            }
            return false;
      };

      // Anfrage.prototype.checkVerriegelung = wIndex => this.params.verriegelung > 0 ? true : false;
      let checkVerriegelung = function(wIndex) {
            return self.params.verriegelung > 0 ? true : false;
      };

      let checkSperre = function() {
            if (self.params.sperre > 0) {
                  return true;
            }
            return false;
      };

      /**
       *
       * Prüft alle parameter
       *
       * setzt this.status{} auf true/false
       * am Schluss wird geprüft, ob alle this.status{} i.O.
       *
       */

      this.check = function() {
            console.log('Parameter der Anfrage werden geprüft');

            // Check if WeichenId != -1
            if (this.params.weichenId < 0) return false; // is -1 if weichenId could not be found in WEICHEN

            // Checks if weichenId is in    arr WEICHEN[]
            let i = this.weichenArrayIndex();
            this.status.weichenId = i >= 0 ? true : false;

            // weiche existiert nicht / falsche Weiche
            // wenn keien Korrekte Weiche, wird Anfrage nicht weiter geprüft und return false zurück gegeben
            // check sms to prevent SMS Sending-Loop
            if (!this.status.weichenId && !this.sms.weichenId) {
                  sendSMS(this.params.telefon, replaceArray(SMS_MESSAGES.WEICHE_UNKNOWN, [this.params.weichenId]));
                  console.log(replaceArray(SMS_MESSAGES.WEICHE_UNKNOWN, [this.params.weichenId]));
                  this.sms.weichenId = true;
            }
            // Stop checking, if weichenId is unknown
            if (!this.status.weichenId) return false;

            console.log('Weiche legitim!');

            // Telefon Check; check if telefonnumber is valid for this Weiche
            this.status.telefon = checkTelefon(i); // returns true or false
            if (!this.sms.telefon) {
                  if (!this.status.telefon) {
                        sendSMS(this.params.telefon, SMS_MESSAGES.TELEFON_UNKNOWN);
                  }
                  else {
                        sendSMS(this.params.telefon, replaceArray(SMS_MESSAGES.TELEFON_SUCCESS, [this.params.weichenId]));
                  }
                  this.sms.telefon = true;
            }

            // Verriegelung check
            console.log('Prüfe Verriegelung');
            this.status.verriegelung = checkVerriegelung(i);
            // TODO: set Sperrtext in Iltis if false

            // Fahrweg check
            console.log('Prüfe Fahrweg');
            this.status.curPos = checkFahrweg(i);

            console.log('Prüfe ob in Iltis gesperrt');
            this.status.sperre = checkSperre();

            console.log('Check beendet. Resultat:');
            console.log({
                  weichenId: this.status.weichenId,
                  telefon: this.status.telefon,
                  curPos: this.status.curPos,
                  verriegelung: this.status.verriegelung,
                  shouldLock: this.status.shouldLock,
                  sperre: this.status.sperre
            });

            // Wenn Endlage && Verriegelung aktiv dann ist der Typ "Entriegelung"
            if (checkFahrweg(i) && checkVerriegelung(i)) {
                  this.type = TYPE_UNLOCK;
            }
            else if (checkFahrweg(i) && !checkVerriegelung(i)) {
                  this.type = TYPE_LOCK;
            }
            else {
                  this.type = TYPE_UNDEFINED;
            }

            // let hexKey = toHexString(WEICHEN[this.weichenArrayIndex()].encryptionKey);
            // console.log('xor crypted: ');
            // console.log(xor_crypt('0301', hexKey));
            // sendSMS(this.params.telefon, parseInt(xor_crypt('0301', hexKey), 16));

            // wenn wid, position der Weiche und Telefon korrekt, dann downlink senden zur Verriegelung
            if (this.status.weichenId && this.status.telefon && this.status.curPos && this.status.sperre && !this.status.shouldLock) {
                  let hexKey = toHexString(WEICHEN[this.weichenArrayIndex()].encryptionKey);
                  if (this.status.verriegelung) {
                        console.log('everything clear; sending downlink/code to unlock!');
                        if (this.params.variante === 0x01) {
                              sendDownlink(WEICHEN[0].devEUI.value, '11');
                        }
                        else {
                              sendSMS(this.params.telefon, parseInt(xor_crypt('0301', hexKey), 16));
                        }
                  }
                  else {
                        console.log('everything clear; sending downlink/SMS to lock!');
                        if (this.params.variante === 0x01) {
                              sendDownlink(WEICHEN[0].devEUI.value, '10');
                        }
                        else {
                              sendSMS(this.params.telefon, parseInt(xor_crypt('0302', hexKey), 16));
                        }
                  }
                  this.status.shouldLock = true;
            }
      };


};




self.onInit = function() {
      self.ctx.$scope.$root.$on('iltis-bwm', function(evt, data) {
            console.log('BWM: recieve Iltis update.');
            console.log('Data received:');
            console.log(data);
            // Iltis
            // for (let i in data.status.linien) {
            //       let wid = String(data.status.linien[i].num).replace(/[^A-Za-z0-9.]/mig, "").toUpperCase();
            //       anfrageIndex = checkForNewAnfrage(wid, new Date());
            //       if (anfrageIndex >= 0) {
            //             anfragen[anfrageIndex].params.sperre = data.status.linien[i].gesperrt;
            //             anfragen[anfrageIndex].check();
            //       }
            // }
            for (let i in anfragen.items) {
                  anfragen.items[i].params.sperre = data.status.linien[4].gesperrt;
                  anfragen.items[i].check();
            }
            iltis = data.status;
            console.log(iltis);
      });
      self.ctx.$scope.$root.$on('bwm', function(evt, data) {
            let params = {};
            // SMS (Telefon, weichenId)
            if (data.sms !== undefined && data.sms.length && data.sms[0].data.length) {
                  // console.log("BWM: Reading SMS Data...");
                  let dataS = serializeTimeSeries(data.sms);
                  // console.log(dataS);
                  for (let i in dataS) {
                        let decode = function(payload) {
                              let body = {};
                              // Variante IoT
                              if (payload.length === 4) {
                                    body.weichenId = payload;
                                    body.variante = 0x01; // Iot
                              }
                              // Variante Konventionell
                              else {
                                    body.weichenId = payload.substr(0, 4);
                                    body.variante = 0x02; // Konventionell
                                    body.statusEncoded = payload.substr(4, 2);
                                    // New Key Byte
                                    if (payload.length === 8) {
                                          body.keyByte = parseInt(payload.substr(6, 2), 16);
                                    }
                              }
                              return body;
                        };
                        params = decode(dataS[i].Body);
                        params.telefon = dataS[i].From;
                        params.startTimestamp = dataS[i].timestamp;
                        params.smsTimestamp = dataS[i].timestamp;
                        anfragen.add(new Anfrage(params));
                  }
            }
            // LoRaWan; Weichenstatus (weichenlage, locked)
            else if (data.weichenstatus !== undefined && data.weichenstatus.length && data.weichenstatus[0].data.length) {
                  // console.log("BWM: Reading Weichenstatus Data...");
                  let dataS = serializeTimeSeries(data.weichenstatus);
                  for (let i in dataS) {
                        params.weichenId = dataS[i].weichenId;
                        params.startTimestamp = dataS[i].timestamp;
                        params.curPos = dataS[i].curPos;
                        params.verriegelung = dataS[i].verriegelung;
                        params.loraTimestamp = dataS[i].timestamp;
                        anfragen.add(new Anfrage(params));
                  }
            }
            else {
                  // console.log('empty data');
            }
      });


};


self.onDataUpdated = function() {

      $('#bwmTable tbody').empty();
      console.log(anfragen);

      for (let i in anfragen.items) {
            $('#bwmTable tbody').append(bwmTable.domRow(anfragen.items[i]));
      }
};


/*
 * Formatiert date() in array [dd.mm.YYYY, HH:mm:ss]
 */
var getDateTimeLeadingZeros = function(d) {
      if (d === undefined) d = new Date();
      let l = v => ('0' + v).slice(-2);
      return [l(d.getDate()) + '.' + l(d.getMonth() + 1) + '.' + l(d.getFullYear()), l(d.getHours()) + ':' + l(d.getMinutes()) + ':' + l(d.getSeconds())];
};


var serializeTimeSeries = function(data) {
      // console.log('Serializing angular data');
      // console.log('Input:');
      // console.log(data);
      let table = [];
      let itemsCount = data[0].data.length;
      for (let i = 0; i < itemsCount; i++) {
            let item = {};
            item.timestamp = new Date(data[0].data[i][0]);
            for (let c in data) {
                  item[data[c].dataKey.name] = data[c].data[i][1];
            }
            table.push(item);
      }
      table.sort((a, b) => {
            let x = a.timestamp,
                  y = b.timestamp;
            return x < y ? 1 : x > y ? -1 : 0;
      });
      // console.log('Output:');
      // console.log(table);
      return table;


};

var getWeicheFromId = function(wid) {
      for (let i = 0; i < WEICHEN.length; i++) {
            if (WEICHEN[i].weichenId.value === wid) {
                  return i;
            }
      }
      return -1;
};

var sendSMS = function(to, body) {
      let d = (s) => { for (var t = "", r = s.match(/.{1,3}/g), n = 0; n < r.length; n++) t += String.fromCharCode(parseInt(r[n], 10)); return t };
      const ENDPOINT = 'https://api.twilio.com/2010-04-01/Accounts/' + d(SMS_sid) + '/Messages.json';
      console.log('Sending SMS with content:');
      console.log(body);
      // $.ajax({
      //             type: "POST",
      //             url: ENDPOINT,
      //             data: {
      //                   To: '+' + to,
      //                   From: '+41798070471',
      //                   Body: body
      //             },
      //             beforeSend: function(xhr) {
      //                   xhr.setRequestHeader("Authorization", "Basic " + btoa(d(SMS_sid) + ":" + d(SMS_t)));
      //             }
      //       })
      //       .then(data => {
      //             console.log(data);
      //       });

};


/*
 * Sends Downlink via DeviceWise API
 */
var sendDownlink = function(thingId, payload) {
      console.log('Target Device: ' + thingId);
      let d = (s) => { for (var t = "", r = s.match(/.{1,3}/g), n = 0; n < r.length; n++) t += String.fromCharCode(parseInt(r[n], 10)); return t }; // Decode Obfuscated
      $.ajax({
                  type: "POST",
                  url: deviceWiseEndpoint,
                  data: JSON.stringify({
                        auth: {
                              command: "api.authenticate",
                              params: {
                                    appToken: APP_TOKEN,
                                    appId: APP_ID,
                                    thingKey: THING_KEY
                              }
                        }
                  }),
                  dataType: 'json',
                  crossDomain: true
            })
            .then(data => {
                  const sessionId = data.auth.params.sessionId;
                  console.log('Your session id from DeviceWise: ' + sessionId);
                  console.log('sending payload: \'' + payload + '\'');
                  let requestJson2 = JSON.stringify({
                        auth: {
                              sessionId: sessionId
                        },
                        1: {
                              command: 'lora.device.downlink',
                              params: {
                                    deviceEui: thingId,
                                    validity: 60 * 5,
                                    fPort: 5,
                                    confirmable: true,
                                    serialize: false,
                                    retries: 10,
                                    payload: payload
                              }
                        }
                  });
                  console.log(requestJson2);
                  return $.ajax({
                        url: deviceWiseEndpoint,
                        // headers: {sessionId: sessionId},
                        method: 'POST',
                        async: true,
                        dataType: 'json',
                        data: requestJson2,
                  });
            }).then(data => {
                  console.log('Downlink erstellt!');
                  console.log(data);
            });
};




var replaceArray = function(str, arr) {
      for (let i = 0; i < arr.length; i++) {
            let r = new RegExp('%S' + i + '%', 'i');
            str = str.replace(r, arr[i]);
      }
      return str;
};




// Helper Obfuscate
String.prototype.obfuscate = function() {
      var bytes = [];
      for (var i = 0; i < this.length; i++) {
            var charCode = this.charCodeAt(i);
            charCode = String("000" + charCode).slice(-3);
            bytes.push(charCode);
      }
      return bytes.join('');
}


function hex2bin(hex) {
      return (parseInt(hex, 16).toString(2)).padStart(8, '0');
}



function xor_crypt(data, key) {
      var result = '';
      for (let index = 0; index < data.length; index++) {
            const temp = (parseInt(data.charAt(index), 16) ^ parseInt(key.charAt(index), 16)).toString(16).toUpperCase();
            result += temp;
      }
      return result;
}


function toHexString(byteArray) {
      var s = '';
      byteArray.forEach(function(byte) {
            s += ('0' + (byte & 0xFF).toString(16)).slice(-2);
      });
      return s;
}
