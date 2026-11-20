import { NextRequest, NextResponse } from 'next/server';
import { getPayUConfig, generatePayUHash, getPayUEndpoint, isPayUConfigured } from '@/lib/payu';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, firstname, email, phone, productinfo, userId } = body;

    const config = getPayUConfig();
    const configured = isPayUConfigured();

    const txnid = `TXN_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const origin = req.headers.get('origin') || 'https://b2bmultiservice.vercel.app';
    const surl = `${origin}/api/payu/callback`;
    const furl = `${origin}/api/payu/callback`;

    const paymentParams = {
      txnid,
      amount: Number(amount) || 500,
      productinfo: productinfo || 'Wallet Points Recharge',
      firstname: firstname || 'Customer',
      email: email || 'user@b2bmultiservice.in',
      phone: phone || '9876543210',
      surl,
      furl,
      udf1: userId || 'guest',
      udf2: 'wallet_topup',
    };

    if (!configured) {
      return NextResponse.json({
        configured: false,
        message: 'PayU Merchant Key and Salt not configured yet in .env.local',
        paymentParams,
        actionUrl: getPayUEndpoint(config.env),
      });
    }

    const hash = generatePayUHash(paymentParams, config.key, config.salt);

    return NextResponse.json({
      configured: true,
      key: config.key,
      hash,
      paymentParams,
      actionUrl: getPayUEndpoint(config.env),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Payment initiation failed' }, { status: 500 });
  }
}
