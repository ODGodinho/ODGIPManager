import { AxiosMessage } from "@odg/axios";
import { Exception } from "@odg/exception";
import { ODGMessage } from "@odg/message";

import { IpConnectionTester } from "~/index";
import { WhoisIpTester } from "~/test/ip/WhoisIpTester";

describe("Ip Connection Teste", () => {
    test("teste instance", () => {
        expect(new IpConnectionTester()).toBeInstanceOf(IpConnectionTester);
    });
    test("teste ipWhois", async () => {
        const myTests = {
            test1: new WhoisIpTester(new AxiosMessage({})),
        } as const;
        const makeTester = new IpConnectionTester<typeof myTests, Record<string, never>>()
            .tests(myTests)
            .rules({});

        const testResult = makeTester.run();
        await expect(testResult).resolves.not.toThrow();
        const testResultAwaited = await testResult;

        expect(testResultAwaited.tests.test1).not.instanceOf(Exception);
        expect(ODGMessage.isMessageResponse(testResultAwaited.tests.test1)).toBeTruthy();
        if (ODGMessage.isMessageResponse(testResultAwaited.tests.test1)) {
            expect(testResultAwaited.tests.test1.response.data.ip).toBeTypeOf("string");
        }
    });
});
