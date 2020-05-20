import { CredentialsData } from './types';

export function getCredentials(): CredentialsData {
    const email = process.env['CLOUDFLARE_EMAIL'];
    if (!email) {
        throw new Error('Cloudflare email not found in environment, please export it as CLOUDFLARE_EMAIL');
    }
    const key = process.env['CLOUDFLARE_API_KEY'];
    if (!key) {
        throw new Error('Cloudflare API key not found in environment, please export it as CLOUDFLARE_API_KEY');
    }
    return { email, key }
}
