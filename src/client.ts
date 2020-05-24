import cf from 'cloudflare';
import { Logger } from '@w3f/logger';

import { CredentialsData } from './types';

const waitTime = 10000;

export class Client {
    private cf: cf;

    constructor(credentials: CredentialsData, private readonly logger: Logger) {
        this.cf = cf(credentials);
    }

    async deleteDNSEntry(zone: string, record: string): Promise<void> {
        const recordTypes = ['A', 'CNAME', 'TXT'];

        for (let i = 0; i < recordTypes.length; i++) {
            await this.deleteDNSEntryType(zone, record, recordTypes[i]);
        }
    }

    private async deleteDNSEntryType(zone: string, record: string, recordType = 'TXT'): Promise<void> {
        let zoneID: string;
        try {
            zoneID = await this.getZoneID(zone);
        } catch (e) {
            this.logger.error(`Could not fetch zoneID: ${e}`);
            process.exit(-1);
        }
        this.logger.info(`zone id for ${zone} is ${zoneID}`);

        let dnsRecords: Array<Object>;

        let continueDeletion = true;
        while (continueDeletion) {
            try {
                dnsRecords = await this.getDNSRecords(zoneID, record, recordType);
            } catch (e) {
                this.logger.error(`Could not get ${recordType} records list: ${e}`);

                if (this.isTooManyRequestsError(e)) {
                    await this.delay(waitTime);
                    continue;
                }
            }
            if (dnsRecords.length == 0) {
                continueDeletion = false;
                break;
            }
            this.logger.info(`Found these ${recordType} records: ${JSON.stringify(dnsRecords)}`);

            await this.delay(waitTime);

            await this.deleteDNSRecords(zoneID, dnsRecords, recordType);
        }
    }

    private async getZoneID(target: string): Promise<string> {
        const zones = await this.cf.zones.browse();

        const zone = zones.result.find((item) => item.name === target);

        if (zone) {
            await this.delay(waitTime);
            return zone.id;
        }

        throw new Error(`Could not find zone with name ${target}`);
    }

    private async getDNSRecords(zoneID: string, target: string, recordType: string): Promise<Array<Object>> {
        const options = {
            type: recordType,
            per_page: 100
        };
        const records = await this.cf.dnsRecords.browse(zoneID, options);

        const results = records.result.filter((item) => item.name.includes(target));

        const output: Array<Object> = [];
        if (results.length) {
            results.forEach((result) => output.push({ id: result.id, name: result.name }));
        }

        await this.delay(waitTime);
        return output;
    }

    private async deleteDNSRecords(zoneID: string, dnsRecords: Array<any>, recordType: string): Promise<void> {
        for (let i = 0; i < dnsRecords.length; i++) {
            this.logger.info(`Deleting ${recordType} record with name ${dnsRecords[i].name}`);
            try {
                await this.cf.dnsRecords.del(zoneID, dnsRecords[i].id);
            } catch (e) {
                this.logger.error(`Could not delete dns record: ${e}`);
                if (this.isTooManyRequestsError(e)) {
                    await this.delay(waitTime);
                    continue;
                }
            }
            await this.delay(waitTime);
        }
    }

    private delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private isTooManyRequestsError(e): boolean {
        return e.statusCode === 429 && e.statusMessage === 'Too Many Requests';
    }
}
