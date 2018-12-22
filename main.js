/**
 *
 *      ioBroker fullyBrowser Adapter
 *
 *      (c) 2014-2018 arteck <arteck@outlook.com>
 *
 *      MIT License
 *
 */

'use strict';
const utils   = require(__dirname + '/lib/utils'); // Get common adapter utils
const request = require('request');

var result;
var err;

var timer     = null;
var stopTimer = null;
var isStopping = false;
var infoStr = 'Info';
var commandsStr = 'Commands';
var setStr = 'setStringSetting';
var host  = ''; // Name of the PC
var allHosts       = [];


var adapter = new utils.Adapter({
    name: 'fullybrowser',
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

adapter.on('objectChange', function (id, obj) {
    adapter.log.info('objectChange ' + id + ' ' + JSON.stringify(obj));
});

adapter.on('stateChange', function (id, state) {
    var comm;
    var dp;
    var ip;
    var tmp  = id.split('.');

    if (tmp.length > 4) {
        dp   = tmp.pop();
        comm = tmp.pop();
    } else {
        dp   = tmp.pop();
    }

    var idx  = tmp.pop();

    ip = idx.replace(/[_\s]+/g, '.');

    if (state.ack != null) {
       if (state && !state.ack) {
    
            switch(dp) {
                case 'setStringSetting':
                    var txtKey = state.val;
                    if (txtKey.length > 1) {
                        fullySendCommand(ip, dp + txtKey);
                    }                    
                    break;
                case 'textToSpeech':
                    var txtSp = state.val;
                    txtSp = txtSp.replace(/[^a-zA-Z0-9ß-ü]/g,'');  // Just keep letters, numbers, and umlauts
                    txtSp = txtSp.replace(/ +/g, ' '); // Remove multiple spaces
                    if (txtSp.length > 1) {
                        fullySendCommand(ip, dp +'&text=' + txtSp);
                    }
                    break;
                case 'loadURL':
                    var strUrl = state.val;
                    strUrl = strUrl.replace(/ /g, ""); // Remove Spaces
                    if (!strUrl.match(/^https?:\/\//)) strUrl = 'http://' + strUrl; // add http if URL is not starting with "http://" or "https://"

                    if (strUrl.length > 10) {
                        fullySendCommand(ip, dp + '&url=' + strUrl);
                    }          
                    break;

                case 'startApplication':
                    var strApp = state.val;
                    strApp = strApp.replace(/ /g, ""); // Remove Spaces

                    if (strApp.length > 2) {
                        fullySendCommand(ip, dp + '&package=' + strApp);
                    }
                    break;
                default:
                    if (comm === commandsStr) {
                        fullySendCommand(ip, dp);
                    }                    
            }
        }
    }
});

function fullySendCommand(ip, strCommand) {
    var getHost = getHostForSet(ip);
    var ip      = getHost[0];
    var port    = getHost[1];
    var psw     = getHost[2];

    var options = {
        url: 'http://' + ip + ':' + port + '/?cmd=' + strCommand + '&password=' + psw
    };

    request(options, function (error, response, body) {
    });
}

process.on('SIGINT', function () {
    if (timer) clearTimeout(timer);
});

function updateDevice(ip,port,psw) {
    var id = ip.replace(/[.\s]+/g, '_');
    var statusURL = 'http://' + ip + ':' + port + '/?cmd=deviceInfo&type=json&password=' + psw;
    var vari = '';

    var thisOptions = {
        uri: statusURL,
        method: "GET",
        timeout: 2000,
        followRedirect: false,
        maxRedirects: 0
    };

    request(thisOptions, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var fullyInfoObject = JSON.parse(body);
            for (let lpEntry in fullyInfoObject) {
                let lpType = typeof fullyInfoObject[lpEntry]; // get Type of Variable as String, like string/number/boolean
                adapter.createState(id, infoStr, lpEntry, {
                    'name': lpEntry,
                    'type': lpType,
                    'read': true,
                    'write': false,
                    'role': 'info'
                });
                vari = adapter.namespace + '.' + id + '.' + infoStr + '.' + lpEntry;
                adapter.setForeignState(vari, fullyInfoObject[lpEntry], true);
            }
            vari = adapter.namespace + '.' + id + '.isFullyAlive';
            adapter.setForeignState(vari, true, true);
        } else {
            vari = adapter.namespace + '.' + id + '.isFullyAlive';
            adapter.setForeignState(vari, false, true);
        }
    });

    vari = adapter.namespace + '.' + id + '.lastInfoUpdate';
    adapter.setForeignState(vari, Date.now(), true);
}

function createState(oneHost, callback) {
    var ip = oneHost[0];
    var port = oneHost[1];
    var psw = oneHost[2];
    var vari = '';
    var id = ip.replace(/[.\s]+/g, '_');
    var statusURL = 'http://' + ip + ':' + port + '/?cmd=deviceInfo&type=json&password=' + psw;

    adapter.createState('', id, 'lastInfoUpdate', {'name':'Date/Time of last information update from Fully Browser', 'type':'number', 'read':true, 'write':false, 'role':'value.time'}, {ip: ip}, callback);
    adapter.createState('', id, 'isFullyAlive', {'name':'Is Fully Browser Alive?', 'type':'boolean', 'read':true, 'write':false, 'role':'info'}, {ip: ip}, callback);

    adapter.createChannel(id, infoStr, infoStr, {"name": "Info","type": "string", "role": "Group"}, {ip: ip}, callback);

    var thisOptions = {
        uri: statusURL,
        method: "GET",
        timeout: 2000,
        followRedirect: false,
        maxRedirects: 0
    };

    request(thisOptions, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var fullyInfoObject = JSON.parse(body);
            for (let lpEntry in fullyInfoObject) {
                let lpType = typeof fullyInfoObject[lpEntry]; // get Type of Variable as String, like string/number/boolean
                adapter.createState(id, infoStr, lpEntry, {
                    'name': lpEntry,
                    'type': lpType,
                    'read': true,
                    'write': false,
                    'role': 'info'
                }, {ip: ip}, callback);
                vari = adapter.namespace + '.' + id + '.' + infoStr + '.' + lpEntry;
                adapter.setForeignState(vari, fullyInfoObject[lpEntry], true);
            }
            vari = adapter.namespace + '.' + id + '.isFullyAlive';
            adapter.setForeignState(vari, true, true);
        } else {
            vari = adapter.namespace + '.' + id + '.isFullyAlive';
            adapter.setForeignState(vari, false, true);
        }
    });


    vari = adapter.namespace + '.' + id + '.lastInfoUpdate';
    adapter.setForeignState(vari, Date.now(), true)

    adapter.createChannel(id, commandsStr, commandsStr, {"name": "Buttons","type": "string", "role": "Group"}, {ip: ip}, callback);
    adapter.createState(id, commandsStr, 'loadStartURL', {'name':'loadStartURL', 'type':'boolean', 'read':false, 'write':true, 'role':'button'}, {ip: ip}, callback);
    adapter.createState(id, commandsStr, 'clearCache', {'name':'clearCache', 'type':'boolean', 'read':false, 'write':true, 'role':'button'}, {ip: ip}, callback);
    adapter.createState(id, commandsStr, 'clearWebstorage', {'name':'clearWebstorage', 'type':'boolean', 'read':false, 'write':true, 'role':'button'}, {ip: ip}, callback);
    adapter.createState(id, commandsStr, 'clearCookies', {'name':'clearCookies', 'type':'boolean', 'read':false, 'write':true, 'role':'button'}, {ip: ip}, callback);
    adapter.createState(id, commandsStr, 'restartApp', {'name':'restartApp', 'type':'boolean', 'read':false, 'write':true, 'role':'button'}, {ip: ip}, callback);
    adapter.createState(id, commandsStr, 'exitApp', {'name':'exitApp', 'type':'boolean', 'read':false, 'write':true, 'role':'button'}, {ip: ip}, callback);
    adapter.createState(id, commandsStr, 'screenOn', {'name':'screenOn', 'type':'boolean', 'read':false, 'write':true, 'role':'button'}, {ip: ip}, callback);
    adapter.createState(id, commandsStr, 'screenOff', {'name':'screenOff', 'type':'boolean', 'read':false, 'write':true, 'role':'button'}, {ip: ip}, callback);
    adapter.createState(id, commandsStr, 'forceSleep', {'name':'forceSleep', 'type':'boolean', 'read':false, 'write':true, 'role':'button'}, {ip: ip}, callback);
    adapter.createState(id, commandsStr, 'triggerMotion', {'name':'triggerMotion', 'type':'boolean', 'read':false, 'write':true, 'role':'button'}, {ip: ip}, callback);
    adapter.createState(id, commandsStr, 'startScreensaver', {'name':'startScreensaver', 'type':'boolean', 'read':false, 'write':true, 'role':'button'}, {ip: ip}, callback);
    adapter.createState(id, commandsStr, 'stopScreensaver', {'name':'stopScreensaver', 'type':'boolean', 'read':false, 'write':true, 'role':'button'}, {ip: ip}, callback);
    adapter.createState(id, commandsStr, 'startDaydream', {'name':'startDaydream', 'type':'boolean', 'read':false, 'write':true, 'role':'button'}, {ip: ip}, callback);
    adapter.createState(id, commandsStr, 'stopDaydream', {'name':'stopDaydream', 'type':'boolean', 'read':false, 'write':true, 'role':'button'}, {ip: ip}, callback);
    adapter.createState(id, commandsStr, 'toForeground', {'name':'toForeground', 'type':'boolean', 'read':false, 'write':true, 'role':'button'}, {ip: ip}, callback);
    adapter.createState(id, commandsStr, 'popFragment', {'name':'popFragment', 'type':'boolean', 'read':false, 'write':true, 'role':'button'}, {ip: ip}, callback);
    adapter.createState(id, commandsStr, 'enableLockedMode', {'name':'enableLockedMode', 'type':'boolean', 'read':false, 'write':true, 'role':'button'}, {ip: ip}, callback);
    adapter.createState(id, commandsStr, 'disableLockedMode', {'name':'disableLockedMode', 'type':'boolean', 'read':false, 'write':true, 'role':'button'}, {ip: ip}, callback);
    adapter.createState(id, commandsStr, 'startApplication', {'name':'startApplication', 'type':'string', 'read':true, 'write':true, 'role':'text'}, {ip: ip}, callback);
    adapter.createState(id, commandsStr, 'loadURL', {'name':'loadURL', 'type':'string', 'read':true, 'write':true, 'role':'text'}, {ip: ip}, callback);
  
    adapter.createState(id, commandsStr, 'textToSpeech', {'name':'textToSpeech', 'type':'string', 'read':true, 'write':true, 'role':'text'}, {ip: ip}, callback);
    adapter.createState(id, commandsStr, 'setStringSetting', {'name':'setStringSetting', 'type':'string', 'read':true, 'write':true, 'role':'text'}, {ip: ip}, callback);
}

