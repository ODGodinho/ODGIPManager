import { type Exception } from "@odg/exception";
import { type MessageException } from "@odg/message";

export namespace AkamaiInterface {

    export interface Options {

        /**
         * If true, will treat HTTP 418 responses as Akamai blocks.
         */
        teaPot?: boolean;
    }

    export interface Error {

        /**
         * Callback if identify Akamai teaPot error
         *
         * @param {MessageException<unknown> | undefined} result Exception request
         * @returns {Exception}
         */
        teapot?(result: MessageException<unknown>): Exception;

        /**
         * Callback if identify Akamai block error
         *
         * @param {MessageException<unknown> | undefined} result Exception request
         * @returns {Exception}
         */
        blocked?(result: MessageException<unknown>): Exception;
    }
}
