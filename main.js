/**
 *
 *      ioBroker hs100 Adapter
 *
 *      (c) 2014-2017 arteck <arteck@outlook.com>
 *
 *      MIT License
 *
 */

'use strict';
const utils   = require(__dirname + '/lib/utils'); // Get common adapter utils

var result;
var err;
var ip;
var port;
var psw;
var timer     = null;
var stopTimer = null;
var isStopping = false;


var adapter = new utils.Adapter({
    name: 'fullyBrowser',
    ready: function () {
        main();
    }
});

adapter.on('unload', function () {
    if (timer) {
        clearInterval(timer);
        timer = 0;
    }
    isStopping = true;
});

function stop() {
    if (stopTimer) clearTimeout(stopTimer);

    // Stop only if schedule mode
    if (adapter.common && adapter.common.mode == 'schedule') {
        stopTimer = setTimeout(function () {
            stopTimer = null;
            if (timer) clearInterval(timer);
            isStopping = true;
            adapter.stop();
        }, 30000);
    }
}

var host  = ''; // Name of the PC, where the ping runs

adapter.on('objectChange', function (id, obj) {
    adapter.log.info('objectChange ' + id + ' ' + JSON.stringify(obj));
});

adapter.on('stateChange', function (id, state) {

});

function findAndReplace(object, value, replacevalue) {
    for (var x in object) {
        if (object.hasOwnProperty(x)) {
            if (x === value) {
                object[x] = parseInt(replacevalue);
            }
        }
    }
}


process.on('SIGINT', function () {
    if (timer) clearTimeout(timer);
});


/**
 * Fetches the Fully Browser information and updates the states in ioBroker.
 * Also, it creates all the info states.
 */

function updateDevice(ip,port,psw) {
    var id = ip.replace(/[.\s]+/g, '_');
    var statusURL = 'http://' + ip + ':' + port + '/?cmd=deviceInfo&type=json&password=' + psw;
    var thisRequest = require('request');

    var thisOptions = {
        uri: statusURL,
        method: "GET",
        timeout: 2000,
        followRedirect: false,
        maxRedirects: 0
    };

    thisRequest(thisOptions, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var fullyInfoObject = JSON.parse(body);
            var count = 0;
            for (let lpEntry in fullyInfoObject) {
                let lpType = typeof fullyInfoObject[lpEntry]; // get Type of Variable as String, like string/number/boolean
       //         adapter.createState('', id, lpEntry, {'name':lpEntry, 'type':lpType, 'read':true, 'write':false, 'role':'info'}, {ip: ip}, callback);
                adapter.setForeignState(adapter.namespace + '.' + id + lpEntry, fullyInfoObject[lpEntry], true);

                count++;
            }
        }
        else {
            log('Fully Browser: Folgender Fehler bei http-Request aufgetreten: ' + error, 'warn');
            setState(STATE_PATH + 'Info2.' + 'isFullyAlive', false);
        }
        adapter.setForeignState(adapter.namespace + '.' + id + lastInfoUpdate, Date.now(), true);
    });
}



