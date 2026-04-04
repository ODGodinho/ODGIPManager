import { MessageException } from "@odg/message";

export class AkamaiException<
    RequestData,
    ResponseData = unknown,
> extends MessageException<RequestData, ResponseData> {

}
