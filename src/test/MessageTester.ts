import { type MessageInterface, type MessageResponse, type RequestInterface } from "@odg/message";

import { type IpManagerInterfaces } from "~/interfaces";

export class MessageTester<RequestData = unknown, ResponseData = unknown> implements IpManagerInterfaces.TestInterface<
    MessageResponse<RequestData, ResponseData>
> {

    public constructor(
        private readonly requester: MessageInterface,
        private readonly options: RequestInterface<RequestData>,
    ) {

    }

    public async handle(signal: AbortSignal): Promise<MessageResponse<RequestData, ResponseData>> {
        return this.requester.request<RequestData, ResponseData>({
            ...this.options,
            signal: AbortSignal.any([
                signal,
                this.options.signal,
            ].filter((signalFilter) => !!signalFilter)),
        });
    }

}
