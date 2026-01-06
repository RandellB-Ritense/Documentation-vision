import { Mistral } from '@mistralai/mistralai';
import 'dotenv/config';

const apiKey = process.env.MISTRAL_API_KEY;

if (!apiKey) {
    throw new Error('MISTRAL_API_KEY environment variable is not set');
}

export const mistralClient = new Mistral({ apiKey });
