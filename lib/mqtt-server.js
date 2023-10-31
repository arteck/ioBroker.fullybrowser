'use strict';

const Aedes = require("aedes");
const net =  require("net");

class MqttServer {
  constructor(adapter) {
    this.port = -1;
    this.notAuthorizedClients = [];
    this.adapter = adapter;
    this.aedes = new Aedes();
    this.server = net.createServer(this.aedes.handle);

    this.devices = {}; // key = MQTT Client ID, property: IMqttDevice
  }
  start() {
    try {
      this.port = this.adapter.config.mqttPort;

      this.server.listen(this.port, () => {
        this.adapter.log.info(`\u{1F680} MQTT Server started and is listening on port ${this.port}.`);
      });

      this.aedes.authenticate = (client, username, password, callback) => {
        try {
          if (this.notAuthorizedClients.includes(client.id)) {
            callback(null, false);
            return;
          }

          // Create device entry with id as key, if not yet existing
          if (!this.devices[client.id]) this.devices[client.id] = {};

          /**
           * Get IP
           * This rather complicated way is needed, see https://github.com/moscajs/aedes/issues/186
           * Not sure if this always works, but client.req was undefined in my test - which is suggested in https://github.com/moscajs/aedes/issues/527
           */
          let ip = undefined;

          if (client.conn && "remoteAddress" in client.conn && typeof client.conn.remoteAddress === "string") {
            const ipSource = client.conn.remoteAddress; // like: ::ffff:192.168.1.213
            this.adapter.log.debug(`[MQTT] client.conn.remoteAddress = "${ipSource}" - ${client.id}`);

            ip = ipSource.substring(ipSource.lastIndexOf(":") + 1);

            if (!this.adapter.isIpAddressValid(ip))
              ip = undefined;
          }

          if (ip && !Object.keys(this.adapter.fullysMQTT).includes(ip)) {
            this.adapter.log.error(`[MQTT] Client ${client.id} not authorized: ${ip} is not an active Fully device IP per adapter settings.`);
            this.notAuthorizedClients.push(client.id);
            callback(null, false);
            return;
          }

          const ipMsg = ip ? `${this.adapter.fullysMQTT[ip].name} (${ip})` : `${client.id} (IP unknown)`;
          this.adapter.log.debug(`[MQTT] Client ${ipMsg} trys to authenticate...`);

          if (ip) this.devices[client.id].ip = ip;

          if (!this.adapter.config.mqttDoNotVerifyUserPw) {
            if (username !== this.adapter.config.mqttUser) {
              this.adapter.log.warn(`MQTT Client ${ipMsg} Authorization rejected: received user name '${username}' does not match '${this.adapter.config.mqttUser}' in adapter settings.`);
              callback(null, false);
              return;
            }
            if (password.toString() !== this.adapter.config.mqttPassword) {
              this.adapter.log.warn(`MQTT Client ${ipMsg} Authorization rejected: received password does not match with password in adapter settings.`);
              callback(null, false);
              return;
            }
          }

          this.adapter.log.info(`\u{1F511} MQTT Client ${ipMsg} successfully authenticated.`);
          callback(null, true);
        } catch (e) {
          this.adapter.log.error(this.adapter.err2Str(e));
          callback(null, false);
        }
      };

      this.aedes.on("client", (client) => {
        try {
          if (!client)
            return;

          if (!this.devices[client.id])
            this.devices[client.id] = {};

          const ip = this.devices[client.id].ip;
          const ipMsg = ip ? `${this.adapter.fullysMQTT[ip].name} (${ip})` : `${client.id} (IP unknown)`;
          this.adapter.log.debug(`[MQTT] Client ${ipMsg} connected to broker ${this.aedes.id}`);
          this.adapter.log.info(`\u{1F517} MQTT Client ${ipMsg} successfully connected.`);
          this.setIsAlive(client.id, true, "client connected");
          this.scheduleCheckIfStillActive(client.id);
        } catch (e) {
          this.adapter.log.error(this.adapter.err2Str(e));
          return;
        }
      });

      this.aedes.on("publish", (packet, client) => {
        try {
          if (!client || !packet)
            return;

          this.setIsAlive(client.id, true, "client published message");
          if (!this.devices[client.id])
            this.devices[client.id] = {};
          if (packet.qos !== 1)
            return;
          if (packet.retain) {
            const info = JSON.parse(packet.payload.toString());
            if (!("startUrl" in info) && !("ip4" in info)) {
              this.adapter.log.error(`[MQTT] Packet rejected: ${info.ip4} - Info packet expected, but ip4 and startUrl is not defined in packet. ${info.deviceId}`);
              return;
            }
            const ip = info.ip4;
            const devMsg = `${this.adapter.fullysMQTT[ip].name} (${ip})`;
            if (!Object.keys(this.adapter.fullysMQTT).includes(ip)) {
              this.adapter.log.error(`[MQTT] Client ${devMsg} Packet rejected: IP is not allowed per adapter settings. ${client.id}`);
              return;
            }
            this.devices[client.id].ip = ip;

            const prevTime = this.devices[client.id].previousInfoPublishTime;
            const limit = this.adapter.config.mqttPublishedInfoDelay * 1000; // milliseconds
            if (prevTime && prevTime !== 0) {
              if (Date.now() - prevTime < limit) {
                const diffMs = Date.now() - prevTime;
                this.adapter.log.silly(`[MQTT] ${devMsg} Packet rejected: Last packet came in ${diffMs}ms (${Math.round(diffMs / 1000)}s) ago...`);
                return;
              }
            }
            this.devices[client.id].previousInfoPublishTime = Date.now();
            if (!this.devices[client.id].mqttFirstReceived) {
              this.adapter.log.debug(`[MQTT] Client ${client.id} = ${this.adapter.fullysMQTT[ip].name} = ${ip}`);
              this.devices[client.id].mqttFirstReceived = true;
            }
            const result = {
              clientId: client.id,
              ip: ip,
              topic: packet.topic,
              infoObj: info
            };

            this.adapter.onMqttInfo(result);

          } else if (packet.qos === 1 && !packet.retain) {
            /**
             * Event coming in...
             * Per fully documentation: Events will be published as fully/event/[eventId]/[deviceId] topic (non-retaining, QOS=1).
             */
                // {"deviceId":"xxxxxxxx-xxxxxxxx","event":"screenOn"}
                // NOTE: Device ID is different to client id, we actually disregard deviceId
            const msg = JSON.parse(packet.payload.toString());

            if (!("event" in msg)) {
              this.adapter.log.error(`[MQTT] Packet rejected: Event packet expected, but event is not defined in packet. ${client.id}`);
              return;
            }
            if (msg.event === "mqttConnected") {
              this.adapter.log.silly(`[MQTT] Client Publish Event: Disregard mqttConnected event - ${msg.deviceId}`);
              return;
            }
            if (!this.devices[client.id]) {
              this.adapter.log.info(`[MQTT] Client Publish Event: Device ID and according IP not yet seen thru "Publish Info"`);
              this.adapter.log.info(`[MQTT] We wait until first info is published. ${msg.deviceId}`);
              return;
            }
            const ip = this.devices[client.id].ip ? this.devices[client.id].ip : "";
            if (ip === "" || typeof ip !== "string") {
              this.adapter.log.debug(`[MQTT] Client Publish Event: IP address could not be determined. - Client ID: ${client.id}`);
              this.adapter.log.debug(`[MQTT] Please be patient until first MQTT info packet coming in (takes up to 1 minute)`);
              return;
            }
            const result = {
              clientId: client.id,
              ip,
              topic: packet.topic,
              cmd: msg.event
            };
            if (!this.devices[client.id].mqttFirstReceived) {
              this.adapter.log.info(`[MQTT] \u{1F517} Client ${client.id} = ${this.adapter.fullysMQTT[ip].name} (${ip})`);
              this.devices[client.id].mqttFirstReceived = true;
            }
            this.adapter.onMqttEvent(result);
          } else {
            return;
          }
        } catch (e) {
          this.adapter.log.error(this.adapter.err2Str(e));
          return;
        }
      });
      this.aedes.on("clientDisconnect", (client) => {
        const ip = this.devices[client.id].ip;
        const logMsgName = ip ? this.adapter.fullysMQTT[ip].name : client.id;
        if (this.adapter.config.mqttConnErrorsAsInfo) {
          this.adapter.log.info(`MQTT Client ${logMsgName} disconnected.`);
        } else {
          this.adapter.log.error(`[MQTT] Client ${logMsgName} disconnected.`);
        }
        this.setIsAlive(client.id, false, "client disconnected");
      });
      this.aedes.on("clientError", (client, e) => {
        if (this.notAuthorizedClients.includes(client.id))
          return;
        const ip = this.devices[client.id].ip;
        const logMsgName = ip ? this.adapter.fullysMQTT[ip].name : client.id;
        if (this.adapter.config.mqttConnErrorsAsInfo) {
          this.adapter.log.info(`[MQTT] ${logMsgName}: Client error - ${e.message}`);
        } else {
          this.adapter.log.error(`[MQTT]\u{1F525} ${logMsgName}: Client error - ${e.message}`);
        }
        this.adapter.log.debug(`[MQTT]\u{1F525} ${logMsgName}: Client error - stack: ${e.stack}`);
        this.setIsAlive(client.id, false, "client error");
      });
      this.aedes.on("connectionError", (client, e) => {
        const ip = this.devices[client.id].ip;
        const logMsgName = ip ? this.adapter.fullysMQTT[ip].name : client.id;
        if (this.adapter.config.mqttConnErrorsAsInfo) {
          this.adapter.log.info(`[MQTT] ${logMsgName}: Connection error - ${e.message}`);
        } else {
          this.adapter.log.error(`[MQTT]\u{1F525} ${logMsgName}: Connection error - ${e.message}`);
        }
        this.adapter.log.debug(`[MQTT]\u{1F525} ${logMsgName}: Connection error - stack: ${e.stack}`);
        this.setIsAlive(client.id, false, "connection error");
      });
      this.server.on("error", (e) => {
        if (e instanceof Error && e.message.startsWith("listen EADDRINUSE")) {
          this.adapter.log.debug(`[MQTT] Cannot start server - ${e.message}`);
          this.adapter.log.error(`[MQTT]\u{1F525} Cannot start server - Port ${this.port} is already in use. Try a different port!`);
        } else {
          this.adapter.log.error(`[MQTT]\u{1F525} Cannot start server - ${e.message}`);
        }
        this.terminate();
      });
    } catch (e) {
      this.adapter.log.error(this.adapter.err2Str(e));
      return;
    }
  }
  setIsAlive(clientId, isAlive, msg) {

    if (isAlive) this.devices[clientId].lastTimeActive = Date.now();
    this.devices[clientId].isActive = isAlive;

    const ip = this.devices[clientId]?.ip;
    if (ip) {
      // Call Adapter function onMqttAliveChange()
      this.adapter.onMqttAlive(ip, isAlive, msg);
      if (isAlive) {
        this.scheduleCheckIfStillActive(clientId); // restart timer
      } else {
        // clear timer
        // @ts-expect-error "Type 'null' is not assignable to type 'Timeout'.ts(2345)" - we check for not being null via "if"
        if (this.devices[clientId].timeoutNoUpdate) this.adapter.clearTimeout(this.devices[clientId].timeoutNoUpdate);
      }
    } else {
      this.adapter.log.debug(`[MQTT] isAlive changed to ${isAlive}, but IP of client ${clientId} is still unknown.`);
    }
  }
  async scheduleCheckIfStillActive(clientId) {
    try {
      const ip = this.devices[clientId].ip;
      const ipMsg = ip ? `${this.adapter.fullysMQTT[ip].name} (${ip})` : `${clientId} (IP unknown)`;

      if (this.devices[clientId].timeoutNoUpdate)
        this.adapter.clearTimeout(this.devices[clientId].timeoutNoUpdate);

      if (!this.devices[clientId])
        this.devices[clientId] = {};

      const interval = 70 * 1000;

      this.devices[clientId].timeoutNoUpdate = this.adapter.setTimeout(async () => {
        try {
          const lastTimeActive = this.devices[clientId].lastTimeActive;
          if (!lastTimeActive)
            return;
          const diff = Date.now() - lastTimeActive;
          if (diff > 70000) {
            this.adapter.log.debug(`[MQTT] ${ipMsg} NOT ALIVE - last contact ${Math.round(diff / 1000)}s (${diff}ms) ago`);
            this.setIsAlive(clientId, false, "client did not send message for more than 70 seconds");
          } else {
            this.adapter.log.warn(`[MQTT] ${ipMsg} Please open a issue on Github, this should never happen: scheduleCheckIfStillActive() timeout, and last contact was less than 70s ago.`);
            this.adapter.log.warn(`[MQTT] ${ipMsg} is alive - last contact ${Math.round(diff / 1000)}s (${diff}ms) ago`);
            this.setIsAlive(clientId, true, `alive check is successful (last contact: ${Math.round(diff / 1000)}s ago)`);
          }
          this.scheduleCheckIfStillActive(clientId);
        } catch (e) {
          this.adapter.log.error(this.adapter.err2Str(e));
          return;
        }
      }, interval);
    } catch (e) {
      this.adapter.log.error(this.adapter.err2Str(e));
      return;
    }
  }
  terminate() {
    this.adapter.log.info(`[MQTT] Disconnect all clients and close server`);
    for (const clientId in this.devices) {
      if (this.devices[clientId].timeoutNoUpdate)
        this.adapter.clearTimeout(this.devices[clientId].timeoutNoUpdate);
      this.setIsAlive(clientId, false, "MQTT server was terminated");
    }
    if (this.aedes) {
      this.aedes.close(() => {
        this.adapter.log.debug("[MQTT] aedes.close() succeeded");
        if (this.server) {
          this.server.close(() => {
            this.adapter.log.debug("[MQTT] server.close() succeeded");
          });
        }
      });
    } else if (this.server) {
      this.server.close(() => {
        this.adapter.log.debug("[MQTT] server.close() succeeded");
      });
    }
  }
}

module.exports = MqttServer;

