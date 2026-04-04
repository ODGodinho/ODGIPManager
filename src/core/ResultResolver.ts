import { type Exception } from "@odg/exception";

export class ResultResolver {

    public async resolve<T extends Record<string, Promise<Exception | unknown>>>(
        results: T,
        isCatch: boolean,
    ): Promise<Record<string, Exception | unknown>> {
        const resolved = await Promise.all(
            Object.entries(results).map(async ([ key, promise ]) => [
                key,
                await (isCatch ? promise.catch((exception: Exception) => exception) : promise),
            ] as const),
        );

        return Object.fromEntries(resolved);
    }

}
