import { IpManagerException } from "~/exceptions/IpManagerException";
import { type IpManagerInterfaces } from "~/interfaces/IpConnection";

export class ConfigValidator {

    public static validate<
        Tests extends IpManagerInterfaces.TestsRecord,
        Rules extends IpManagerInterfaces.RulesRecord<Tests>,
    >(
        tests?: Tests,
        rules?: Rules,
    ): void {
        if (!tests) {
            throw new IpManagerException("Tests not set, please use the .tests() function!");
        }

        if (!rules) {
            throw new IpManagerException("Rules not set, please use the .rules() function!");
        }
    }

}
