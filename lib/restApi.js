'use strict';
const import_axios = require('axios');


class RestApiFully {
  constructor(adapter) {
    this.adapter = adapter;
  }
  async sendCmd(device, cmd, val) {
    try {
      const cmds = {
        textToSpeech: { urlParameter: "cmd=textToSpeech&text=", cleanSpaces: true, encode: true },
        loadURL: { urlParameter: "cmd=loadURL&url=", cleanSpaces: true, encode: true },
        startApplication: { urlParameter: "cmd=startApplication&package=", cleanSpaces: true },
        screenBrightness: { urlParameter: "cmd=setStringSetting&key=screenBrightness&value=" },
        setAudioVolume: { urlParameter: "cmd=setAudioVolume&stream=3&level=" }
      };
      let finalUrlParam = "";
      if (cmd in cmds) {
        if (cmds[cmd].cleanSpaces) {
          val = val.toString().trim();
          val = val.replace(/\s+/g, " ");
        }
        if (cmds[cmd].encode) {
          val = val.toString().trim();
          val = encodeURIComponent(val);
        }
        finalUrlParam = cmds[cmd].urlParameter + val;
      } else {
        finalUrlParam = "cmd=" + cmd;
      }
      const result = await this.axiosSendCmd(device, cmd, finalUrlParam);
      return result;
    } catch (e) {
      this.adapter.log.error(`[REST] ${device.name}: ${this.adapter.err2Str(e)}`);
      return false;
    }
  }
  async axiosSendCmd(device, cmd, urlParam) {
    var _a, _b, _c;
    const url = `${device.restProtocol}://${device.ip}:${device.restPort}/?password=${this.encodePassword(device.restPassword)}&type=json&${urlParam}`;
    const config = {
      method: "get",
      timeout: this.adapter.config.restTimeout
    };
    try {
      let urlHiddenPassword = url;
      urlHiddenPassword = urlHiddenPassword.replace(/password=.*&type/g, "password=(hidden)&type");
      this.adapter.log.debug(`[REST] ${device.name}: Start sending command ${cmd}, URL: ${urlHiddenPassword}`);
      const response = await import_axios.default.get(url, config);
      if (response.status !== 200) {
        this.adapter.log.error(`[REST] ${device.name}: Sending command ${cmd} failed: ${response.status} - ${response.statusText}`);
        return false;
      }
      if (!("status" in response)) {
        this.adapter.log.error(`[REST] ${device.name}: Sending command ${cmd} failed: Response received but it does not have key 'status'`);
        return false;
      }
      if (!("data" in response)) {
        this.adapter.log.error(`[REST] ${device.name}: Sending command ${cmd} failed: Response received but it does not have key 'data'`);
        return false;
      }
      this.adapter.log.debug(`[REST] ${device.name}: Sending command ${cmd} response.data: ${JSON.stringify(response.data)}`);
      if (!("status" in response.data)) {
        this.adapter.log.error(`[REST] ${device.name}: Sending command ${cmd} failed: Response received but response.data does not have key 'status'`);
        return false;
      }
      switch (response.data.status) {
        case "OK":
          this.adapter.log.debug(`[REST] ${device.name}: Sending command ${cmd} successful: - Status = "${response.data.status}", Message = "${response.data.statustext}"`);
          return true;
        case "Error":
          if (response.data.statustext === "Please login") {
            this.adapter.log.error(`[REST] ${device.name}: Error: Remote Admin Password seems to be incorrect. Sending command ${cmd} failed.`);
          } else {
            this.adapter.log.error(`[REST] ${device.name}: Error: Sending command ${cmd} failed, received status text: ${response.data.statustext}`);
          }
          return false;
        default:
          this.adapter.log.error(`[REST] ${device.name}: Undefined response.data.status = "${response.data.status}" when sending command ${cmd}: ${response.status} - ${response.statusText}`);
          return false;
      }
    } catch (err) {
      const errTxt = `[REST] ${device.name}: Sending command ${cmd} failed`;
      if (import_axios.default.isAxiosError(err)) {
        if (!(err == null ? void 0 : err.response)) {
          this.adapter.log.warn(`${errTxt}: No response`);
        } else if (((_a = err.response) == null ? void 0 : _a.status) === 400) {
          this.adapter.log.error("${errTxt}: Login Failed - Error 400 - " + ((_b = err.response) == null ? void 0 : _b.statusText));
        } else if ((_c = err.response) == null ? void 0 : _c.status) {
          this.adapter.log.error(`${errTxt}: ${err.response.status} - ${err.response.statusText}`);
        } else {
          this.adapter.log.error(`${errTxt}: General Error`);
        }
      } else {
        this.adapter.log.error(`${errTxt}: Error: ${this.adapter.err2Str(err)}`);
      }
      return false;
    }
  }
  encodePassword(pw) {
    return encodeURIComponent(pw).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
  }
}

module.exports = RestApiFully;

