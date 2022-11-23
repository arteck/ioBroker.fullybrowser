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

const utils = require('@iobroker/adapter-core');
const axios = require('axios');
const setStr = 'setStringSetting';
const commandsStr = 'Commands';
const infoStr = 'Info';

let interval = 0;
let timeoutAx = 5000;
let requestTimeout = null;
let devices = [];



class fullybrowserControll extends utils.Adapter {

    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    constructor(options) {
        super({
            ...options,
            name: 'fullybrowser',
        });
        this.on('ready', this.onReady.bind(this));
        this.on('objectChange', this.onObjectChange.bind(this));
        this.on('stateChange', this.onStateChange.bind(this));
        //  this.on('message', this.onMessage.bind(this));
        this.on('unload', this.onUnload.bind(this));
    }

    /**
     * Is called when databases are connected and adapter received configuration.
     */
    async onReady() {
        this.setState('info.connection', false, true);

        await this.initialization();
        await this.create_state();
        this.getInfos();
    }

    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     * @param {() => void} callback
     */
    onUnload(callback) {
        try {
            if (requestTimeout) clearTimeout(requestTimeout);

            this.log.info('cleaned everything up...');
            this.setState('info.connection', false, true);
            callback();
        } catch (e) {
            callback();
        }
    }

    /**
     * Is called if a subscribed object changes
     * @param {string} id
     * @param {ioBroker.Object | null | undefined} obj
     */
    onObjectChange(id, obj) {
        if (obj) {
            // The object was changed
            this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
        } else {
            // The object was deleted
            this.log.info(`object ${id} deleted`);
        }
    }

    /**
     * Is called if a subscribed state changes
     * @param {string} id
     * @param {ioBroker.State | null | undefined} state
     */
    onStateChange(id, state) {

        if (state) {
            this.log.debug(`stateID ${id} changed: ${state.val} (ack = ${state.ack})`);

            // The state was changed
            let tmp = id.split('.');
            let command = tmp.pop();
            let idx = tmp.pop();
            let ip = tmp.pop();

            this.setFullyState(ip, idx, command, state);

        } else {
            // The state was deleted
            this.log.info(`state ${id} deleted`);
        }
    }


    async setFullyState(ip, idx, command, state) {
        var ip = ip.replace(/[_\s]+/g, '.');

        if (state.ack != null) {
            if (state && !state.ack) {

                switch (command) {
                    case 'screenBrightness':
                        var strBrightness = state.val;
                        await this.fullySendCommand(ip, 'setStringSetting&key=screenBrightness&value=' + strBrightness);
                        break;
                    case 'setStringSetting':
                        var txtKey = state.val;
                        if (txtKey.length > 1) {
                            await this.fullySendCommand(ip, command + txtKey);
                        }
                        break;
                    case 'textToSpeech':
                        var txtSp = state.val;
                        //        txtSp = txtSp.replace(/[^a-zA-Z0-9ß]/g,'');  // Just keep letters, numbers, and umlauts
                        txtSp = encodeURIComponent(txtSp.replace(/ +/g, ' ')); // Remove multiple spaces
                        if (txtSp.length > 1) {
                            await this.fullySendCommand(ip, command + '&text=' + txtSp);
                        }
                        break;
                    case 'setAudioVolume':
                        var vol = state.val;
                        await this.fullySendCommand(ip, command + '&level=' + vol + '&stream=3');
                        break;
                    case 'loadURL':
                        let strUrl = state.val;
                        strUrl = strUrl.replace(/ /g, ""); // Remove Spaces

                        let encodeUrl = encodeURIComponent(strUrl);
                        //        if (!strUrl.match(/^https?:\/\//)) strUrl = 'http://' + strUrl; // add http if URL is not starting with "http://" or "https://"

                        if (strUrl.length > 10) {
                            await this.fullySendCommand(ip, command + '&url=' + encodeUrl);
                        }
                        break;

                    case 'startApplication':
                        var strApp = state.val;
                        strApp = strApp.replace(/ /g, ""); // Remove Spaces

                        if (strApp.length > 2) {
                            await this.fullySendCommand(ip, command + '&package=' + strApp);
                        }
                        break;
                    default:
                        if (idx === commandsStr) {
                            await this.fullySendCommand(ip, command);
                        }
                }
            }
        }
    }

