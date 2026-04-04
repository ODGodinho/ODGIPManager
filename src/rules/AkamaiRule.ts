import { Exception } from "@odg/exception";
import { ODGMessage, type MessageException } from "@odg/message";
import status from "http-status";

import { AkamaiException } from "~/exceptions/AkamaiException";
import { AkamaiHelper } from "~/helpers/akamai";
import { type AkamaiInterface, type IpManagerInterfaces } from "~/interfaces";

export class AkamaiRule<
    Tests extends IpManagerInterfaces.TestsRecord,
    AvailableTestKeys extends IpManagerInterfaces.TestKeys<Tests> = IpManagerInterfaces.TestKeys<Tests>,
> implements IpManagerInterfaces.RuleInterface<Tests, void, AvailableTestKeys> {

    private onErrorData?: AkamaiInterface.Error;

    public constructor(
        public readonly dependsOn: readonly AvailableTestKeys[],
        public readonly wait: IpManagerInterfaces.WaitRules<AvailableTestKeys>,
        private readonly options?: AkamaiInterface.Options,
    ) { }

    public onError(data: AkamaiInterface.Error): this {
        this.onErrorData = data;

        return this;
    }

    public async handle(
        dependencies: IpManagerInterfaces.TestResults<Tests>,
    ): Promise<void> {
        const dependenciesValues = Object.entries(dependencies);
        for (const [ , ipTest ] of dependenciesValues) {
            if (!ODGMessage.isMessage(ipTest)) {
                continue;
            }

            const parseException = Exception.parse(ipTest) as MessageException<unknown>;

            if (this.options?.teaPot && ipTest.response?.status === status.IM_A_TEAPOT) {
                throw this.onErrorData?.teapot?.(parseException)
                    ?? this.throwResult("Akamai block with teaPot Status", parseException);
            }

            if (AkamaiHelper.isAkamaiError(ipTest)) {
                throw this.onErrorData?.blocked?.(parseException)
                    ?? this.throwResult("Akamai block with forbidden status", parseException);
            }
        }
    }

    private throwResult(message: string, result: MessageException<unknown> | undefined): Exception {
        return new AkamaiException(
            message,
            result?.getPrevious(),
            result?.code,
            result?.request,
            result?.response,
        );
    }

}
