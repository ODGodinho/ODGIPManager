import { AxiosMessage } from "@odg/axios";

import { IpConnectionTester } from "~/ConnectionTester";
import { IpApiTester, WhoisIpTester } from "~/test";

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

const result = makeTester.run();
result.then((AAA) => {
    console.log("BBBB");

    console.log(AAA);
});
