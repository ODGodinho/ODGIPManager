import { UnknownException } from "@odg/exception";
import {
    MessageException,
    MessageResponse,
} from "@odg/message";

import { type RulesInterfaces } from "~/interfaces";
import { LatencyRule } from "~/rules";

describe("Ip Connection LatencyRule", () => {
    const defaultResponse = { status: 200, headers: {}, data: {}};

    test("Test AVG latency Rule", async () => {
        const latencyRule = new LatencyRule(
            [] as const,
            undefined,
            { avgMs: 1000 },
        );

        const handleRule = latencyRule.handle({
            mockLatency: new MessageResponse({ timestamps: 2000 }, defaultResponse),
            mockLatency2: new MessageResponse({ timestamps: 500 }, defaultResponse),
        });

        await expect(handleRule).rejects.toThrowError(
            "Average latency too high! latency allowed is 1000ms but got 1250ms",
        );
    });

    test("Test AVG latency Change Exception", async () => {
        const latencyRule = new LatencyRule(
            [] as const,
            undefined,
            { avgMs: 1000 },
        ).onError({
            avgMs(result) {
                return new UnknownException(`Test Change${result.latency.avg}`);
            },
        });

        const handleRule = latencyRule.handle({
            mockLatency: new MessageResponse({ timestamps: 2000 }, defaultResponse),
            mockLatency2: new MessageResponse({ timestamps: 500 }, defaultResponse),
        });

        await expect(handleRule).rejects.toThrowError(
            "Test Change1250",
        );
        await expect(handleRule).rejects.toBeInstanceOf(UnknownException);
    });

    test("Test Max latency Rule", async () => {
        const latencyRule = new LatencyRule(
            [] as const,
            undefined,
            { maxMs: 1999 },
        );

        const handleRule = latencyRule.handle({
            mockLatency: new MessageResponse({ timestamps: 2000 }, defaultResponse),
            mockLatency2: new MessageResponse({ timestamps: 500 }, defaultResponse),
        });

        await expect(handleRule).rejects.toThrowError(
            "Max Latency too high! latency allowed is 1999ms but got 2000ms",
        );
    });

    test("Test Max latency Change Exception", async () => {
        const latencyRule = new LatencyRule(
            [] as const,
            undefined,
            { maxMs: 1999 },
        ).onError({
            maxMs(result) {
                return new UnknownException(`Test Max ${result.latency.max}`);
            },
        });

        const handleRule = latencyRule.handle({
            mockLatency: new MessageResponse({ timestamps: 2000 }, defaultResponse),
            mockLatency2: new MessageResponse({ timestamps: 500 }, defaultResponse),
        });

        await expect(handleRule).rejects.toThrowError(
            "Test Max 2000",
        );
        await expect(handleRule).rejects.toBeInstanceOf(UnknownException);
    });

    test("Test Rule with success", async () => {
        const latencyRule = new LatencyRule(
            [] as const,
            undefined,
            {
                maxMs: 2500,
                avgMs: 2500,
            },
        ).onError({
            maxMs(result) {
                return new UnknownException(`Test Max ${result.latency.max}`);
            },
        });

        const handleRule = latencyRule.handle({
            mockLatency: new MessageResponse({ timestamps: 2000 }, defaultResponse),
        });

        await expect(handleRule).resolves.toBeDefined();
    });

    test("Test request with error and success", async () => {
        const latencyRule = new LatencyRule(
            [] as const,
            undefined,
            {
                maxMs: 2500,
                avgMs: 2500,
            },
        ).onError({
            maxMs(result) {
                return new UnknownException(`Test Max ${result.latency.max}`);
            },
        });

        const handleRule = latencyRule.handle({
            mockLatency: new MessageResponse({ timestamps: 2000 }, defaultResponse),
            mockLatencyError: new MessageException("mock", null, undefined, undefined, defaultResponse),
            mockLatency2: new MessageResponse({ timestamps: 1500 }, defaultResponse),
            mockLatency3: new MessageResponse({}, defaultResponse),
        });

        await expect(handleRule).resolves.toBeDefined();
        await expect(handleRule).resolves.toMatchObject({
            latency: {
                avg: 1750,
                max: 2000,
            },
            status: {
                failed: 2,
                success: 2,
                total: 4,
            },
        } as RulesInterfaces.Latency.Rule);
    });
});
