import { sleep } from "@odg/chemical-x";

import { type IpManagerInterfaces } from "~/interfaces";

export class VoidTester implements IpManagerInterfaces.TestInterface<
    void
> {

    public async handle(signal: AbortSignal): Promise<void> {
        await sleep(9999, { signal: signal });
    }

}
