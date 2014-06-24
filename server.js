'use strict';

var events = require('events'),
    fs = require('fs'),
    dgram = require('dgram'),
    getmac = require('getmac');

var dsClient = require('./ds-client'),
    config = require('./config.json');

var device,
    app = new events.EventEmitter();


//================================
//  Register a few functions
//================================

var functions = {
    'on': function () {
        console.log('turning on');

        var message = new Buffer('108102d305ff010022016001800130', 'hex');
        var client = dgram.createSocket('udp4');
        client.send(message, 0, message.length, 3610, '192.168.1.131', function (err, bytes) {
            if (err) throw err;
            client.close();
        });
    },
    'off': function () {
        console.log('turning off');

        var message = new Buffer('108102d505ff010022016001800131', 'hex');
        var client = dgram.createSocket('udp4');        
        client.send(message, 0, message.length, 3610, '192.168.1.131', function (err, bytes) {
            if (err) throw err;
            client.close();
        });
    },
    'switch': function (params) {
        if (params.state) console.log('turning ' + params.state);
    }
};




//================================
//  Run the client service
//================================

app.on('initCompleted', function () {
    dsClient.addFunctions(functions);

    // Start Listening to commands 
    dsClient.listen(device.deviceKey, function () {
        console.log('Listening to requests...');
    });
});



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
            app.emit('initCompleted');
        } else {
            device = {};

            // get the MAC address for the device
            getmac.getMac(function (err, macAddress) {
                if (err) throw err;
                device.macAddress = macAddress.replace(/:/g, '-');

                // Register this NEW device
                dsClient.register(config.manufacturerKey, device.macAddress, function (deviceKey) {
                    device.deviceKey = deviceKey;
                    
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
   
