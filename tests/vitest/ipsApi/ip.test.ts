import { AxiosMessage } from "@odg/axios";
import { Exception } from "@odg/exception";
import { ODGMessage, type MessageInterface, type RequestInterface } from "@odg/message";

import { type IpManagerInterfaces } from "~/interfaces";
import { IpApiTester, IpInfoTester } from "~/test";
import { WhoisIpTester } from "~/test/ip/WhoisIpTester";

describe("Ip Connection Teste", () => {
    const abortController = new AbortController();
    test.each([
        WhoisIpTester,
        IpApiTester,
        IpInfoTester,
    ])(
        "Ip Testers",
        async (
            ClassName: new (
                message: MessageInterface,
                parameters: RequestInterface<unknown>
            ) => IpManagerInterfaces.TestInterface<unknown>,
        ) => {
            const tester = new ClassName(new AxiosMessage({}), {});
            const handle = tester.handle(abortController.signal)
                .catch((exception: Exception) => Exception.parse(exception));
            expect(ODGMessage.isMessage(await handle)).toBeTruthy();
        },
    );
});