function createState(ip, callback) {
    var id = ip.replace(/[.\s]+/g, '_');

    adapter.createChannel(id, 'Buttons', 'Buttons', {"name": "Buttons","type": "string", "role": "Group"}, {ip: ip}, callback);

    adapter.createState(id, 'Buttons', 'loadStartURL', {'name':'loadStartURL', 'type':'boolean', 'read':false, 'write':true, 'role':'button'}, {ip: ip}, callback);
    adapter.createState(id, 'Buttons', 'clearCache', {'name':'clearCache', 'type':'boolean', 'read':false, 'write':true, 'role':'button'}, {ip: ip}, callback);
    adapter.createState(id, 'Buttons', 'restartApp', {'name':'restartApp', 'type':'boolean', 'read':false, 'write':true, 'role':'button'}, {ip: ip}, callback);
    adapter.createState(id, 'Buttons', 'exitApp', {'name':'exitApp', 'type':'boolean', 'read':false, 'write':true, 'role':'button'}, {ip: ip}, callback);
    adapter.createState(id, 'Buttons', 'screenOn', {'name':'screenOn', 'type':'boolean', 'read':false, 'write':true, 'role':'button'}, {ip: ip}, callback);
    adapter.createState(id, 'Buttons', 'screenOff', {'name':'screenOff', 'type':'boolean', 'read':false, 'write':true, 'role':'button'}, {ip: ip}, callback);
    adapter.createState(id, 'Buttons', 'forceSleep', {'name':'forceSleep', 'type':'boolean', 'read':false, 'write':true, 'role':'button'}, {ip: ip}, callback);
    adapter.createState(id, 'Buttons', 'triggerMotion', {'name':'triggerMotion', 'type':'boolean', 'read':false, 'write':true, 'role':'button'}, {ip: ip}, callback);
    adapter.createState(id, 'Buttons', 'startScreensaver', {'name':'startScreensaver', 'type':'boolean', 'read':false, 'write':true, 'role':'button'}, {ip: ip}, callback);
    adapter.createState(id, 'Buttons', 'stopScreensaver', {'name':'stopScreensaver', 'type':'boolean', 'read':false, 'write':true, 'role':'button'}, {ip: ip}, callback);
    adapter.createState(id, 'Buttons', 'startDaydream', {'name':'startDaydream', 'type':'boolean', 'read':false, 'write':true, 'role':'button'}, {ip: ip}, callback);
    adapter.createState(id, 'Buttons', 'stopDaydream', {'name':'stopDaydream', 'type':'boolean', 'read':false, 'write':true, 'role':'button'}, {ip: ip}, callback);
    adapter.createState(id, 'Buttons', 'toForeground', {'name':'toForeground', 'type':'boolean', 'read':false, 'write':true, 'role':'button'}, {ip: ip}, callback);
    adapter.createState(id, 'Buttons', 'popFragment', {'name':'popFragment', 'type':'boolean', 'read':false, 'write':true, 'role':'button'}, {ip: ip}, callback);
    adapter.createState(id, 'Buttons', 'enableLockedMode', {'name':'enableLockedMode', 'type':'boolean', 'read':false, 'write':true, 'role':'button'}, {ip: ip}, callback);
    adapter.createState(id, 'Buttons', 'disableLockedMode', {'name':'disableLockedMode', 'type':'boolean', 'read':false, 'write':true, 'role':'button'}, {ip: ip}, callback);

    adapter.createChannel(id, 'Info', 'Info', {"name": "Info","type": "string", "role": "Group"}, {ip: ip}, callback);






    adapter.createState('', id, 'lastInfoUpdate', {'name':'Date/Time of last information update from Fully Browser', 'type':'number', 'read':true, 'write':false, 'role':'value.time'}, {ip: ip}, callback);
    adapter.createState('', id, 'startApplication', {'name':'startApplication', 'type':'string', 'read':true, 'write':true, 'role':'text'}, {ip: ip}, callback);
    adapter.createState('', id, 'loadURL', {'name':'loadURL', 'type':'string', 'read':true, 'write':true, 'role':'text'}, {ip: ip}, callback);
    adapter.createState('', id, 'textToSpeech', {'name':'textToSpeech', 'type':'string', 'read':true, 'write':true, 'role':'text'}, {ip: ip}, callback);
}

function addState(ip, callback) {
    adapter.getObject(host, function (err, obj) {
        createState(ip, callback);
    });
}

