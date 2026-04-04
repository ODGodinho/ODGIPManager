import { AxiosMessage } from "@odg/axios";
import { vi } from "vitest";

import { IpManagerException } from "~/exceptions";
import { IpConnectionTester } from "~/index";
import { LatencyRule } from "~/rules";
import { IpApiTester } from "~/test/ip/IpApiTester";
import { WhoisIpTester } from "~/test/ip/WhoisIpTester";

describe("ConnectionTester", () => {
    test("Should throw error when tests are not set", async () => {
        const makeTester = new IpConnectionTester();

        await expect(makeTester.run()).rejects.toThrow("Tests not set, please use the .tests() function!");
    });

    test("Should throw error when rules are not set", async () => {
        const myTests = {
            test1: new WhoisIpTester(new AxiosMessage({})),
        } as const;
        const makeTester = new IpConnectionTester<typeof myTests, Record<string, never>>()
            .tests(myTests);

        await expect(makeTester.run()).rejects.toThrow("Rules not set, please use the .rules() function!");
    });

    test("Should throw error inside a rule", async () => {
        const myTests = {
            test1: new IpApiTester(new AxiosMessage({})),
        } as const;
        const myRules = {
            latencyRule: new LatencyRule<typeof myTests>([ "test1" ] as const, undefined, { maxMs: -1 }),
        } as const;
        const makeTester = new IpConnectionTester<typeof myTests, typeof myRules>()
            .tests(myTests)
            .rules(myRules);

        await expect(makeTester.run()).rejects.toThrow();
    });

    test("Should test wait.all and wait.race", async () => {
        const myTests = {
            test1: new IpApiTester(new AxiosMessage({})),
            test2: new WhoisIpTester(new AxiosMessage({})),
        } as const;

        const ruleWithWait = {
            dependsOn: [ "test1", "test2" ] as const,
            wait: {
                all: [ "test1" ] as const,
                race: [ "test2" ] as const,
            },
            handle: async (): Promise<string> => "OK",
        };

        const myRules = {
            waitRule: ruleWithWait,
        } as const;

        const makeTester = new IpConnectionTester<typeof myTests, typeof myRules>()
            .tests(myTests)
            .rules(myRules);

        const result = await makeTester.run();
        expect(result.rules.waitRule).toBe("OK");
    });

    test("Should abort execution", async () => {
        const controller = new AbortController();
        const myTests = {
            test1: new IpApiTester(new AxiosMessage({})),
        } as const;

        const ruleThatAborts = {
            dependsOn: [] as const,
            wait: {
                all: [ "test1" ] as const,
            },
            handle: async (): Promise<never> => {
                controller.abort();
                throw new IpManagerException("Aborted from handle");
            },
        };

        const myRules = {
            abortRule: ruleThatAborts,
        } as const;

        const makeTester = new IpConnectionTester<typeof myTests, typeof myRules>()
            .signal(controller.signal)
            .tests(myTests)
            .rules(myRules);

        await expect(makeTester.run()).rejects.toThrow(new IpManagerException("Aborted from handle"));
    });

    test("Should call onFailure on failure", async () => {
        const onFailure = vi.fn();
        const myTests = {
            test1: new IpApiTester(new AxiosMessage({})),
        } as const;
        const myRules = {
            latencyRule: new LatencyRule<typeof myTests>([ "test1" ] as const, undefined, { maxMs: -1 }),
        } as const;

        const makeTester = new IpConnectionTester<typeof myTests, typeof myRules>()
            .tests(myTests)
            .rules(myRules)
            .retry(2)
            .onFailure(onFailure);

        await expect(makeTester.run()).rejects.toThrow();

        expect(onFailure).toHaveBeenCalled();
        expect(onFailure).toBeCalledTimes(2);
    });
});
