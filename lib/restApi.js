'use strict';
const axios = require('axios');
const fs    = require('node:fs/promises');


/**
 *
 */
class RestApiFully {
    /**
     *
     * @param adapter
     */
    constructor(adapter) {
        this.adapter = adapter;
    }

    /**
     *
     * @param device
     * @param cmd
     * @param val
     */
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
                setBooleanSetting: {urlParameter: '', cleanSpaces: true, encode: false, raw: true},
                setRAW: {urlParameter: '', cleanSpaces: false, encode: false, raw: true},
                takePicture: {urlParameter: 'cmd=getCamshot', cleanSpaces: false, encode: false, raw: true, pic : true},
            };

            let finalUrlParam;
            let pic = false;

            if (cmd in cmds) {
                if (cmds[cmd].pic) {
                    finalUrlParam = cmds[cmd].urlParameter;
                    pic = true;
                } else {
                    if (cmds[cmd].cleanSpaces) {
                        val = val.toString().trim();
                        val = val.replace(/\s+/g, ' ');
                    }
                    if (cmds[cmd].encode) {
                        val = val.toString().trim();
                        val = encodeURIComponent(val);
                    }

                    if (cmds[cmd].raw) {
                        finalUrlParam = `cmd=${  cmd  }${cmds[cmd].urlParameter  }${val}`;
                        if (!cmds[cmd].cleanSpaces && !cmds[cmd].encode) {
                            finalUrlParam = `cmd=${  cmds[cmd].urlParameter  }${val}`;
                        }
                    } else {
                        finalUrlParam = cmds[cmd].urlParameter + val;
                    }
                }
            } else {
                finalUrlParam = `cmd=${  cmd}`;
            }

            return await this.axiosSendCmd(device, cmd, finalUrlParam, pic);
        } catch (e) {
            this.adapter.log.error(`[REST] ${device.name} (${device.ip}): ${this.adapter.err2Str(e)}`);
            return false;
        }
    }

    /**
     *
     * @param device
     * @param cmd
     * @param urlParam
     * @param pic
     */
    async axiosSendCmd(device, cmd, urlParam, pic = false) {
        let url = `${device.restProtocol}://${device.ip}:${device.restPort}/?password=${this.encodePassword(device.restPassword)}&${urlParam}`;

        // Axios config
        const config = {
            method: 'get',
            timeout: this.adapter.config.restTimeout
        };

        if (pic) {
            try {
                if (this.adapter.config.picPath.length < 2) {
                    this.adapter.log.error('Error : Path to pictures is empty');
                    return false;
                } 
                    const pix = `${this.adapter.config.picPath + device.id}.jpg`;
                    const response = await axios.get(url, {responseType: 'arraybuffer', timeout: 10000});
                    if (response.status !== 200) {
                        return false;
                    }
                    await fs.writeFile(pix, response.data, 'binary');

                    if (device.telegramInstance !== undefined && device.telegramInstance !== null) {
                        this.adapter.sendTo(device.telegramInstance, 'send',
                            {
                                type: 'photo',
                                contentType: 'image/jpeg',
                                text: response.data,
                                chatid: device.chatid
                            });
                    }
                    return true;
                
            } catch (err) {
                this.errorFunction(err, device, cmd);
                return false;
            }

        } else {
            url = `${url  }&type=json`;
            try {
                // Axios: Send command
                const response = await axios.get(url, config);

                // Errors
                if (response.status !== 200) {
                    this.adapter.log.error(`[REST] ${device.name} (${device.ip}): Sending command ${cmd} failed: ${response.status} - ${response.statusText}`);
                    return false;
                }

                if (response.data.status.includes('Error')) {
                    if (response.data.statustext === 'Please login') {
                        this.adapter.log.error(`[REST] ${device.name} (${device.ip}): Error: Remote Admin Password seems to be incorrect. Sending command ${cmd} failed.`);
                    } else {
                        this.adapter.log.error(`[REST] ${device.name} (${device.ip}): Error: Sending command ${cmd} failed, received status text: ${response.data.statustext}`);
                    }
                    return false;
                }

                return true;
            } catch (err) {
                this.errorFunction(err, device, cmd);
                return false;
            }
        }
    }

    /**
     *
     * @param err
     * @param device
     * @param cmd
     */
    errorFunction(err, device, cmd) {
        const errTxt = `[REST] ${device.name} (${device.ip}): Sending command ${cmd} failed`;
        if (axios.isAxiosError(err)) {
            if (!err?.response) {
                this.adapter.log.warn(`${errTxt}: No response. Device is Offline or not reachable.`);
            } else if (err.response?.status === 400) {
                this.adapter.log.error(`${errTxt}: Login Failed - Error 400 - ${  err.response?.statusText}`);
            } else if (err.response?.status) {
                this.adapter.log.error(`${errTxt}: ${err.response.status} - ${err.response.statusText}`);
            } else {
                this.adapter.log.error(`${errTxt}: General Error`);
            }
        } else {
            this.adapter.log.error(`${errTxt}: Error: ${this.adapter.err2Str(err)}`);
        }
    }


    /**
     *
     * @param pw
     */
    encodePassword(pw) {
        return encodeURIComponent(pw).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
    }

    /**
     *
     * @param device
     */
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

            if (response.status === 200) {
                if (response.data.status === 'Error') {
                    this.adapter.aliveUpdate(device.id, false);
                    this.adapter.log.error(`[REST] ${device.name} (${device.ip}): deviceInfo request failed - ${response.data.statustext}`);
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
            } else {
                this.adapter.aliveUpdate(device.id, false);
                this.adapter.log.error(`[REST] ${device.name} (${device.ip}): deviceInfo request failed with HTTP ${response.status}`);
            }
        } catch (err) {
            this.adapter.aliveUpdate(device.id, false);
            const cmd = 'axiosGetDevicesInfo';
            this.errorFunction(err, device, cmd);
            return false;
        }
    }

    /**
     *
     */
    async startIntervall() {
        // Initial poll for all REST API devices
        for (const ip in this.adapter.fullysRESTApi) {
            await this.axiosGetDevicesInfo(this.adapter.fullysRESTApi[ip]);
        }

        // Start interval only once
        if (!this.adapter._requestInterval) {
            this.adapter.log.info(`\u{1F680} Start RESTApi request intervall`);
            this.adapter._requestInterval = this.adapter.setInterval(async () => {
                for (const ip in this.adapter.fullysRESTApi) {
                    await this.axiosGetDevicesInfo(this.adapter.fullysRESTApi[ip]);
                }
            }, this.adapter.config.restIntervall);
        }
    }
}

module.exports = RestApiFully;

