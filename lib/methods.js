'use strict';

/**
 * Converts an error value to a readable string.
 * @param {*} error
 * @returns {string}
 */
function err2Str(error) {
    if (error instanceof Error) {
        if (error.stack) {
            return error.stack;
        }
        if (error.message) {
            return error.message;
        }
        return JSON.stringify(error);
    }
    if (typeof error === 'string') {
        return error;
    }
    return JSON.stringify(error);
}

/**
 * Removes forbidden characters and normalises whitespace for use as an ioBroker device name.
 * @param {string} str
 * @returns {string}
 */
function cleanDeviceName(str) {
    let res = str.replace(this.FORBIDDEN_CHARS, '');
    res = res.replace(/\./g, '');
    res = res.replace(/\s{2,}/g, ' ');
    res = res.trim();
    res = res.replace(/\s/g, '_');
    if (res.replace(/_/g, '').length === 0) {
        res = '';
    }
    return res;
}

/**
 * Returns true if the given string is a valid IPv4 address.
 * @param {string} ip
 * @returns {boolean}
 */
function isIpAddressValid(ip) {
    const pattern = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return pattern.test(ip);
}

/**
 * Searches an array of config objects for a matching key and returns the value of a second key.
 * Returns -1 if not found or if key2 value is undefined.
 * @param {Array<Object>} config
 * @param {string} key1
 * @param {*} key1Value
 * @param {string} key2
 * @returns {*}
 */
function getConfigValuePerKey(config, key1, key1Value, key2) {
    for (const lpConfDevice of config) {
        if (lpConfDevice[key1] === key1Value) {
            if (lpConfDevice[key2] === undefined) {
                return -1;
            }
            return lpConfDevice[key2];
        }
    }
    return -1;
}

/**
 * Returns true if the given value is empty (null, undefined, empty string/array/object).
 * @param {*} toCheck
 * @returns {boolean}
 */
function isEmpty(toCheck) {
    if (toCheck === null || typeof toCheck === 'undefined') {
        return true;
    }
    if (typeof toCheck === 'function') {
        return false;
    }
    let x = JSON.stringify(toCheck);
    x = x.replace(/\s+/g, '');
    x = x.replace(/"+/g, '');
    x = x.replace(/'+/g, '');
    x = x.replace(/\[+/g, '');
    x = x.replace(/\]+/g, '');
    x = x.replace(/\{+/g, '');
    x = x.replace(/\}+/g, '');
    return x === '';
}

/**
 * Waits for a given number of milliseconds.
 * @param {number} ms
 */
async function wait(ms) {
    try {
        await new Promise((resolve) => setTimeout(resolve, ms));
    } catch (e) {
        this.log.error(this.err2Str(e));
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
