export namespace TesterInterfaces {
    export interface WhoisIpInterface {
        "ip": string;
        "success": boolean;
        "type": string;
        "continent": string;
        "continent_code": string;
        "country": string;
        "country_code": string;
        "region": string;
        "region_code": string;
        "city": string;
        "latitude": number;
        "longitude": number;
        "is_eu": boolean;
        "postal": string;
        "calling_code": string;
        "capital": string;
        "borders": string;
        "flag": {
            "img": string;
            "emoji": string;
            "emoji_unicode": string;
        };
        "connection": {
            "asn": number;
            "org": string;
            "isp": string;
            "domain": string;
        };
        "timezone": {
            "id": string;
            "abbr": string;
            "is_dst": boolean;
            "offset": number;
            "utc": string;
            "current_time": string;
        };
    }

    export interface IpInfoInterface {
        "ip": string;
        "hostname": string;
        "city": string;
        "region": string;
        "country": string;
        "loc": string;
        "org": string;
        "postal": string;
        "timezone": string;
        "readme": string;
    }

    export interface IpApiInterface {
        "status": "success";
        "country": string;
        "countryCode": string;
        "region": string;
        "regionName": string;
        "city": string;
        "zip": string;
        "lat": number;
        "lon": number;
        "timezone": string;
        "isp": string;
        "org": string;
        "as": string;
        "query": string;
    }

}
