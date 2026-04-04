import { Exception } from "@odg/exception";

import { type RulesInterfaces } from "~/interfaces";

export class LatencyException extends Exception {

    public constructor(
        public readonly message: string,
        public readonly latencyData: RulesInterfaces.Latency.Rule,
        previous?: unknown,
        code?: number | string | undefined,
    ) {
        super(message, previous, code);
    }

}
