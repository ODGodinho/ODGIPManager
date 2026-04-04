import { type MessageInterface, type RequestInterface } from "@odg/message";

import { type TesterInterfaces } from "~/interfaces";
import { MessageTester } from "~/test/MessageTester";

export class IpInfoTester<RequestData = unknown> extends MessageTester<
    RequestData, TesterInterfaces.IpInfoInterface
> {

    public constructor(
        requester: MessageInterface,
        options?: RequestInterface<RequestData>,
    ) {
        super(
            requester,
            {
                ...options,
                url: "https://ipinfo.io/json",
            },
        );
    }

}
