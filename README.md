![Logo](admin/fully.png)
# ioBroker.fullybrowser
=================

[![NPM](https://nodei.co/npm/iobroker.fullybrowser.png?downloads=true)](https://nodei.co/npm/iobroker.fullybrowser/)

[![NPM version](http://img.shields.io/npm/v/iobroker.fullybrowser.svg)](https://www.npmjs.com/package/iobroker.fullybrowser)
[![Downloads](https://img.shields.io/npm/dm/iobroker.fullybrowser.svg)](https://www.npmjs.com/package/iobroker.fullybrowser)![GitHub last commit](https://img.shields.io/github/last-commit/arteck/ioBroker.fullybrowser)
![GitHub issues](https://img.shields.io/github/issues/arteck/ioBroker.fullybrowser)[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/arteck/ioBroker.fullybrowser/blob/master/LICENSE)

</br>
**Version:** </br>

![Number of Installations](http://iobroker.live/badges/fullybrowser-installed.svg)
![Beta](https://img.shields.io/npm/v/iobroker.fullybrowser.svg?color=red&label=beta)
![Stable](https://iobroker.live/badges/fullybrowser-stable.svg)

 
fullyBrowser Adapter for ioBroker
------------------------------------------------------------------------------

This adapter manages your [Fully Kiosk Browser](https://www.fully-kiosk.com) (a Plus License is required). It provides you with a bunch of possibilites to control your tablet through ioBroker, like turning the display on/off, launch any tablet app, launch the screensaver etc. Also, it provides various information in states, like battery level of your tablet, etc. which you can use e.g. for Visualization.
It can use MQTT or RestAPI connection for public the states.

A small excerpt just of the command options:

![tree](https://github.com/arteck/iobroker.fullyBrowser/blob/master/docs/auszug2.png)
![tree2](https://github.com/arteck/iobroker.fullyBrowser/blob/master/docs/auszug1.png)

## Documentation

-   [🇬🇧 English Documentation](./docs/en/README.md)
-   [🇩🇪 Deutsche Dokumentation](./docs/de/README.md)


## Credits

Many thanks to @Acgua (https://github.com/Acgua) for [ioBroker.fully-mqtt](https://github.com/Acgua/ioBroker.fully-mqtt). 

<!--
    Placeholder for the next version (at the beginning of the line):
    
    https://github.com/AlCalzone/release-script#usage
    npm run release minor -- --all 0.9.8 -> 0.10.0
    npm run release patch -- --all 0.9.8 -> 0.9.9
    npm run release prerelease beta -- --all v0.2.1 -> v0.2.2-beta.0
    Placeholder for the next version (at the beginning of the line):
    ### **WORK IN PROGRESS**
-->



## Changelog
### 3.0.9 (2023-12-07)
* (arteck) corr error message

### 3.0.8 (2023-12-05)
* (arteck) toForeground corr

### 3.0.7 (2023-11-20)
* (arteck) check credentials

### 3.0.6 (2023-11-11)
* (arteck) add mqttTimeout in settings

### 3.0.5 (2023-11-09)
* (arteck) add setRAW DP, this allows you to send a fullbrowser command directly

### 3.0.4 (2023-11-06)
* (arteck) set to zero corr

### 3.0.3 (2023-11-04)
 * (arteck) setStringSettings corr

### 3.0.2 (2023-11-02)
* (arteck) add motionDetection
* (arteck) for Rooted Devices add rebootDevice

### 3.0.0 (2023-11-02)
* (arteck) breaking change - new structure from fully-mqtt Adapter from Acgua
* here is the Orginal https://github.com/Acgua/ioBroker.fully-mqtt

#----------------------------------------------------------------------

### 2.2.0 (2023-10-27)
* (arteck) intervall corr

### 2.1.6 (2022-11-23)
* (arteck) add name of device to admin
* (arteck) corr status when login fail
* (arteck) corr psw typo

### 2.1.2 (2022-04-05)
* (arteck) encodeUri in psw

### 2.1.1 (2022-02-07)
* (arteck) js-controller 4.x

### 2.1.0 (2022-02-07)
* (arteck) js-controller 4

### 2.0.14 (2022-01-31)
* (arteck) life tick error


...
...
...

### 1.0.1 (2019-06-20)
* (arteck) encodeURL

## License
The MIT License (MIT)

Copyright (c) 2014-2024 Arthur Rupp arteck@outlook.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
