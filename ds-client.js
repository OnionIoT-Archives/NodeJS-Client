'use strict';

var https = require('http'),
    events = require('events'),
    _ = require('underscore');

var dsUrl = '',
    listener = new events.EventEmitter(),
    port = 80,
    registeredFunctions = {};



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
        port: port,
        path: '/ds/v1/register/' + manufacturerKey + '/' + deviceIdentifier,
        method: 'GET'
    };

    var req = https.request(reqOpts, function (res) {
        var resData = '';
        res.on('data', function (chunk) {
            resData += chunk;
        });

        res.on('end', function () {
            var returnData = JSON.parse(resData);
            if (returnData.error) throw returnData.error;
            else callback(returnData.device_key);
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
        port: port,
        path: '/ds/v1/declare/' + deviceKey,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    var req = https.request(reqOpts, function (res) {
        //var resData = '';
        //res.on('data', function (chunk) {
        //    resData += chunk;
        //});

        //res.on('end', function () {
        //    callback(JSON.parse(resData));
        //});
    });

    req.write(postData);
    req.end();
};



//================================
//  Register New functions
//================================

var addFunctions = function (functions, callback) {
    // addFunctions('name', function () {}, callback);
    if (_.isString(functions) && _.isFunction(callback)) {
        callback = arguments[2] || function () {};
        registeredFunctions[functions] = callback;

    // addFunctions({name1: function () {}, name2: function () {}}, callback);
    } else if (_.isObject(functions)) {
        callback = callback || function () {};
        for (var fn in functions) {
            if (_.isFunction(functions[fn])) registeredFunctions[fn] = functions[fn];
        }
    }
    
    callback();
};



//================================
//  Remove registered functions
//================================

var rmFunctions = function (functions, callback) {
    callback = callback || function () {};

    // If string
    if (_.isString(functions)) {
        delete registeredFunctions[functions];

    // If array
    } else if (_.isArray(functions)) {
        for (var fn in functions) {
            // If array of strings
            if (_.isString(functions[fn])) {
                delete registeredFunctions[functions[fn]];

            // If array of functions
            } else if (_.isFunction(functions[fn])) {
                for (var regFn in registeredFunctions) {
                    if (registeredFunctions[regFn].toString() === functions[fn].toString()) {
                        delete registeredFunctions[regFn];
                        break;
                    }
                }
            }
        }
    } else if (_.isObject(functions)) {
        for (var fn in functions) {
            delete registeredFunctions[fn];
        }
    }

    callback();
};



//================================
//  Send states
//================================

var states = function (deviceId, statesData, callback) {
    callback = callback || function () {};
    var postData = JSON.stringify(statesData);

    var reqOpts = {
        hostname: dsUrl,
        port: port,
        path: '/ds/v1/states/' + deviceId,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    var req = https.request(reqOpts, function (res) {
        //var resData = '';
        //res.on('data', function (chunk) {
        //    resData += chunk;
        //});

        //res.on('end', function () {
        //    callback(JSON.parse(resData));
        //});
    });

    req.write(postData);
    req.end();
};



//================================
//  Listen to commands
//================================

var listen = function (deviceKey, callback) {
    callback = callback || function () {};

    var resHandler;

    var reqOpts = {
        hostname: dsUrl,
        port: port,
        path: '/ds/v1/listen/' + deviceKey,
        method: 'GET'
    };

    var req = https.request(reqOpts, function (res) {
        var resHandler = res;

        var resData = '',
            commandData;

        res.on('data', function (chunk) {
            resData += chunk;

            try {
                commandData = JSON.parse(resData);
                resData = '';
                
                if (!commandData.error) {
                    // Run the actual function!
                    if (commandData.function_id && registeredFunctions[commandData.function_id]) {
                        registeredFunctions[commandData.function_id](commandData.params);
                    } 
                } else {
                    throw commandData.error;
                }
            } catch (err) {
                resData += chunk;
            }
        });
    });

    req.end();
    callback();

    listener.on('stopListening', function () {
        resHandler.end();
    });
};


//================================
//  Stop listening to commands
//================================

var stop = function () {
    listener.emit('stopListening');
};



//================================
//  Export
//================================

module.exports = {
    init: init,
    register: register,
    addFunctions: addFunctions,
    rmFunctions: rmFunctions,
    declare: declare,
    states: states,
    listen: listen,
    stop: stop
};
