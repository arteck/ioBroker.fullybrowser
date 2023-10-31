![Logo](../../admin/fully-mqtt_500.png)

## About this adapter

With this adapter the [Fully Kiosk Browser](https://www.fully-kiosk.com) (with Plus license) can be controlled. Via the [REST API](https://www.fully-kiosk.com/en/#rest) various commands like "screen on/off", "screen saver on/off", etc. can be sent to the Fully.

Additionally, [MQTT](https://www.fully-kiosk.com/en/#mqtt) events (like "screen on") are always immediately communicated to the adapter and set in the corresponding states. Furthermore, the Fully Browser always sends all device information via MQTT automatically at least every 60 seconds, which are set to the info states accordingly. Please note that all commands are sent via the REST API and not MQTT, since the Fully Browser does not support sending commands via MQTT.

## Fully-Browser settings

### Activate Remote Admin
1. On the tablet, open the Fully Browser app and open the Fully Browser settings.
1. Open menu item **Remote Administration (PLUS)**
1. Enable **Enable Remote Administration**
1. **Remote Admin Password**: enter a password
1. Enable **Remote Admin from Local Network**

![Logo](../_img/fully-browser-settings-remote-admin.png)

### Activate MQTT
1. On the tablet, open the Fully Browser app and open the Settings. Alternatively, you can also open the Remote Admin from another device (e.g. PC) from a browser, the URL is typically always http://ip-address:2323, you will be asked for the password assigned above.
2. Open: **Settings** -> **Other Settings** -> **MQTT Integration (PLUS)**
3. Enable **Enable MQTT**
4. **MQTT Broker URL**: Enter in the format `mqtt://iobroker-ip-address:3000`, where `iobroker-ip-address` is the IP address of the ioBroker, and `3000` is the port number used for the MQTT connection.
5. **MQTT Broker Username**: here you can optionally enter a username
6. **MQTT Broker Password**: here you can optionally enter a password
7. **MQTT Client ID**: can be left empty
8. **MQTT Device Info Topic**: here you can leave the default setting, it will not be used by the adapter.
8. **MQTT Event Topic**: here you can leave the default setting, it will not be used by the adapter.

![Logo](../_img/fully-browser-settings-mqtt.png)


## Adapter Settings

### Fully Browser Devices
Add Fully Browser device(s), i.e. the tablets running Fully Browser, accordingly:
1. **Device Name**: Any name, which is also used as part of the objects/states, e.g. `Tablet Flur` becomes `fully-mqtt.0.Tablet-Flur`.
1. **Protocol**: leave `http` as it is. If `https` should be used: see notes under [Remote Admin](https://www.fully-kiosk.com/en/#remoteadmin).
1. **Remote Admin Password**: enter the password as set above.

### MQTT Configuration
 * **Port**: Use the same port number as above in the Fullybrowser MQTT settings (e.g. `3000`).
 * **Do not verify user and password**: can be activated to disable username and password verification
 * **User name**: optional
 * **Password**: optional

### Expert Settings: MQTT
 * **Do not process published info more than every x seconds**: Per [Fully Documentation](https://www.fully-kiosk.com/en/#mqtt), info is published only every 60 seconds, but in my tests this happened more often, so a limit can be set with this option.
 * **Always update info objects**: Normally all info states are set/updated only if there was a change. If this option is enabled, states will always be updated (with ack:true), even if there was no change from the previous value.
 * **Client and Connection errors as info in log**: If activated, client and connection errors are always output as info and not as error in the log. This serves to keep the log clean and not to fill it unnecessarily just because a tablet logs off briefly and logs on again after a few seconds. "Longer-term" errors and warnings are always displayed in the log accordingly.

### Expert Settings: Remote Admin (REST API)
 * **Request Timeout**: After this number milliseconds, REST API requests (i.e. sending commands) are aborted if not successful.

 ## Links

* [ioBroker-Forum: Adapter Fully Browser mit MQTT](https://forum.iobroker.net/topic/69729/)
* [fully-kiosk.com REST API](https://www.fully-kiosk.com/en/#rest)
* [fully-kiosk.com MQTT Integration](https://www.fully-kiosk.com/en/#mqtt)
