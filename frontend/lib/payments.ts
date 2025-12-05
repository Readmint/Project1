// lib/payments.ts
'use client';

import { toast } from 'react-hot-toast';

export type PayPayload = {
  planId: string;
  amount: number | string;
  userId: string;
  userEmail: string;
  userPhone?: string;
  firstName?: string;
  lastName?: string;
  surl?: string;
  furl?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const PAYU_PAYMENT_URL =
  process.env.NEXT_PUBLIC_PAYU_MODE === 'production'
    ? 'https://secure.payu.in/_payment'
    : 'https://test.payu.in/_payment';

/**
 * Create an order on the backend and redirect to PayU via a POST form.
 * - payload: details needed by backend to create a PayU order
 * - createOrderUrl: optional override if you want a different endpoint (ads vs subscription).
 *
 * Throws on error (caller should handle loading state).
 */
export async function createOrderAndRedirect(payload: PayPayload, createOrderUrl?: string) {
  toast.loading('Initiating payment...', { id: 'pay' });

  const endpoint = createOrderUrl || `${API_BASE}/api/subscription/payu/create-order`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || !data || data.status !== 'success') {
      const errMsg = data?.message || `Failed to create payment order (status ${res?.status})`;
      throw new Error(errMsg);
    }

    const params = data.data || {};

    // Hash may be returned as a plain string or JSON-stringified object
    let payuHash = '';
    if (params.hash) {
      try {
        const parsed = typeof params.hash === 'string' ? JSON.parse(params.hash) : params.hash;
        payuHash = parsed.v1 || parsed.v2 || parsed.hash || '';
      } catch {
        payuHash = typeof params.hash === 'string' ? params.hash : '';
      }
    }

    // Build and submit form to PayU
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = PAYU_PAYMENT_URL;

    const fields: Record<string, string> = {
      key: params.key || '',
      txnid: params.txnid || '',
      amount: (params.amount || payload.amount || '').toString(),
      productinfo: params.productinfo || `Order - ${payload.planId}`,
      firstname: params.firstname || payload.firstName || '',
      email: params.email || payload.userEmail || '',
      phone: params.phone || payload.userPhone || '',
      surl: params.surl || payload.surl || `${window.location.origin}/payment/success`,
      furl: params.furl || payload.furl || `${window.location.origin}/payment/failure`,
      hash: payuHash || '',
      service_provider: params.service_provider || 'payu_paisa',
      udf1: params.udf1 || '',
      udf2: params.udf2 || '',
      udf3: params.udf3 || '',
      udf4: params.udf4 || '',
      udf5: params.udf5 || '',
    };

    Object.entries(fields).forEach(([k, v]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = k;
      input.value = v ?? '';
      form.appendChild(input);
    });

    document.body.appendChild(form);
    toast.success('Redirecting to payment gateway...', { id: 'pay' });
    form.submit();
  } catch (err: any) {
    console.error('createOrderAndRedirect error:', err);
    toast.error(err?.message || 'Payment initialization failed', { id: 'pay' });
    throw err;
  }
}
