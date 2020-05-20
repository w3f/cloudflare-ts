import { createLogger } from '@w3f/logger';

import { Client } from '../client';
import { CredentialsData } from '../types';
import { getCredentials } from '../credentials';

export async function deleteDNSAction(cmd: any): Promise<void> {
    const logger = createLogger();
    if (!cmd.zone) {
        logger.error(`Please specify a zone name`);
        process.exit(-1);
    }

    if (!cmd.record) {
        logger.error(`Please specify a record name to delete`);
        process.exit(-1);
    }

    let credentials: CredentialsData;
    try {
        credentials = getCredentials();
    } catch (e) {
        logger.error(`Could not get credentials: ${e}`);
        process.exit(-1);
    }

    const client = new Client(credentials, logger);

    try {
        await client.deleteDNSEntry(cmd.zone, cmd.record);
    } catch (e) {
        logger.error(`During client.deleteDNS: ${e.toString()}`);
        process.exit(-1);
    }
}
