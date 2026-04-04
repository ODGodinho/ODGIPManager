import { type MessageInterface, type RequestInterface } from "@odg/message";

import { type TesterInterfaces } from "~/interfaces";
import { MessageTester } from "~/test/MessageTester";

export class WhoisIpTester<RequestData = unknown> extends MessageTester<
    RequestData, TesterInterfaces.WhoisIpInterface
> {

    public constructor(
        requester: MessageInterface,
        options?: RequestInterface<RequestData>,
    ) {
        super(
            requester,
            {
                ...options,
                url: "https://ipwho.is/",
            },
        );
    }

}