    async fullySendCommand(ip, strCommand) {
        const getHost = await this.getHostForSet(ip);
        const l_ip = getHost[0];
        const port = getHost[1];

        const encodePSW = fixedEncodeURIComponent(getHost[2]);
        
        let statusURL = 'http://' + l_ip + ':' + port + '/?cmd=' + strCommand + '&password=' + encodePSW;
        
        this.log.debug('Send ' + statusURL);

        try {
            await axios.get(statusURL);
        } catch (err) {
            this.log.debug('Send error' + statusURL);
        }

    }

    async getHostForSet(ip) {
        var hostSet = [];
        for (var i = 0; i < this.config.devices.length; i++) {
            if (this.config.devices[i].ip.length > 5) {
                if (this.config.devices[i].active) {
                    if (this.config.devices[i].ip === ip) {
                        hostSet.push(this.config.devices[i].ip, this.config.devices[i].port, this.config.devices[i].psw);
                        break;
                    }
                }
            }
        }

        return hostSet;
    }

    async updateDevice(id, device) {

        const ip      = device.ip;
        const tabname = device.tabname;
        const port    = device.port;
   
        const encodePSW = this.fixedEncodeURIComponent(device.psw);

        let statusURL = 'http://' + ip + ':' + port + '/?cmd=deviceInfo&type=json&password=' + encodePSW;
        
        // cre Info
        try {
            let fullyInfoObject = await axios.get(statusURL);

            if (fullyInfoObject.status == 200) {
                for (let lpEntry in fullyInfoObject.data) {
                    if (fullyInfoObject.data[lpEntry] != undefined && fullyInfoObject.data[lpEntry] != null) {
                        let lpType = typeof fullyInfoObject.data[lpEntry]; // get Type of Variable as String, like string/number/boolean
                        if (lpType == 'object') {
                            await this.setState(`${id}.${infoStr}.${lpEntry}`, JSON.stringify(fullyInfoObject.data[lpEntry]), true);
                        } else {
                            await this.setState(`${id}.${infoStr}.${lpEntry}`, fullyInfoObject.data[lpEntry], true);
                        }
                    }
                }
                await this.setState(`${id}.isFullyAlive`, true, true);
            } else {
                await this.setState(`${id}.isFullyAlive`, false, true);
            }
        } catch (err) {
            this.log.warn('updateDeviceERROR ' + ip);
            await this.setState(`${id}.isFullyAlive`, false, true);
        }

        await this.setState(`${id}.lastInfoUpdate`, Number(Date.now()), true);

    }

    async create_state() {
        this.log.debug(`create state`);

        let devices = this.config.devices;
        try {
            for (const k in devices) {

                if (devices[k].active) {
                    this.log.info('Start with IP : ' + devices[k].ip);
                    await this.cre_info(devices[k].ip, devices[k].tabname, devices[k].port, devices[k].psw);
                    await this.cre_command(devices[k].ip);
                }
            }
            this.setState('info.connection', true, true);
        } catch (err) {
            this.log.warn(`create state problem`);
        }
    }

    async cre_info_for_status(ip, tabname, port, psw) {
        const id = ip.replace(/[.\s]+/g, '_');
        const encodePSW = this.fixedEncodeURIComponent(psw);
        let statusURL = 'http://' + ip + ':' + port + '/?cmd=deviceInfo&type=json&password=' + encodePSW;

        await this.extendObjectAsync(`${id}`, {
            type: 'device',
            common: {
                name: tabname || ip,
            },
            native: {},
        });

        await this.extendObjectAsync(`${id}.lastInfoUpdate`, {
            type: 'state',
            common: {
                name: 'Date/Time of last information update from Fully Browser',
                type: 'number',
                role: 'value.time',
                read: true,
                write: false
            },
            native: {
                ip: `${ip}`
            },
        });
        await this.extendObjectAsync(`${id}.isFullyAlive`, {
            type: 'state',
            common: {
                name: 'Is Fully Browser Alive?',
                type: 'boolean',
                read: true,
                write: false,
                role: 'info'
            },
            native: {
                ip: `${ip}`
            },
        });
    }

