import { UnknownException } from "@odg/exception";
import {
    MessageResponse,
    type MessageException,
} from "@odg/message";

import { AkamaiRule } from "~/rules";

describe("Ip Connection AkamaiRule", () => {
    const defaultResponse = { status: 200, headers: {}, data: {}};

    test("Test TeaPot error", async () => {
        const akamaiRule = new AkamaiRule(
            [] as const,
            { all: [] as const },
            { teaPot: true },
        );

        const handleRule = akamaiRule.handle({
            teaPot: new MessageResponse({}, { ...defaultResponse, status: 418 }),
        });

        await expect(handleRule).rejects.toThrowError("Akamai block with teaPot Status");
    });

    test("Test TeaPot error override", async () => {
        const akamaiRule = new AkamaiRule(
            [] as const,
            { all: [] as const },
            { teaPot: true },
        ).onError({
            teapot() {
                return new UnknownException("Override teapot");
            },
        });

        const handleRule = akamaiRule.handle({
            teaPot: new MessageResponse({}, { ...defaultResponse, status: 418 }),
        });

        await expect(handleRule).rejects.toThrowError("Override teapot");
        await expect(handleRule).rejects.toBeInstanceOf(UnknownException);
    });

    test("Test Forbidden error", async () => {
        const akamaiRule = new AkamaiRule(
            [] as const,
            { all: [] as const },
            {},
        );

        const handleRule = akamaiRule.handle({
            block: new MessageResponse(
                {},
                {
                    ...defaultResponse,
                    headers: {
                        "server-timing": "ak_p; desc=\"1758144365629_34931601_2129275848_60798_19817_20_18_15\";dur=1",
                    },
                    status: 403,
                },
            ),
        });

        await expect(handleRule).rejects.toThrowError("Akamai block with forbidden status");
    });

    test("Test Forbidden error override", async () => {
        const akamaiRule = new AkamaiRule(
            [] as const,
            { all: [] as const },
            { teaPot: true },
        ).onError({
            blocked() {
                return new UnknownException("Override status block");
            },
        });

        const handleRule = akamaiRule.handle({
            teaPot: new MessageResponse(
                {},
                {
                    ...defaultResponse,
                    headers: {
                        "server-timing": "ak_p; desc=\"1758144365629_34931601_2129275848_60798_19817_20_18_15\";dur=1",
                    },
                    status: 403,
                },
            ),
        });

        await expect(handleRule).rejects.toThrowError("Override status block");
        await expect(handleRule).rejects.toBeInstanceOf(UnknownException);
    });

    test("Teste not Akamai block", async () => {
        const akamaiRule = new AkamaiRule(
            [] as const,
            { all: [] as const },
            { teaPot: true },
        );

        const handleRule = akamaiRule.handle({
            notError: new MessageResponse(
                {},
                {
                    ...defaultResponse,
                },
            ),
            noMessage: "" as unknown as MessageException<never>,
        });

        await expect(handleRule).resolves.toBeUndefined();
    });
});
