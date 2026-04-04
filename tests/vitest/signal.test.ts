import { VoidTester } from "tests/vitest/mocks/VoidTester";
import { IpConnectionTester } from "~/index";

describe("Test Abort signal", () => {
    test("teste ipWhois", async () => {
        const myTests = {
            voidTest: new VoidTester(),
        } as const;
        const abortController = new AbortController();
        const makeTester = new IpConnectionTester<typeof myTests, Record<string, never>>()
            .tests(myTests)
            .signal(abortController.signal)
            .rules({});

        const startTimestamp = Date.now();
        const result = makeTester.run();
        abortController.abort();

        const resultAwaited = await result;
        expect(resultAwaited.tests.voidTest).toBeUndefined();
        expect(Date.now() - startTimestamp).toBeLessThan(300);
    });
});
