import { type Exception } from "@odg/exception";

export namespace IpManagerInterfaces {

    /** Tester class interface implementation*/
    export interface TestInterface<HandlerReturn> {
        handle(signal: AbortSignal): Promise<HandlerReturn>;
    }

    /** Rule interface implementation */
    export interface RuleInterface<
        Tests extends TestsRecord,
        ReturnType,
        AvailableTestKeys extends string = TestKeys<Tests>,
    > {
        dependsOn: readonly AvailableTestKeys[];
        wait?: WaitRules<AvailableTestKeys>;

        handle(dependencies: TestResults<Tests>): Promise<ReturnType>;
    }

    /** Test list implementation { Name: Tester class }*/
    export type TestsRecord = Readonly<Record<string, TestInterface<unknown>>>;

    /** Rules list implementation { Name: Rule class }*/
    export type RulesRecord<Tests extends TestsRecord = TestsRecord> = Readonly<
        Record<string, RuleInterface<Tests, unknown>>
    >;

    /** Utility to extract the keys of a tests record */
    export type TestKeys<Tests extends TestsRecord> = string & keyof Tests;

    /** Utility to extract the keys of a rules record */
    export type RuleKeys<Rules extends RulesRecord> = string & keyof Rules;

    /** Utility to extract the values (instances) of a tests record */
    export type TestsValues<Tests extends TestsRecord> = Tests[TestKeys<Tests>];

    /** Results of tests when using object */
    export type TestResults<Tests extends TestsRecord> = {
        [K in TestKeys<Tests>]: Awaited<Exception | ReturnType<Tests[K]["handle"]>>;
    };

    /** Results of rules when using object */
    export type RuleResults<Rules extends RulesRecord> = {
        [K in RuleKeys<Rules>]: Awaited<Exception | ReturnType<Rules[K]["handle"]>>;
    };

    /** Wait rules interface implementation */
    export interface WaitRules<AvailableTestKeys extends string = string> {
        race?: readonly AvailableTestKeys[];
        all?: readonly AvailableTestKeys[];
    }

}
