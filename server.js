'use strict';

var events = require('events'),
    fs = require('fs'),
    getmac = require('getmac');

var dsClient = require('./ds-client'),
    config = require('./config.json');

var device,
    app = new events.EventEmitter();


//================================
//  Initialization
//================================

(function () {
    // Initialize the device server client
    dsClient.init(config.companyCode);

    // Attempt to get the Device ID
    var deviceInfoFile = __dirname + '/device.json';
    fs.exists(deviceInfoFile, function (exists) {
        if (exists) {
            device = require('./device.json');
        } else {
            device = {};

            // get the MAC address for the device
            getmac.getMac(function (err, macAddress) {
                if (err) throw err;
                device.macAddress = macAddress;

                // Register this NEW device
                dsClient.register(config.manufacturerKey, device.macAddress, function (data) {
                    if (data.error) throw data.error;
                    else device.deviceKey = data.device_key;
                    
                    // Write the device info into json file
                    fs.writeFile(deviceInfoFile, JSON.stringify(device), function (err) {
                        if (err) throw err;
                    });

                    // Do some real shit!
                    app.emit('initCompleted'); 
                });
            });
        }
    });
})();

//================================
//  Run the client service
//================================

app.on('initCompleted', function () {
    
});
    
