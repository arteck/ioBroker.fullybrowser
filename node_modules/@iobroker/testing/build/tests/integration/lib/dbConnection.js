"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBConnection = void 0;
const fs_extra_1 = require("fs-extra");
const path = __importStar(require("path"));
const tools_1 = require("./tools");
/** The DB connection capsules access to the objects.json and states.json on disk */
class DBConnection {
    /**
     * @param appName The branded name of "iobroker"
     * @param testDir The directory the integration tests are executed in
     */
    constructor(appName, testDir) {
        this.appName = appName;
        this.testDir = testDir;
        this.testDataDir = (0, tools_1.getTestDataDir)(appName, testDir);
        this.objectsPath = path.join(this.testDataDir, "objects.json");
        this.statesPath = path.join(this.testDataDir, "states.json");
    }
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    async readObjectsDB() {
        // debug(`reading objects db...`);
        // debug(`  dataDir:     ${dataDir}`);
        // debug(`  objectsPath: ${objectsPath}`);
        if (await (0, fs_extra_1.pathExists)(this.objectsPath)) {
            // debug(`  exists:      true`);
            return (0, fs_extra_1.readJSON)(this.objectsPath, { encoding: "utf8" });
        }
    }
    async writeObjectsDB(objects) {
        if (!objects)
            return;
        return (0, fs_extra_1.writeJSON)(this.objectsPath, objects);
    }
    async writeStatesDB(states) {
        if (!states)
            return;
        return (0, fs_extra_1.writeJSON)(this.statesPath, states);
    }
    async readStatesDB() {
        // debug(`reading states db...`);
        // debug(`  dataDir:     ${dataDir}`);
        // debug(`  statesPath:  ${statesPath}`);
        if (await (0, fs_extra_1.pathExists)(this.statesPath)) {
            // debug(`  exists:      true`);
            return (0, fs_extra_1.readJSON)(this.statesPath, { encoding: "utf8" });
        }
    }
    /**
     * Creates a backup of the objects and states DB, so it can be restored after each test
     * @param appName The branded name of "iobroker"
     * @param testDir The directory the integration tests are executed in
     */
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    async readDB() {
        const objects = await this.readObjectsDB();
        const states = await this.readStatesDB();
        return { objects, states };
    }
    /**
     * Restores a previous backup of the objects and states DB
     * @param appName The branded name of "iobroker"
     * @param testDir The directory the integration tests are executed in
     */
    async writeDB(objects, states) {
        await this.writeObjectsDB(objects);
        await this.writeStatesDB(states);
    }
}
exports.DBConnection = DBConnection;
