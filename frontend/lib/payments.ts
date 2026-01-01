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
import { postJSON } from './api';

// ...

export async function createOrderAndRedirect(payload: PayPayload, createOrderUrl?: string) {
  toast.loading('Initiating payment...', { id: 'pay' });

  // If createOrderUrl is provided, we assumes it's a full URL or handle it manually?
  // But standard flow uses our API.
  // We'll trust postJSON handles the /api prefixing if we pass a relative path.
  // The default path in original code was `${API_BASE}/api/subscription/payu/create-order`
  // So relative path is `/subscription/payu/create-order`

  try {
    let data: any;

    if (createOrderUrl) {
      // Only used if caller overrides (e.g. ads). 
      // Assume caller passes full URL? Or relative? 
      // For safety, if it starts with http, use fetch, else postJSON.
      if (createOrderUrl.startsWith('http')) {
        const res = await fetch(createOrderUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'Payment Order Failed');
      } else {
        data = await postJSON(createOrderUrl, payload);
      }
    } else {
      data = await postJSON('/subscription/payu/create-order', payload);
    }

    // postJSON throws on error, so if we are here, success.
    // However, original code checked data.status === 'success'.
    if (data?.status !== 'success') {
      throw new Error(data?.message || 'Failed to create payment order');
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