function addState(oneHost, callback) {
    adapter.getObject(host, function (err, obj) {
        createState(oneHost, callback);
    });
}

function syncConfig(callback) {
    adapter.getStatesOf('', host, function (err, _states) {
        var configToDelete = [];
        var configToAdd    = [];
        allHosts = [];

        var k;
        var id;
        if (adapter.config.devices) {
            for (k = 0; k < adapter.config.devices.length; k++) {
                var oneHost = [];
                oneHost.push(adapter.config.devices[k].ip, adapter.config.devices[k].port, adapter.config.devices[k].psw);
                allHosts.push(oneHost);
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
                        var oneHost = allHosts[r]; 
                        addState(oneHost, function () {
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

function getHostForSet(ip) {
    var hostSet = [];
    for (var i = 0; i < adapter.config.devices.length; i++) {
        if (adapter.config.devices[i].ip.length > 5) {
            if (adapter.config.devices[i].active) {
                if (adapter.config.devices[i].ip === ip) {
                    hostSet.push(adapter.config.devices[i].ip, adapter.config.devices[i].port, adapter.config.devices[i].psw);
                    break;
                }
            }
        }
    }

    return hostSet;
}

function getHost(hosts) {
    var oneHost;
    
    if (stopTimer) clearTimeout(stopTimer);

    if (!hosts) {
        hosts = [];
        
        for (var i = 0; i < adapter.config.devices.length; i++) {
            oneHost = [];
            if (adapter.config.devices[i].ip.length > 5) {
                if (adapter.config.devices[i].active) {
                    oneHost.push(adapter.config.devices[i].ip, adapter.config.devices[i].port, adapter.config.devices[i].psw);
                    hosts.push(oneHost);
                }
            }
        }
    }

    if (hosts.length === 0) {
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
