import { type Exception } from "@odg/exception";

export namespace RulesInterfaces {

    export namespace Latency {
        export interface Error {
            maxMs?(result: Rule): Exception;
            avgMs?(result: Rule): Exception;
            notHaveSuccess?(result: Rule): Exception;
        }

        export interface Rule {
            dependsOn: readonly string[];
            status: {
                total: number;
                success: number;
                failed: number;
            };
            ipTesters: Array<{
                error: boolean;
                name: string;
                latency: number | undefined;
            }>;
            latency: {
                max: number;
                min: number;
                avg: number;
            };
        }
    }
}
