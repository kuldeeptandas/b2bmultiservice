import { NextRequest, NextResponse } from 'next/server';
import { getPayUConfig, verifyPayUResponseHash } from '@/lib/payu';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const data: Record<string, string> = {};
    formData.forEach((val, key) => {
      data[key] = val.toString();
    });

    const config = getPayUConfig();
    const isValid = config.salt ? verifyPayUResponseHash(data, config.salt) : true;
    const status = data.status || 'unknown';
    const txnid = data.txnid || '';
    const amount = data.amount || '0';

    const origin = req.headers.get('origin') || 'https://b2bmultiservice.vercel.app';
    const redirectUrl = new URL('/', origin);
    redirectUrl.searchParams.set('payment_status', status);
    redirectUrl.searchParams.set('txnid', txnid);
    redirectUrl.searchParams.set('amount', amount);
    redirectUrl.searchParams.set('verified', isValid ? 'true' : 'false');

    return NextResponse.redirect(redirectUrl.toString(), 303);
  } catch (err: any) {
    return NextResponse.redirect(new URL('/?payment_status=error', req.url), 303);
  }
}
