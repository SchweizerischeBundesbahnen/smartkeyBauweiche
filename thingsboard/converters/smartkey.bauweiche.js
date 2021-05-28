// Decode an uplink message from a buffer
// payload - array of bytes
// metadata - key/value object

/** Decoder **/

// decode payload to string
var payloadJSON = decodeToJson(payload);

// decode payload to JSON
// var data = decodeToJson(payload);

var deviceName = 'Lora Mock V2';
var deviceType = 'LoraMock';
// use assetName and assetType instead of deviceName and deviceType
// to automatically create assets instead of devices.
// var assetName = 'Asset A';
// var assetType = 'building';

var port = payloadJSON.fullLoraInfo.FPort;
var p = decodePayload(payloadJSON.fullLoraInfo.payload_hex);

// Result object with device/asset attributes/telemetry data
var result = {
    // Use deviceName and deviceType or assetName and assetType, but not both.
    deviceName: deviceName,
    deviceType: deviceType,
    // assetName: assetName,
    // assetType: assetType,
    attributes: {
        model: 'Model A',
        serialNumber: 'SN111',
        integrationName: metadata['integrationName']
    },
    telemetry: {
        weichenId: p.weichenId,
        curPos: p.curPos,
        verriegelung: p.verriegelung

    }
};

result.telemetry['port' + port] = true;


function decodePayload(payload) {
    var result = {};
    result.weichenId = payload.substring(0,4).toUpperCase();
    var pos = hex2bin(payload.substring(4,6));
    result.pos = pos;
    pos = {
        links: parseInt(pos[0],2),
        mitte: parseInt(pos[1],2),
        rechts: parseInt(pos[2],2),
        verriegelung: parseInt(pos[3],2),
        empty1: parseInt(pos[4],2),
    };
    result.curPos = pos.links ? 0 : pos.mitte ? 1 : 2;
    result.verriegelung = pos.verriegelung;
    return result;
}

/** Helper functions **/

function decodeToString(payload) {
    return String.fromCharCode.apply(String, payload);
}

function decodeToJson(payload) {
    // covert payload to string.
    var str = decodeToString(payload);

    // parse string to JSON
    var data = JSON.parse(str);
    return data;
}

function hex2bin(hex) {
    var parts = ['0000' + parseInt(hex.substring(0,1),16).toString(2), '0000' + parseInt(hex.substring(1),16).toString(2)].reverse();
    return [parts[0].substring(parts[0].length-4), parts[1].substring(parts[1].length-4)].join("").split("");
}

return result;