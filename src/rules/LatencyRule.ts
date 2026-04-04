import { ODGMessage } from "@odg/message";

import { LatencyAvgException, LatencyMaxException, LatencyNoSuccessException } from "~/exceptions";
import { type IpManagerInterfaces, type RulesInterfaces } from "~/interfaces";

export class LatencyRule<
    Tests extends IpManagerInterfaces.TestsRecord,
    AvailableTestKeys extends IpManagerInterfaces.TestKeys<Tests> = IpManagerInterfaces.TestKeys<Tests>,
> implements IpManagerInterfaces.RuleInterface<Tests, RulesInterfaces.Latency.Rule, AvailableTestKeys> {

    private onErrorData?: RulesInterfaces.Latency.Error;

    public constructor(
        public readonly dependsOn: readonly AvailableTestKeys[],
        public readonly wait?: IpManagerInterfaces.WaitRules<AvailableTestKeys>,
        private readonly options?: {
            maxMs?: number;
            avgMs?: number;
        },
    ) { }

    public onError(data: RulesInterfaces.Latency.Error): this {
        this.onErrorData = data;

        return this;
    }

    public async handle(
        dependencies: IpManagerInterfaces.TestResults<Tests>,
    ): Promise<RulesInterfaces.Latency.Rule> {
        const timestamps = [];
        const dependenciesValues = Object.entries(dependencies);
        const ipTesters: RulesInterfaces.Latency.Rule["ipTesters"] = [];
        for (const [ name, ipTest ] of dependenciesValues) {
            const isMessage = ODGMessage.isMessage(ipTest);

            ipTesters.push({
                error: ODGMessage.isMessageError(ipTest) || !(isMessage && ipTest.request?.timestamps),
                name: name,
                latency: isMessage ? ipTest.request?.timestamps : undefined,
            });
            if (isMessage && ipTest.request?.timestamps && ipTest.response?.status) {
                timestamps.push(ipTest.request.timestamps);
            }
        }

        return this.validateLatencyAndReturn({
            dependsOn: this.dependsOn,
            status: {
                total: ipTesters.length,
                success: ipTesters.filter((tester) => !tester.error).length,
                failed: ipTesters.filter((tester) => tester.error).length,
            },
            latency: {
                max: Math.max(...timestamps),
                min: Math.min(...timestamps),
                avg: Math.trunc(
                    timestamps.reduce((accumulated, nextValue) => accumulated + nextValue, 0) / timestamps.length,
                ),
            },
            ipTesters: ipTesters,
        });
    }

    private validateLatencyAndReturn(result: RulesInterfaces.Latency.Rule): RulesInterfaces.Latency.Rule {
        const { options, onErrorData } = this;

        if (result.status.success === 0) {
            throw onErrorData?.notHaveSuccess?.(result) ?? new LatencyNoSuccessException(
                "Latency rule not success to check",
                result,
            );
        }

        if (options?.maxMs && result.latency.max > options.maxMs) {
            throw onErrorData?.maxMs?.(result) ?? new LatencyMaxException(
                `Max Latency too high! latency allowed is ${options.maxMs}ms but got ${result.latency.max}ms`,
                result,
            );
        }

        if (options?.avgMs && result.latency.avg > options.avgMs) {
            throw onErrorData?.avgMs?.(result) ?? new LatencyAvgException(
                `Average latency too high! latency allowed is ${options.avgMs}ms but got ${result.latency.avg}ms`,
                result,
            );
        }

        return result;
    }

}
