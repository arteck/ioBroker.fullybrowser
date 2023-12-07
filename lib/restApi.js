'use strict';
const axios = require('axios');


class RestApiFully {
    constructor(adapter) {
        this.adapter = adapter;
    }

    async sendCmd(device, cmd, val) {
        try {
            const cmds = {
                textToSpeech: {urlParameter: 'cmd=textToSpeech&text=', cleanSpaces: true, encode: true},
                loadURL: {urlParameter: 'cmd=loadURL&url=', cleanSpaces: true, encode: true},
                startApplication: {urlParameter: 'cmd=startApplication&package=', cleanSpaces: true},
                screenBrightness: {urlParameter: 'cmd=setStringSetting&key=screenBrightness&value='},
                setAudioVolume: {urlParameter: 'cmd=setAudioVolume&stream=3&level='},
                motionDetection: {urlParameter: 'cmd=setBooleanSetting&key=motionDetection&value='},
                setStringSetting: {urlParameter: '', cleanSpaces: true, encode: false, raw: true},
                setRAW: {urlParameter: '', cleanSpaces: false, encode: false, raw: true},
            };

            let finalUrlParam = '';

            if (cmd in cmds) {
                if (cmds[cmd].cleanSpaces) {
                    val = val.toString().trim();
                    val = val.replace(/\s+/g, ' ');
                }
                if (cmds[cmd].encode) {
                    val = val.toString().trim();
                    val = encodeURIComponent(val);
                }

                if (cmds[cmd].raw) {
                    finalUrlParam = 'cmd=setStringSetting' + cmds[cmd].urlParameter + val;
                    if (!cmds[cmd].cleanSpaces && !cmds[cmd].encode) {
                        finalUrlParam = 'cmd=' + cmds[cmd].urlParameter + val;
                    }
                } else {
                    finalUrlParam = cmds[cmd].urlParameter + val;


                }
            } else {
                finalUrlParam = 'cmd=' + cmd;
            }

            const result = await this.axiosSendCmd(device, cmd, finalUrlParam);
            return result;
        } catch (e) {
            this.adapter.log.error(`[REST] ${device.name}: ${this.adapter.err2Str(e)}`);
            return false;
        }
    }

    async axiosSendCmd(device, cmd, urlParam) {
        const url = `${device.restProtocol}://${device.ip}:${device.restPort}/?password=${this.encodePassword(device.restPassword)}&${urlParam}&type=json`;

        // Axios config
        const config = {
            method: 'get',
            timeout: this.adapter.config.restTimeout,
        };

        try {
            // Axios: Send command
            const response = await axios.get(url, config);

            // Errors
            if (response.status !== 200) {
                this.adapter.log.error(`[REST] ${device.name}: Sending command ${cmd} failed: ${response.status} - ${response.statusText}`);
                return false;
            }

            if (response.data.status.includes('Error')) {
                if (response.data.statustext == 'Please login') {
                    this.adapter.log.error(`[REST] ${device.name}: Error: Remote Admin Password seems to be incorrect. Sending command ${cmd} failed.`);
                } else {
                    this.adapter.log.error(`[REST] ${device.name}: Error: Sending command ${cmd} failed, received status text: ${response.data.statustext}`);
                }
                return false;
            }

            return true;
        } catch (err) {
            this.errorFunction(err,device, cmd);
            return false;
        }
    }

    errorFunction(err,device, cmd) {
        const errTxt = `[REST] ${device.name}: Sending command ${cmd} failed`;
        if (axios.isAxiosError(err)) {
            if (!err?.response) {
                this.adapter.log.warn(`${errTxt}: No response`);
            } else if (err.response?.status === 400) {
                this.adapter.log.error('${errTxt}: Login Failed - Error 400 - ' + err.response?.statusText);
            } else if (err.response?.status) {
                this.adapter.log.error(`${errTxt}: ${err.response.status} - ${err.response.statusText}`);
            } else {
                this.adapter.log.error(`${errTxt}: General Error`);
            }
        } else {
            this.adapter.log.error(`${errTxt}: Error: ${this.adapter.err2Str(err)}`);
        }
    }


    encodePassword(pw) {
        return encodeURIComponent(pw).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
    }

    async axiosGetDevicesInfo(device) {

        const url = `${device.restProtocol}://${device.ip}:${device.restPort}/?cmd=deviceInfo&type=json&password=${this.encodePassword(device.restPassword)}`;

        // Axios config
        const config = {
            method: 'get',
            timeout: this.adapter.config.restTimeout,
        };

        try {
            // Axios: get infos
            const response = await axios.get(url, config);

            if (response.status == 200)  {
                if (response.data.status == 'Error') {
                    this.adapter.aliveUpdate(device.id,false);
                    const cmd = 'first Login ';
                    this.errorFunction(response.data.statustext,device, cmd);
                } else {
                    const result = {
                        clientId: 9999,
                        ip: device.ip,
                        topic: 'fake',
                        infoObj: response.data
                    };
                    this.adapter.onMqttInfo(result);
                    await this.adapter.setStateAsync('info.connection', {val: true, ack: true});
                }
            }
        } catch (err) {
            this.adapter.aliveUpdate(device.id,false);
            const cmd = 'get axiosGetDevicesInfo ';
            this.errorFunction(err,device, cmd);
            return false;
        }
    }

    async startIntervall()  {
        for (const ip in this.adapter.fullysRESTApi) {
            await this.axiosGetDevicesInfo(this.adapter.fullysRESTApi[ip]);
        }

        if (!this.adapter._requestInterval) {
            this.adapter.log.info(`\u{1F680} Start RESTApi request intervall`);
            this.adapter._requestInterval = setInterval(async () => {
                await this.startIntervall();
            }, this.adapter.config.restIntervall);
        }
    }
}

module.exports = RestApiFully;

