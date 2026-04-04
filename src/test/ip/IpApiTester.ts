import { type MessageInterface, type RequestInterface } from "@odg/message";

import { type TesterInterfaces } from "~/interfaces";
import { MessageTester } from "~/test/MessageTester";

export class IpApiTester<RequestData = unknown> extends MessageTester<
    RequestData, TesterInterfaces.IpApiInterface
> {

    public constructor(
        requester: MessageInterface,
        options?: RequestInterface<RequestData>,
    ) {
        super(
            requester,
            {
                ...options,

                // eslint-disable-next-line sonar/no-clear-text-protocols
                url: "http://ip-api.com/json",
            },
        );
    }

}
