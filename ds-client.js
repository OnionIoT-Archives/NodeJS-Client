'use strict';

var https = require('https'),
    events = require('events');

var dsUrl = '',
    listener = new events.EventEmitter();



//================================
//  Initialize
//================================

var init = function (companyCode) {
    dsUrl = companyCode + '.onion.io';
};



//================================
//  Register new device
//================================

var register = function (manufacturerKey, deviceIdentifier, callback) {
    callback = callback || function () {};

    var reqOpts = {
        hostname: dsUrl,
        port: 443,
        path: '/register/' + manufacturerKey + '/' + deviceIdentifier,
        method: 'GET'
    };

    var req = https.request(reqOpts, function (res) {
        var resData = '';
        res.on('data', function (chunk) {
            resData += chunk;
        });

        res.on('end', function () {
            callback(JSON.parse(resData));
        });
    });

    req.end();
};


//================================
//  Declare Features
//================================

var declare = function (deviceKey, metaData, callback) {
    callback = callback || function () {};
    var postData = JSON.stringify(metaData);

    var reqOpts = {
        hostname: dsUrl,
        port: 443,
        path: '/declare/' + deviceKey,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': postData.length
        }
    };

    var req = https.request(reqOpts, function (res) {
        var resData = '';
        res.on('data', function (chunk) {
            resData += chunk;
        });

        res.on('end', function () {
            callback(JSON.parse(resData));
        });
    });

    req.write(postData);
    req.end();
};


//================================
//  Send states
//================================

var states = function (deviceId, statesData, callback) {
    callback = callback || function () {};
    var postData = JSON.stringify(statesData);

    var reqOpts = {
        hostname: dsUrl,
        port: 443,
        path: '/states/' + deviceId,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': postData.length
        }
    };

    var req = https.request(reqOpts, function (res) {
        var resData = '';
        res.on('data', function (chunk) {
            resData += chunk;
        });

        res.on('end', function () {
            callback(JSON.parse(resData));
        });
    });

    req.write(postData);
    req.end();
};



//================================
//  Listen to commands
//================================

var listen = function (deviceKey, callback) {
    callback = callback || function () {};

    var reqOpts = {
        hostname: dsUrl,
        port: 443,
        path: '/register/' + manufacturerKey + '/' + deviceIdentifier,
        method: 'GET'
    };

    var req = https.request(reqOpts, function (res) {
        var resData = '';

        res.on('data', function (chunk) {
            try {
                callback(JSON.parse(resData));
            } catch (err) {
                resData += chunk;
            }
        });
    });

    listener.on('stopListening', function () {
        req.end();
    });
};


//================================
//  Listen to commands
//================================

var stop = function () {
    listener.emit('stopListening');
};


module.exports = {
    init: init,
    register: register,
    declare: declare,
    states: states,
    listen: listen,
    stop: stop
};
