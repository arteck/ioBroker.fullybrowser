import type { DBConnection } from "./dbConnection";
export declare class ControllerSetup {
    private adapterDir;
    private testDir;
    private dbConnection;
    constructor(adapterDir: string, testDir: string, dbConnection: DBConnection);
    private appName;
    private adapterName;
    private testAdapterDir;
    private testControllerDir;
    private testDataDir;
    prepareTestDir(): Promise<void>;
    /**
     * Tests if JS-Controller is already installed
     * @param appName The branded name of "iobroker"
     * @param testDir The directory the integration tests are executed in
     */
    isJsControllerInstalled(): Promise<boolean>;
    /**
     * Tests if an instance of JS-Controller is already running by attempting to connect to the Objects DB
     */
    isJsControllerRunning(): Promise<boolean>;
    /**
     * Sets up an existing JS-Controller instance for testing by executing "iobroker setup first"
     * @param appName The branded name of "iobroker"
     * @param testDir The directory the integration tests are executed in
     */
    setupJsController(): Promise<void>;
    /**
     * Changes the objects and states db to use alternative ports
     * @param appName The branded name of "iobroker"
     * @param testDir The directory the integration tests are executed in
     */
    setupSystemConfig(): Promise<void>;
    /**
     * Clears the log dir for integration tests (and creates it if it doesn't exist)
     * @param appName The branded name of "iobroker"
     * @param testDir The directory the integration tests are executed in
     */
    clearLogDir(): Promise<void>;
    /**
     * Clears the sqlite DB dir for integration tests (and creates it if it doesn't exist)
     * @param appName The branded name of "iobroker"
     * @param testDir The directory the integration tests are executed in
     */
    clearDBDir(): Promise<void>;
    /**
     * Disables all admin instances in the objects DB
     * @param objects The contents of objects.json
     */
    disableAdminInstances(): Promise<void>;
}
