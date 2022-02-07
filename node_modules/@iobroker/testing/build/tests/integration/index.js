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
exports.testAdapter = void 0;
const async_1 = require("alcalzone-shared/async");
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const adapterTools_1 = require("../../lib/adapterTools");
const executeCommand_1 = require("../../lib/executeCommand");
const adapterSetup_1 = require("./lib/adapterSetup");
const controllerSetup_1 = require("./lib/controllerSetup");
const dbConnection_1 = require("./lib/dbConnection");
const harness_1 = require("./lib/harness");
function testAdapter(adapterDir, options = {}) {
    const appName = (0, adapterTools_1.getAppName)(adapterDir);
    const adapterName = (0, adapterTools_1.getAdapterName)(adapterDir);
    const testDir = path.join(os.tmpdir(), `test-${appName}.${adapterName}`);
    let harness;
    const dbConnection = new dbConnection_1.DBConnection(appName, testDir);
    const controllerSetup = new controllerSetup_1.ControllerSetup(adapterDir, testDir, dbConnection);
    console.log();
    console.log(`Running tests in ${testDir}`);
    console.log();
    describe(`Test the adapter (in a live environment)`, () => {
        let objectsBackup;
        let statesBackup;
        before(async function () {
            // Installation may take a while - especially if rsa-compat needs to be installed
            const oneMinute = 60000;
            this.timeout(30 * oneMinute);
            if (await controllerSetup.isJsControllerRunning()) {
                throw new Error("JS-Controller is already running! Stop it for the first test run and try again!");
            }
            const adapterSetup = new adapterSetup_1.AdapterSetup(adapterDir, testDir, dbConnection);
            // First we need to copy all files and execute an npm install
            await controllerSetup.prepareTestDir();
            await adapterSetup.copyAdapterFilesToTestDir();
            // Remember if JS-Controller is installed already. If so, we need to call setup first later
            const wasJsControllerInstalled = await controllerSetup.isJsControllerInstalled();
            // Call npm install
            await (0, executeCommand_1.executeCommand)("npm", ["i", "--production"], {
                cwd: testDir,
            });
            // Prepare/clean the databases and config
            if (wasJsControllerInstalled)
                await controllerSetup.setupJsController();
            await controllerSetup.setupSystemConfig();
            await controllerSetup.disableAdminInstances();
            await adapterSetup.deleteOldInstances();
            await adapterSetup.addAdapterInstance();
            // Create a copy of the databases that we can restore later
            ({ objects: objectsBackup, states: statesBackup } =
                await dbConnection.readDB());
        });
        beforeEach(async function () {
            this.timeout(30000);
            // Clean up before every single test
            await Promise.all([
                controllerSetup.clearDBDir(),
                controllerSetup.clearLogDir(),
                dbConnection.writeDB(objectsBackup, statesBackup),
            ]);
            // Create a new test harness
            harness = new harness_1.TestHarness(adapterDir, testDir);
            // Enable the adapter and set its loglevel to debug
            await harness.changeAdapterConfig(appName, testDir, adapterName, {
                common: {
                    enabled: true,
                    loglevel: "debug",
                },
            });
            // Start the controller instance
            await harness.startController();
            // And enable the sendTo emulation
            await harness.enableSendTo();
        });
        afterEach(async function () {
            // Stopping the processes may take a while
            this.timeout(30000);
            // Stop the controller again
            await harness.stopController();
            harness.removeAllListeners();
        });
        it("The adapter starts", function () {
            this.timeout(60000);
            return new Promise((resolve, reject) => {
                // Register a handler to check the alive state and exit codes
                harness
                    .on("stateChange", async (id, state) => {
                    if (id === `system.adapter.${adapterName}.0.alive` &&
                        state &&
                        state.val === true) {
                        // Wait a bit so we can catch errors that do not happen immediately
                        await (0, async_1.wait)(options.waitBeforeStartupSuccess != undefined
                            ? options.waitBeforeStartupSuccess
                            : 5000);
                        resolve(`The adapter started successfully.`);
                    }
                })
                    .on("failed", (code) => {
                    if (options.allowedExitCodes == undefined ||
                        options.allowedExitCodes.indexOf(code) === -1) {
                        reject(new Error(`The adapter startup was interrupted unexpectedly with ${typeof code === "number"
                            ? "code"
                            : "signal"} ${code}`));
                    }
                    else {
                        // This was a valid exit code
                        resolve(`The expected ${typeof code === "number"
                            ? "exit code"
                            : "signal"} ${code} was received.`);
                    }
                });
                harness.startAdapter();
            }).then((msg) => console.log(msg));
        });
        // Call the user's tests
        if (typeof options.defineAdditionalTests === "function") {
            options.defineAdditionalTests(() => harness);
        }
    });
}
exports.testAdapter = testAdapter;