    async cre_info(ip, tabname, port, psw) {
        this.log.debug(`create info`);
        const id = ip.replace(/[.\s]+/g, '_');
        await this.cre_info_for_status(ip, tabname, port, psw);


        // cre Info
        try {
            let fullyInfoObject = await axios.get(statusURL);

            for (let lpEntry in fullyInfoObject.data) {
                let lpType = typeof fullyInfoObject.data[lpEntry]; // get Type of Variable as String, like string/number/boolean
                
                if (lpEntry == 'status') {
                    await this.deleteDeviceAsync(`${id}`);
                    await this.cre_info_for_status(ip, tabname, port, psw);
                }
                
                await this.extendObjectAsync(`${id}.${infoStr}.${lpEntry}`, {
                    type: 'state',
                    common: {
                        name: lpEntry,
                        type: lpType,
                        read: true,
                        write: false,
                        role: 'value',
                    },
                    native: {},
                });
            }
        } catch (err) {
            this.log.warn('Generate State problem ' + id + '     ' + JSON.stringify(err));
        }
    }

    async cre_command(ip) {

        const commArButton = ['loadStartURL', 'clearCache', 'clearWebstorage', 'clearCookies', 'restartApp', 'exitApp', 'screenOn', 'screenOff', 'forceSleep', 'triggerMotion', 'startScreensaver',
            'stopScreensaver', 'startDaydream', 'stopDaydream', 'toForeground', 'popFragment', 'enableLockedMode', 'disableLockedMode'
        ];

        const commArText = ['startApplication', 'loadURL', 'setAudioVolume', 'textToSpeech', 'setStringSetting'];

        const commArNumber = ['screenBrightness'];

        var id = ip.replace(/[.\s]+/g, '_');

        for (const i in commArButton) {
            await this.extendObjectAsync(`${id}.${commandsStr}.${commArButton[i]}`, {
                type: 'state',
                common: {
                    name: `${commArButton[i]}`,
                    type: 'boolean',
                    role: 'button',
                    def: true,
                    read: true,
                    write: true
                },
                native: {},
            });
            this.subscribeStates(`${id}.${commandsStr}.${commArButton[i]}`);
        }

        for (const i in commArText) {
            await this.extendObjectAsync(`${id}.${commandsStr}.${commArText[i]}`, {
                type: 'state',
                common: {
                    name: `${commArText[i]}`,
                    type: 'string',
                    role: 'text',
                    def: '',
                    read: true,
                    write: true
                },
                native: {},
            });
            this.subscribeStates(`${id}.${commandsStr}.${commArText[i]}`);
        }
        for (const i in commArNumber) {
            await this.extendObjectAsync(`${id}.${commandsStr}.${commArNumber[i]}`, {
                type: 'state',
                common: {
                    name: `${commArNumber[i]}`,
                    type: 'number',
                    role: 'value',
                    def: 100,
                    read: true,
                    write: true
                },
                native: {},
            });

            this.subscribeStates(`${id}.${commandsStr}.${commArNumber[i]}`);
        }
    }

    async initialization() {
        try {
            if (this.config.devices === undefined) {
                this.log.debug(`initialization undefined`);
                callback();
            } else {
                devices = this.config.devices;
            }

            interval = parseInt(this.config.interval * 1000, 10);
            if (interval < 5000) {
                interval = 5000;
            }

            timeoutAx = parseInt(this.config.Timeout, 10);

            if (isNaN(timeoutAx)) {
                axios.defaults.timeout = 5000;   // timeout 5 sec
            } else {
                if (timeoutAx < 1000) {
                    timeoutAx = 2000;
                }
                if (timeoutAx > 10000) {
                    timeoutAx = 5000;
                }

                axios.defaults.timeout = timeoutAx;
            }
            
            this.log.info('timeout is '  + timeoutAx);

        } catch (error) {
            this.log.error('No one IP configured');
        }
    }

    async getInfos() {
        this.log.debug(`get Information`);

        try {
            for (const k in devices) {
                var id = devices[k].ip.replace(/[.\s]+/g, '_');
                if (devices[k].active) {                    
                    await this.updateDevice(id, devices[k]);
                } 
            }

            requestTimeout = setTimeout(() => {
                this.getInfos();
            }, interval);
        } catch (err) {
            this.log.error('getInfosError '  + JSON.stringify(err));
        }
    }
    
    fixedEncodeURIComponent(str) {
        return encodeURIComponent(str).replace(
            /[!'()*]/g,
            (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
        );
    }

}

// @ts-ignore parent is a valid property on module
if (module.parent) {
    // Export the constructor in compact mode
    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    module.exports = (options) => new fullybrowserControll(options);
} else {
    // otherwise start the instance directly
    new fullybrowserControll();
}
