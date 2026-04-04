import { retry, RetryAction } from "@odg/chemical-x";
import { type Exception } from "@odg/exception";

import { ConfigValidator, DependencyResolver, ResultResolver } from "~/core";
import { type IpManagerInterfaces } from "~/interfaces/IpConnection";

/**
 * Main orchestrator for running tests and rules.
 *
 * This class provides a fluent DSL for configuring and executing validation tests.
 * It delegates responsibility to specialized classes:
 * - ConfigValidator: Validates configuration before execution
 * - DependencyResolver: Resolves test dependencies for rules
 * - ResultResolver: Consolidates and resolves all test/rule results
 */
export class IpConnectionTester<
    TestsTypes extends IpManagerInterfaces.TestsRecord,
    RulesTypes extends IpManagerInterfaces.RulesRecord<TestsTypes>,
> {

    private testsList?: TestsTypes;

    private rulesList?: RulesTypes;

    private testerSignal?: AbortSignal;

    private abortSignal?: AbortSignal;

    private abortController?: AbortController;

    private attempts: number = 1;

    private readonly dependencyResolver: DependencyResolver<TestsTypes>;

    private readonly resultResolver: ResultResolver;

    private onFailureHandler?: (
        exception: Exception,
        results: {
            tests: IpManagerInterfaces.TestResults<TestsTypes>;
            rules: IpManagerInterfaces.RuleResults<RulesTypes>;
            IpConnectionTester: IpConnectionTester<TestsTypes, RulesTypes>;
        }
    ) => Exclude<RetryAction, "Resolve"> | Promise<Exclude<RetryAction, "Resolve">>;

    public constructor() {
        this.dependencyResolver = new DependencyResolver<TestsTypes>();
        this.resultResolver = new ResultResolver();
    }

    public signal(abortSignal: AbortSignal): this {
        this.abortSignal = abortSignal;

        return this;
    }

    public tests(tests: TestsTypes): this {
        this.testsList = tests;

        return this;
    }

    public rules(
        rules: RulesTypes,
    ): this {
        this.rulesList = rules;

        return this;
    }

    public retry(maxRetries: number): this {
        this.attempts = maxRetries;

        return this;
    }

    public onFailure(
        handler: (
            exception: Exception,
            results: {
                tests: IpManagerInterfaces.TestResults<TestsTypes>;
                rules: IpManagerInterfaces.RuleResults<RulesTypes>;
                IpConnectionTester: IpConnectionTester<TestsTypes, RulesTypes>;
            }
        ) => Exclude<RetryAction, "Resolve"> | Promise<Exclude<RetryAction, "Resolve">>,
    ): this {
        this.onFailureHandler = handler;

        return this;
    }

    public async run(): Promise<{
        tests: IpManagerInterfaces.TestResults<TestsTypes>;
        rules: IpManagerInterfaces.RuleResults<RulesTypes>;
    }> {
        ConfigValidator.validate(this.testsList, this.rulesList);

        let testsResults: Record<string, Promise<Exception | unknown>> | undefined;
        let rulesResults: Record<string, Promise<Exception | unknown>> | undefined;

        return retry<{
            tests: IpManagerInterfaces.TestResults<TestsTypes>;
            rules: IpManagerInterfaces.RuleResults<RulesTypes>;
        }>({
            times: this.attempts,
            callback: async () => {
                this.abortController = new AbortController();
                this.testerSignal = AbortSignal.any([
                    this.abortSignal,
                    this.abortController.signal,
                ].filter((signal) => !!signal));

                testsResults = Object.fromEntries(
                    Object.entries(this.testsList!).map(([ key, test ]) => [
                        key,
                        test.handle(this.testerSignal!),
                    ] as const),
                );

                rulesResults = Object.fromEntries(
                    Object.entries(this.rulesList!)
                        .map(([ key, rule ]) => [
                            key,
                            this.dependencyResolver
                                .resolveDependencies(
                                    testsResults!,
                                    rule,
                                    this.testerSignal!,
                                )
                                .then(async (dependencies) => rule.handle(dependencies)),
                        ] as const),
                );

                return {
                    rules: await this.resultResolver.resolve(
                        rulesResults,
                        false,
                    ) as IpManagerInterfaces.RuleResults<RulesTypes>,
                    tests: await this.resultResolver.resolve(
                        testsResults,
                        true,
                    ) as IpManagerInterfaces.TestResults<TestsTypes>,
                };
            },
            when: async (exception: Exception): Promise<Exclude<RetryAction, "Resolve">> => {
                this.abortController?.abort(exception);

                if (this.onFailureHandler) {
                    const tests = await this.resultResolver.resolve(
                        testsResults!,
                        true,
                    ) as IpManagerInterfaces.TestResults<TestsTypes>;
                    const rules = await this.resultResolver.resolve(
                        rulesResults!,
                        true,
                    ) as IpManagerInterfaces.RuleResults<RulesTypes>;

                    return this.onFailureHandler(exception, {
                        tests,
                        rules,
                        IpConnectionTester: this,
                    });
                }

                return RetryAction.Default;
            },
        });
    }

}
