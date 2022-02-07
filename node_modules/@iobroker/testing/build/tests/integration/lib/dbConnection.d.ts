/// <reference types="iobroker" />
export declare type ObjectsDB = Record<string, ioBroker.Object>;
export declare type StatesDB = Record<string, ioBroker.State>;
/** The DB connection capsules access to the objects.json and states.json on disk */
export declare class DBConnection {
    private appName;
    private testDir;
    /**
     * @param appName The branded name of "iobroker"
     * @param testDir The directory the integration tests are executed in
     */
    constructor(appName: string, testDir: string);
    private testDataDir;
    private objectsPath;
    private statesPath;
    readObjectsDB(): Promise<Record<string, ioBroker.Object> | undefined>;
    writeObjectsDB(objects: ObjectsDB | undefined): Promise<void>;
    writeStatesDB(states: StatesDB | undefined): Promise<void>;
    readStatesDB(): Promise<any>;
    /**
     * Creates a backup of the objects and states DB, so it can be restored after each test
     * @param appName The branded name of "iobroker"
     * @param testDir The directory the integration tests are executed in
     */
    readDB(): Promise<{
        objects: Record<string, ioBroker.Object> | undefined;
        states: any;
    }>;
    /**
     * Restores a previous backup of the objects and states DB
     * @param appName The branded name of "iobroker"
     * @param testDir The directory the integration tests are executed in
     */
    writeDB(objects: any, states: any): Promise<void>;
}
