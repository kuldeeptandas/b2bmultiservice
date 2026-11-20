// PayU India Payment Gateway Integration
// Designed for easy API key configuration by portal owner

import crypto from 'crypto';

export interface PayUConfig {
  key: string;
  salt: string;
  env: 'test' | 'live';
}

export function getPayUConfig(): PayUConfig {
  return {
    key: (process.env.NEXT_PUBLIC_PAYU_KEY || '').trim(),
    salt: (process.env.PAYU_SALT || '').trim(),
    env: (process.env.NEXT_PUBLIC_PAYU_ENV === 'live' ? 'live' : 'test'),
  };
}

export function isPayUConfigured(): boolean {
  const { key, salt } = getPayUConfig();
  return Boolean(key && salt && key !== 'YOUR_PAYU_KEY_HERE' && salt !== 'YOUR_PAYU_SALT_HERE');
}

export function getPayUEndpoint(env: 'test' | 'live' = 'test'): string {
  return env === 'live'
    ? 'https://secure.payu.in/_payment'
    : 'https://test.payu.in/_payment';
}

export interface PayUPaymentParams {
  txnid: string;
  amount: number | string;
  productinfo: string;
  firstname: string;
  email: string;
  phone: string;
  surl?: string;
  furl?: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
}

/**
 * Generates the PayU SHA512 checksum hash required for transaction initiation.
 * Formula: sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)
 */
export function generatePayUHash(params: PayUPaymentParams, key: string, salt: string): string {
  const amountStr = typeof params.amount === 'number' ? params.amount.toFixed(2) : parseFloat(params.amount).toFixed(2);
  const hashString = [
    key,
    params.txnid,
    amountStr,
    params.productinfo,
    params.firstname,
    params.email,
    params.udf1 || '',
    params.udf2 || '',
    params.udf3 || '',
    params.udf4 || '',
    params.udf5 || '',
    '', '', '', '', '', // udf6 - udf10 empty
    salt
  ].join('|');

  return crypto.createHash('sha512').update(hashString).digest('hex');
}

/**
 * Validates the PayU response SHA512 hash returned after payment.
 * Formula: sha512(SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
 */
export function verifyPayUResponseHash(resParams: Record<string, string>, salt: string): boolean {
  const { key, txnid, amount, productinfo, firstname, email, status, hash, additionalCharges } = resParams;
  const udf1 = resParams.udf1 || '';
  const udf2 = resParams.udf2 || '';
  const udf3 = resParams.udf3 || '';
  const udf4 = resParams.udf4 || '';
  const udf5 = resParams.udf5 || '';

  let hashSeq = `${salt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
  if (additionalCharges) {
    hashSeq = `${additionalCharges}|${hashSeq}`;
  }

  const calculated = crypto.createHash('sha512').update(hashSeq).digest('hex');
  return calculated.toLowerCase() === (hash || '').toLowerCase();
}
