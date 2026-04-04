import { type MessageException, type MessageResponse } from "@odg/message";
import status from "http-status";

export class AkamaiHelper {

    public static isAkamaiError(message: MessageException<unknown> | MessageResponse): boolean {
        if (message.response?.status !== status.FORBIDDEN) {
            return false;
        }

        const responseBody = String(message.response.data);
        const hasEdgeSuiteInBody = typeof responseBody === "string" && responseBody.includes("edgesuite");

        const serverTimingHeader = String(message.response.headers["server-timing"]);
        const hasAkamaiInTiming = typeof serverTimingHeader === "string" && serverTimingHeader.includes("ak_");

        return hasEdgeSuiteInBody || hasAkamaiInTiming;
    }

}
