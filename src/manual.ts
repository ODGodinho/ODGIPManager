import { AxiosMessage } from "@odg/axios";
import { RetryAction } from "@odg/chemical-x";
import { Exception } from "@odg/exception";
import { ODGMessage } from "@odg/message";

import { IpConnectionTester } from "~/ConnectionTester";
import { AkamaiRule } from "~/rules";
import { LatencyRule } from "~/rules/LatencyRule";
import { IpInfoTester, WhoisIpTester } from "~/test";
import { IpApiTester } from "~/test/ip/IpApiTester";
import { MessageTester } from "~/test/MessageTester";

process.on("uncaughtException", (...arguments_) => {
    console.error(arguments_);
});
process.on("unhandledRejection", (...arguments_) => {
    console.error(arguments_);
});
process.on("uncaughtExceptionMonitor", (...arguments_) => {
    console.error(arguments_);
});

const axiosMs = new AxiosMessage({ timeout: 20_000 });
axiosMs.interceptors.response.use(
    (resp) => resp,
    (request) => {
        // Console.log(request);
        throw request;
    },
);

(async (): Promise<void> => {
    const contr = new AbortController();

    // eslint-disable-next-line func-style
    const myTests = () => ({
        ProxyConnect: new MessageTester<{ a: string }, { b: string }>(axiosMs, {
            url: "https://xproxy01.nuva.com.br",
            validateStatus: (): boolean => true,
        }),
        WhoisIp: new WhoisIpTester(axiosMs),
        IpInfo: new IpInfoTester(axiosMs),
        IpApi: new IpApiTester(axiosMs),
        AzulRequest: new MessageTester(axiosMs, { url: "https://google.com/" }),
    } as const);

    type Tests = ReturnType<typeof myTests>;

    // eslint-disable-next-line func-style
    const myRules = () => ({

        /** Essa é uma regra de Latência aqui vejo uma Proxy lenta */
        ProxyLatency: new LatencyRule<Tests>(

            // Aqui eu faço o teste com MyTest ProxyConnect, que seria um GET no endpoint da proxy
            [ "ProxyConnect" ] as const,
            undefined, // Aqui eu não espero nenhum outro teste ser concluído antes de rodar esse teste
            { maxMs: 15_000, avgMs: 10_000 }, // Aqui opções do teste, latência max e media permitida
        ).onError({

            // Aqui eu gostaria de tratar o erro quando acontecer para ter uma mensagem customizada
            maxMs: (result) => new Exception(
                `Latencia min: ${result.latency.min}, avg: ${result.latency.avg}, max: ${result.latency.max}`,
            ),
        }),

        IpLatency: new LatencyRule<Tests>(

            // Ja Aqui preciso ver se sites de teste de IP a latencia não é lento
            [ "WhoisIp", "IpInfo", "IpApi" ] as const,

            // Preciso ter feito o teste da proxy para seguir com essa RULE
            { all: [ "ProxyConnect" ] as const },

            // Latência media maxima para todos esses endpoints
            { avgMs: 5000 },
        ),

        AzulAkamai: new AkamaiRule<Tests>(

            // Eu teste na request Home da Azul
            [ "AzulRequest" ] as const,

            // So bato Na azul depois de bater em um desses e somente depois de testar a proxy
            { race: [ "WhoisIp", "IpInfo", "IpApi" ] as const, all: [ "ProxyConnect" ] as const },

            // Aqui se true ele trata status 418 como bloqueio Akamai
            { teaPot: true },
        ).onError({

            // Erro se acontecer um bloqueio da Akamai
            blocked: (message) => message,

            // Erro caso acontece um Teapot da Akamai, apenas se a config a cima estiver ligada
            teapot: () => new Exception("Akamai Blocked Test"),
        }),
    } as const);

    type Rules = ReturnType<typeof myRules>;

    const makeTester = new IpConnectionTester<Tests, Rules>()
        .tests(myTests())
        .signal(contr.signal)
        .rules(myRules())
        .retry(3)
        .onFailure((_exception, results) => {
            results.IpConnectionTester
                .tests(myTests())
                .rules(myRules());

            const myIp = [
                ODGMessage.isMessageResponse(results.tests.IpApi) && results.tests.IpApi.response.data.query,
                ODGMessage.isMessageResponse(results.tests.IpInfo) && results.tests.IpInfo.response.data.ip,
                ODGMessage.isMessageResponse(results.tests.WhoisIp) && results.tests.WhoisIp.response.data.ip,
            ].find((ip) => typeof ip === "string");
            console.log(myIp, "0000000000000000000000000000000000000000000000000000000000000");

            return RetryAction.Default;
        });

    const resp = await makeTester.run();

    console.log("aa", JSON.stringify(resp, null, 4));
})().catch((error) => {
    console.error(error);
});
