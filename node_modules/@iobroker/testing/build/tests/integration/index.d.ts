import { TestHarness } from "./lib/harness";
export interface TestAdapterOptions {
    allowedExitCodes?: (number | string)[];
    /** How long to wait before the adapter startup is considered successful */
    waitBeforeStartupSuccess?: number;
    /** Allows you to define additional tests */
    defineAdditionalTests?: (getHarness: () => TestHarness) => void;
}
export declare function testAdapter(adapterDir: string, options?: TestAdapterOptions): void;
