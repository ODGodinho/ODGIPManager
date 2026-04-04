import { type Exception } from "@odg/exception";

import { type IpManagerInterfaces } from "~/interfaces/IpConnection";

/**
 * Resolve dependencies for a rule.
 *
 * @template {IpManagerInterfaces.TestsRecord} Tests Tests record
 */
export class DependencyResolver<
    Tests extends IpManagerInterfaces.TestsRecord,
> {

    /**
     * Resolves dependencies for a rule by:
     * 1. Waiting for all required test dependencies
     * 2. Handling wait rules (all/race)
     * 3. Returning the resolved dependencies
     *
     * @param {Record<string, Promise<Exception | unknown>>} testResults Record of test results promises
     * @param {IpManagerInterfaces.RuleInterface<Tests, unknown>} rule Rule interface to resolve dependencies for
     * @param {AbortSignal} signal AbortSignal for cancellation
     * @returns {Promise<IpManagerInterfaces.TestResults<Tests>>} Resolved test results for the rule
     */
    public async resolveDependencies(
        testResults: Record<string, Promise<Exception | unknown>>,
        rule: IpManagerInterfaces.RuleInterface<Tests, unknown>,
        signal: AbortSignal,
    ): Promise<IpManagerInterfaces.TestResults<Tests>> {
        // Resolve the direct dependencies
        const dependencies = Object.fromEntries(
            await Promise.all(
                rule.dependsOn
                    .map(async (testKey): Promise<[string, unknown]> => [ testKey, await testResults[testKey] ]),
            ),
        ) as IpManagerInterfaces.TestResults<Tests>;

        // Handle wait rules
        const waitAll = this.waitBeforeHandle(testResults, signal, rule.wait?.all);
        const waitRace = this.waitBeforeHandle(testResults, signal, rule.wait?.race);

        await Promise.all(waitAll ?? []);
        if (waitRace?.length) {
            await Promise.race(waitRace);
        }

        return dependencies;
    }

    /**
     * Creates an array of promises to wait for based on test keys.
     * Returns undefined if no dependencies or signal is aborted.
     *
     * @param {Record<string, Promise<Exception | unknown>>} testResults Record of test results promises
     * @param {AbortSignal} signal AbortSignal for cancellation
     * @param {string[] | undefined} dependsOn Array of test keys to wait for (optional)
     * @returns {Array<Promise<unknown>> | undefined} Array of promises to wait for, or undefined
     */
    private waitBeforeHandle(
        testResults: Record<string, Promise<Exception | unknown>>,
        signal: AbortSignal,
        dependsOn?: readonly string[],
    ): Array<Promise<unknown>> | undefined {
        if (!dependsOn || signal.aborted) {
            return;
        }

        return dependsOn
            .map(async (testKey) => testResults[testKey]);
    }

}