function syncConfig(callback) {
    adapter.getStatesOf('', host, function (err, _states) {
        var configToDelete = [];
        var configToAdd    = [];
        var k;
        var id;
        if (adapter.config.devices) {
            for (k = 0; k < adapter.config.devices.length; k++) {
                configToAdd.push(adapter.config.devices[k].ip);
            }
        }

        var tasks = [];

        if (_states) {
            for (var j = 0; j < _states.length; j++) {
                var ip = _states[j].native.ip;
                if (!ip) {
                    adapter.log.warn('No IP address found for ' + JSON.stringify(_states[j]));
                    continue;
                }
                id = ip.replace(/[.\s]+/g, '_');
                var pos = configToAdd.indexOf(ip);
                if (pos != -1) {
                    configToAdd.splice(pos, 1);
                    for (var u = 0; u < adapter.config.devices.length; u++) {
                        if (adapter.config.devices[u].ip == ip) {
                            if (_states[j].common.name !== (adapter.config.devices[u].ip)) {
                                tasks.push({
                                    type: 'extendObject',
                                    id:   _states[j]._id,
                                    data: {common: {name: (adapter.config.devices[u].ip), read: true, write: false}}
                                });
                            } else if (typeof _states[j].common.read !== 'boolean') {
                                tasks.push({
                                    type: 'extendObject',
                                    id:   _states[j]._id,
                                    data: {common: {read: true, write: false}}
                                });
                            }
                        }
                    }
                } else {
                    configToDelete.push(ip);
                }
            }
        }

        if (configToDelete.length) {
            for (var e = 0; e < configToDelete.length; e++) {
                id = configToDelete[e].replace(/[.\s]+/g, '_');
                tasks.push({
                    type: 'deleteState',
                    id:   id
                });
            }
        }

        processTasks(tasks, function () {
            var count = 0;
            if (configToAdd.length) {
                for (var r = 0; r < adapter.config.devices.length; r++) {
                    if (configToAdd.indexOf(adapter.config.devices[r].ip) !== -1) {
                        count++;
                        addState(adapter.config.devices[r].ip, function () {
                            if (!--count && callback) {
                                callback();
                            }
                        });
                    }
                }
            }
            if (!count && callback) callback();
        });
    });
}

function processTasks(tasks, callback) {
    if (!tasks || !tasks.length) {
        callback && callback();
    } else {
        var task = tasks.shift();
        var timeout = setTimeout(function () {
            adapter.log.warn('please update js-controller to at least 1.2.0');
            timeout = null;
            processTasks(tasks, callback);
        }, 1000);

        if (task.type === 'extendObject') {
            adapter.extendObject(task.id, task.data, function (/* err */) {
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = null;
                    setImmediate(processTasks, tasks, callback);
                }
            });
        } else  if (task.type === 'deleteState') {
            adapter.deleteState('', host, task.id, function (/* err */) {
                if (timeout) {
                    clearTimeout(timeout);
                    timeout = null;
                    setImmediate(processTasks, tasks, callback);
                }
            });
        } else {
            adapter.log.error('Unknown task name: ' + JSON.stringify(task));
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
                setImmediate(processTasks, tasks, callback);
            }
        }
    }
}

function getHost(hosts) {
    if (stopTimer) clearTimeout(stopTimer);

    if (!hosts) {
        hosts = [];
        host = [];
        for (var i = 0; i < adapter.config.devices.length; i++) {
            if (adapter.config.devices[i].ip.length > 5) {
                if (adapter.config.devices[i].active) {
                    host.push(adapter.config.devices[i].ip, adapter.config.devices[i].port ,adapter.config.devices[i].psw);
                    hosts.push(host);
                }
            }
        }
    }

    if (!hosts.length) {
        timer = setTimeout(function () {
            getHost();
        }, adapter.config.interval);
        return;
    }

    var fully = hosts.pop();
    updateDevice(fully[0], fully[1], fully[2]);

    if (!isStopping)  {
        setTimeout(function () {
            getHost(hosts);
        }, 0);
    };

}

function main() {
    host = adapter.host;
    adapter.log.debug('Host = ' + host);

    if (!adapter.config.devices.length) {
        adapter.log.info('No one IP configured');
        stop();
        return;
    }

    adapter.config.interval = parseInt(adapter.config.interval, 10);

// polling min 5 sec.
    if (adapter.config.interval < 5000) {
        adapter.config.interval = 5000;
    }

    syncConfig(function () {
        getHost();
    });

    adapter.subscribeStates('*');
}
