'use strict';

const IConst = {
    mqttEvents: ['background', 'foreground', 'screenOn', 'screenOff', 'pluggedAC', 'pluggedUSB', 'pluggedWireless', 'unplugged', 'networkReconnect', 'networkDisconnect', 'internetReconnect', 'internetDisconnect', 'powerOn', 'powerOff', 'showKeyboard', 'hideKeyboard', 'onMotion', 'onDarkness', 'onMovement', 'volumeUp', 'volumeDown', 'onQrScanCancelled', 'onBatteryLevelChanged', 'onScreensaverStart', 'onScreensaverStop', 'onDaydreamStart', 'onDaydreamStop', 'onItemPlay', 'onPlaylistPlay', 'facesDetected'
    ],
    cmdsSwitches: [
        { id: 'screenSwitch', name: 'Turn Screen on and off', type: 'boolean', cmdOn: 'screenOn', cmdOff: 'screenOff', mqttOn: 'screenOn', mqttOff: 'screenOff' },
        { id: 'screensaverSwitch', name: 'Turn Screensaver on and off', type: 'boolean', cmdOn: 'startScreensaver', cmdOff: 'stopScreensaver', mqttOn: 'onScreensaverStart', mqttOff: 'onScreensaverStop' },
        { id: 'daydreamSwitch', name: 'Turn Daydream on and off', type: 'boolean', cmdOn: 'startDaydream', cmdOff: 'stopDaydream', mqttOn: 'onDaydreamStart', mqttOff: 'onDaydreamStop' },
        { id: 'lockedModeSwitch', name: 'Turn Locked Mode on and off', type: 'boolean', cmdOn: 'enableLockedMode', cmdOff: 'disableLockedMode' },
        { id: 'isInForeground', name: 'Bring Fully in foreground or background', type: 'boolean', cmdOn: 'toForeground', cmdOff: 'toBackground', mqttOn: 'foreground', mqttOff: 'background' },
        { id: 'motionDetectionSwitch', name: 'Motion Detection turn on and off', type: 'boolean', cmdOn: 'motionDetection', cmdOff: 'motionDetection', mqttOn: 'on', mqttOff: 'off' }
    ],
    cmds: [
        { id: 'clearCache', name: 'Clear Cache', type: 'boolean' },
        { id: 'clearCookies', name: 'Clear Cookies', type: 'boolean' },
        { id: 'clearWebstorage', name: 'Clear Webstorage', type: 'boolean' },
        { id: 'disableLockedMode', name: 'Disable Locked Mode', type: 'boolean' },
        { id: 'enableLockedMode', name: 'Enable Locked Mode', type: 'boolean' },
        { id: 'exitApp', name: 'Exit App', type: 'boolean' },
        { id: 'forceSleep', name: 'Force Sleep', type: 'boolean' },
        { id: 'loadStartURL', name: 'Load Start URL', type: 'boolean' },
        { id: 'popFragment', name: 'Pop Fragment', type: 'boolean' },
        { id: 'restartApp', name: 'Restart App', type: 'boolean' },
        { id: 'screenOff', name: 'Screen Off', type: 'boolean' },
        { id: 'screenOn', name: 'Screen On', type: 'boolean' },
        { id: 'startDaydream', name: 'Start Daydream', type: 'boolean' },
        { id: 'startScreensaver', name: 'Start Screensaver', type: 'boolean' },
        { id: 'stopDaydream', name: 'Stop Daydream', type: 'boolean' },
        { id: 'stopScreensaver', name: 'Stop Screensaver', type: 'boolean' },
        { id: 'toBackground', name: 'Bring Fully to Background', type: 'boolean' },
        { id: 'toForeground', name: 'Bring Fully to Foreground', type: 'boolean' },
        { id: 'triggerMotion', name: 'Trigger Motion', type: 'boolean' },
        { id: 'loadURL', name: 'Load URL', type: 'string' },
        { id: 'setStringSetting', name: 'Set String Setting', type: 'string' },
        { id: 'startApplication', name: 'Start Application', type: 'string' },
        { id: 'textToSpeech', name: 'Text To Speech', type: 'string' },
        { id: 'screenBrightness', name: 'Screen Brightness', type: 'number' },
        { id: 'setAudioVolume', name: 'Audio Volume', type: 'number' },
        { id: 'setRAW', name: 'Set RAW String', type: 'string' },
        { id: 'rebootDevice', name: 'reboot Device _ only for rooted Devices', type: 'boolean' }
    ]
};

module.exports = IConst;

