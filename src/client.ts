import cf from 'cloudflare';
import { Logger } from '@w3f/logger';

import { CredentialsData } from './types';

const waitTime = 4000;

export class Client {
    private cf: cf;

    constructor(credentials: CredentialsData, private readonly logger: Logger) {
        this.cf = cf(credentials);
    }

    async deleteDNSEntry(zone: string, record: string): Promise<void> {
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
                dnsRecords = await this.getDNSRecords(zoneID, record);
            } catch (e) {
                this.logger.error(`Could not fetch zoneID: ${e}`);
                process.exit(-1);
            }
            if (dnsRecords.length == 0) {
                continueDeletion = false;
                break;
            }
            this.logger.info(`Found these records: ${JSON.stringify(dnsRecords)}`);

            await this.delay(waitTime);

            try {
                await this.deleteDNSRecords(zoneID, dnsRecords);
            } catch (e) {
                this.logger.error(`Could not delete dns records: ${e}`);
                process.exit(-1);
            }
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

    private async getDNSRecords(zoneID: string, target: string): Promise<Array<Object>> {
        const records = await this.cf.dnsRecords.browse(zoneID);

        const results = records.result.filter((item) => item.name.includes(target));

        const output: Array<Object> = [];
        results.forEach((result) => output.push({ id: result.id, name: result.name }));

        await this.delay(waitTime);
        return output;
    }

    private async deleteDNSRecords(zoneID: string, dnsRecords: Array<any>): Promise<void> {
        for (let i = 0; i < dnsRecords.length; i++) {
            this.logger.info(`Deleting record with name ${dnsRecords[i].name}`);
            await this.cf.dnsRecords.del(zoneID, dnsRecords[i].id);

            await this.delay(waitTime);
        }
    }

    private delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
