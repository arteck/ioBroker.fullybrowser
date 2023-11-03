'use strict';
function err2Str(error) {
    if (error instanceof Error) {
        if (error.stack)
            return error.stack;
        if (error.message)
            return error.message;
        return JSON.stringify(error);
    } else {
        if (typeof error === 'string')
            return error;
        return JSON.stringify(error);
    }
}
function cleanDeviceName(str) {
    let res = str.replace(this.FORBIDDEN_CHARS, '');
    res = res.replace(/\./g, '');
    res = res.replace(/\s{2,}/g, ' ');
    res = res.trim();
    res = res.replace(/\s/g, '_');
    if (res.replace(/_/g, '').length === 0)
        res = '';
    return res;
}
function isIpAddressValid(ip) {
    const pattern = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (pattern.test(ip)) {
        return true;
    } else {
        return false;
    }
}
function getConfigValuePerKey(config, key1, key1Value, key2) {
    for (const lpConfDevice of config) {
        if (lpConfDevice[key1] === key1Value) {
            if (lpConfDevice[key2] === undefined) {
                return -1;
            } else {
                return lpConfDevice[key2];
            }
        }
    }
    return -1;
}
function isEmpty(toCheck) {
    if (toCheck === null || typeof toCheck === 'undefined')
        return true;
    if (typeof toCheck === 'function')
        return false;
    let x = JSON.stringify(toCheck);
    x = x.replace(/\s+/g, '');
    x = x.replace(/"+/g, '');
    x = x.replace(/'+/g, '');
    x = x.replace(/\[+/g, '');
    x = x.replace(/\]+/g, '');
    x = x.replace(/\{+/g, '');
    x = x.replace(/\}+/g, '');
    return x === '' ? true : false;
}
async function wait(ms) {
    try {
        await new Promise((w) => setTimeout(w, ms));
    } catch (e) {
        this.log.error(this.err2Str(e));
        return;
    }
}

module.exports = {
    cleanDeviceName,
    err2Str,
    getConfigValuePerKey,
    isEmpty,
    isIpAddressValid,
    wait
};

