import { Request, Response } from 'express';
import crypto from 'crypto';
import { getDatabase } from '../config/database';
import { logger } from '../utils/logger';
import SHA256 from 'crypto-js/sha256';
import encHex from 'crypto-js/enc-hex';

// PayU Configuration Interface
interface PayUConfig {
  merchantKey: string;
  merchantSalt: string;
  baseUrl: string;
  successUrl: string;
  failureUrl: string;
}

// Interface for subscription plan
interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  duration: string;
}

// Interface for payment order
interface PaymentOrder {
  txnid: string;
  plan_id: string;
  user_id: string;
  amount: number;
  email: string;
  phone?: string;
  firstname: string;
  status: string;
  created_at: Date;
}

// Interface for user subscription
interface UserSubscription {
  id?: string;
  user_id: string;
  plan_id: string;
  status: string;
  payment_txn_id?: string;
  amount?: number;
  start_date: Date;
  end_date?: Date | null;
  created_at: Date;
}

// Dynamic PayU configuration function
const getPayUConfig = (): PayUConfig => {
  const merchantKey = process.env.PAYU_MERCHANT_KEY || '';
  const merchantSalt = process.env.PAYU_MERCHANT_SALT || '';

  // Debug logging
  console.log('🔑 PayU Config Loaded:');
  console.log('   Key exists:', !!merchantKey);
  console.log('   Key value (first 4 chars):', merchantKey ? merchantKey.substring(0, 4) + '...' : 'EMPTY');
  console.log('   Salt exists:', !!merchantSalt);
  console.log('   NODE_ENV:', process.env.NODE_ENV);

  // Determine base URL based on environment
  let baseUrl = 'https://test.payu.in'; // Default to test
  if (process.env.NODE_ENV === 'production') {
    baseUrl = 'https://secure.payu.in';
  } else if (process.env.PAYU_MODE === 'production') {
    baseUrl = 'https://secure.payu.in';
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  return {
    merchantKey,
    merchantSalt,
    baseUrl,
    successUrl: `${frontendUrl}/payment/success`,
    failureUrl: `${frontendUrl}/payment/failure`
  };
};

export const getSubscriptionPlans = async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDatabase();
    let subscriptionPlans: SubscriptionPlan[];

    if (db.collection) {
      // Firebase - Get subscription plans
      const plansSnapshot = await db.collection('subscription_plans').get();
      subscriptionPlans = plansSnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      })) as SubscriptionPlan[];
    } else {
      // MySQL - Get subscription plans
      const [rows]: any = await db.execute('SELECT * FROM subscription_plans ORDER BY price_monthly ASC');

      // Fix the JSON parsing with better error handling
      subscriptionPlans = rows.map((row: any) => {
        let featuresArray: string[] = [];

        try {
          if (row.features) {
            if (typeof row.features === 'string') {
              // Check if it's already a JSON string
              if (row.features.trim().startsWith('[') && row.features.trim().endsWith(']')) {
                // Parse as JSON
                featuresArray = JSON.parse(row.features);
              } else if (row.features.includes(',')) {
                // Split comma-separated string
                featuresArray = row.features.split(',').map((f: string) => f.trim());
              } else {
                // Single feature
                featuresArray = [row.features.trim()];
              }
            } else if (Array.isArray(row.features)) {
              // Already an array
              featuresArray = row.features;
            }
          }
        } catch (error) {
          console.warn(`⚠️ Failed to parse features for plan ${row.id}:`, row.features);
          // Default features if parsing fails
          featuresArray = ['Feature parsing error'];
        }

        return {
          id: row.id,
          name: row.name,
          description: row.description,
          price_monthly: row.price_monthly || 0,
          price_yearly: row.price_yearly || 0,
          features: featuresArray,
          duration: row.duration || 'monthly'
        };
      }) as SubscriptionPlan[];
    }

    // If no plans in database, return default plans
    if (!subscriptionPlans || subscriptionPlans.length === 0) {
      subscriptionPlans = [
        {
          id: 'free',
          name: 'Free Plan',
          description: 'Perfect for casual readers',
          price_monthly: 0,
          price_yearly: 0,
          features: [
            'Access to free issues',
            'Limited article views',
            'Basic bookmarking',
            'Community access'
          ],
          duration: 'monthly'
        },
        {
          id: 'basic',
          name: 'Basic Plan',
          description: 'For regular readers',
          price_monthly: 100,
          price_yearly: 1000,
          features: [
            'All Free features',
            '5 premium issues per month',
            'Unlimited bookmarks',
            'Download for offline reading',
            'Ad-free experience',
            'Email support'
          ],
          duration: 'monthly'
        },
        {
          id: 'premium',
          name: 'Premium Plan',
          description: 'For passionate readers',
          price_monthly: 200,
          price_yearly: 2000,
          features: [
            'All Basic features',
            'Unlimited premium issues',
            'Early access to new releases',
            'Exclusive author content',
            'Priority support',
            'Certificate of achievements',
            'Monthly webinars'
          ],
          duration: 'monthly'
        }
      ];
    }

    // Log for debugging
    console.log(`📊 Returning ${subscriptionPlans.length} subscription plans`);

    res.status(200).json({
      status: 'success',
      data: { plans: subscriptionPlans }
    });
  } catch (error: any) {
    logger.error('Get subscription plans error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

export const createPayUOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { planId, amount, userId, userEmail, userPhone, firstName, lastName } = req.body;

    console.log('📦 Received PayU order request:', {
      planId, amount, userId, userEmail, userPhone, firstName
    });

    if (!planId || !amount || !userId || !userEmail) {
      console.error('❌ Missing required fields');
      res.status(400).json({
        status: 'error',
        message: 'Missing required fields: planId, amount, userId, userEmail are required'
      });
      return;
    }

    // Get PayU configuration dynamically
    const PAYU_CONFIG = getPayUConfig();

    // Check if configuration is valid
    if (!PAYU_CONFIG.merchantKey || !PAYU_CONFIG.merchantSalt) {
      console.error('❌ PayU configuration missing!');
      console.error('   Merchant Key:', PAYU_CONFIG.merchantKey || 'MISSING');
      console.error('   Merchant Salt:', PAYU_CONFIG.merchantSalt || 'MISSING');

      res.status(500).json({
        status: 'error',
        message: 'Payment gateway configuration error. Please contact support.'
      });
      return;
    }

    console.log('✅ PayU Configuration loaded successfully');
    console.log('   Using Key:', PAYU_CONFIG.merchantKey.substring(0, 6) + '...');
    console.log('   Using Salt:', PAYU_CONFIG.merchantSalt.substring(0, 6) + '...');
    console.log('   Base URL:', PAYU_CONFIG.baseUrl);

    // Generate transaction ID
    const txnId = `TXN${Date.now()}${Math.floor(Math.random() * 10000)}`;
    console.log('📝 Generated Transaction ID:', txnId);

    // Prepare parameters for hash
    const productInfo = 'Magazine Subscription';
    const firstNameValue = firstName || 'User';
    const phoneValue = userPhone || '9999999999';

    // UDF parameters (User Defined Fields) - PayU expects these
    const udf1 = userId || 'guest'; // User ID
    const udf2 = planId; // Plan ID
    const udf3 = 'monthly'; // Billing cycle
    const udf4 = userEmail; // Email
    const udf5 = phoneValue; // Phone

    // CORRECTED: PayU hash format with UDF parameters
    // According to error: sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)
    const hashStringV1 = `${PAYU_CONFIG.merchantKey}|${txnId}|${amount}|${productInfo}|${firstNameValue}|${userEmail}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${PAYU_CONFIG.merchantSalt}`;

    console.log('🔐 Hash String V1 for SHA512:', hashStringV1);

    // Calculate v1 hash (main hash)
    const hashV1 = crypto.createHash('sha512').update(hashStringV1).digest('hex');
    console.log('✅ Generated Hash V1:', hashV1);
    console.log('✅ Hash V1 length:', hashV1.length);

    // Calculate v2 hash (reverse hash format)
    const hashStringV2 = `${PAYU_CONFIG.merchantSalt}|${txnId}|${amount}|${productInfo}|${firstNameValue}|${userEmail}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||||`;
    const hashV2 = crypto.createHash('sha512').update(hashStringV2).digest('hex');
    console.log('✅ Generated Hash V2:', hashV2);

    // Create hash object exactly as PayU expects
    const hashObject = {
      v1: hashV1,
      v2: hashV2
    };

    // Stringify the hash object for sending to frontend
    const hashString = JSON.stringify(hashObject);
    console.log('📦 Final Hash Object:', hashObject);
    console.log('📦 Hash String to send:', hashString);

    // Save order to database
    const db = getDatabase();
    const orderData: PaymentOrder = {
      txnid: txnId,
      plan_id: planId,
      user_id: userId,
      amount: amount,
      email: userEmail,
      phone: phoneValue,
      firstname: firstNameValue,
      status: 'pending',
      created_at: new Date()
    };

    try {
      if (db.collection) {
        // Firebase
        await db.collection('payment_orders').doc(txnId).set(orderData);
        console.log('💾 Order saved to Firebase');
      } else {
        // MySQL
        await db.execute(
          `INSERT INTO payment_orders (id, txnid, plan_id, user_id, amount, email, phone, firstname, status, created_at) 
           VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
          [txnId, planId, userId, amount, userEmail, phoneValue, firstNameValue, new Date()]
        );
        console.log('💾 Order saved to MySQL');
      }
    } catch (dbError: any) {
      console.error('⚠️ Database save error (continuing):', dbError.message);
      // Continue even if database save fails
    }

    // Return PayU payment parameters with UDF fields
    const responseData = {
      key: PAYU_CONFIG.merchantKey,
      txnid: txnId,
      amount: amount.toString(),
      productinfo: productInfo,
      firstname: firstNameValue,
      email: userEmail,
      phone: phoneValue,
      surl: PAYU_CONFIG.successUrl,
      furl: PAYU_CONFIG.failureUrl,
      hash: hashString, // Send JSON stringified hash object
      service_provider: 'payu_paisa',
      // UDF parameters - IMPORTANT: must match hash calculation
      udf1: udf1,
      udf2: udf2,
      udf3: udf3,
      udf4: udf4,
      udf5: udf5
    };

    console.log('✅ PayU Order Created Successfully:', {
      txnid: txnId,
      amount: amount,
      key: PAYU_CONFIG.merchantKey.substring(0, 6) + '...',
      salt: PAYU_CONFIG.merchantSalt.substring(0, 6) + '...',
      udf1, udf2, udf3, udf4, udf5
    });

    console.log('📋 Full response data to frontend:', {
      ...responseData,
      hash: hashObject // Show hash object in log, not string
    });

    res.status(200).json({
      status: 'success',
      data: responseData
    });

  } catch (error: any) {
    logger.error('Create PayU order error:', error);
    console.error('❌ Detailed error:', error.stack);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create payment order: ' + error.message
    });
  }
};

export const verifyPayUPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      txnid,
      amount,
      productinfo,
      firstname,
      email,
      status,
      hash,
      key,
      addedon,
      error,
      error_Message
    } = req.body;

    console.log('🔍 Verifying PayU Payment:', { txnid, status, amount });

    // Get PayU configuration
    const PAYU_CONFIG = getPayUConfig();

    // Verify hash
    const reverseHashString = `${PAYU_CONFIG.merchantSalt}|${status}|||||||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${PAYU_CONFIG.merchantKey}`;
    const calculatedHash = SHA256(reverseHashString).toString(encHex).toLowerCase();

    console.log('🔐 Hash Verification:', {
      receivedHash: hash ? hash.substring(0, 20) + '...' : 'MISSING',
      calculatedHash: calculatedHash.substring(0, 20) + '...',
      match: calculatedHash === hash
    });

    const db = getDatabase();

    if (calculatedHash === hash && status === 'success') {
      // Payment successful
      console.log('✅ Payment successful for transaction:', txnid);

      // Get order details from database
      let orderData: any;

      if (db.collection) {
        const doc = await db.collection('payment_orders').doc(txnid).get();
        orderData = doc.exists ? doc.data() : null;
      } else {
        const [rows]: any = await db.execute(
          'SELECT * FROM payment_orders WHERE txnid = ?',
          [txnid]
        );
        orderData = rows[0];
      }

      if (orderData) {
        console.log('📋 Found order:', orderData.plan_id, 'for user:', orderData.user_id);

        // Update order status
        if (db.collection) {
          await db.collection('payment_orders').doc(txnid).update({
            status: 'completed',
            payment_date: new Date(addedon),
            updated_at: new Date()
          });

          // Create subscription
          const subscriptionData: UserSubscription = {
            user_id: orderData.user_id,
            plan_id: orderData.plan_id,
            status: 'active',
            payment_txn_id: txnid,
            amount: parseFloat(amount),
            start_date: new Date(),
            end_date: calculateEndDate('monthly'),
            created_at: new Date()
          };

          const subscriptionRef = await db.collection('user_subscriptions').add(subscriptionData);
          console.log('✅ Subscription created with ID:', subscriptionRef.id);
        } else {
          await db.execute(
            `UPDATE payment_orders SET status = 'completed', payment_date = ?, updated_at = ? WHERE txnid = ?`,
            [new Date(addedon), new Date(), txnid]
          );

          await db.execute(
            `INSERT INTO user_subscriptions (id, user_id, plan_id, status, payment_txn_id, amount, start_date, end_date, created_at)
             VALUES (UUID(), ?, ?, 'active', ?, ?, ?, ?, ?)`,
            [orderData.user_id, orderData.plan_id, txnid, amount, new Date(), calculateEndDate('monthly'), new Date()]
          );
          console.log('✅ Subscription created in MySQL');
        }

        // Return success response to PayU
        res.send('Payment successful. Redirecting...');
      } else {
        console.error('❌ Order not found for txnid:', txnid);
        res.status(400).send('Order not found');
      }
    } else {
      // Payment failed
      console.error('❌ Payment failed for transaction:', txnid, 'Status:', status);
      if (db.collection) {
        await db.collection('payment_orders').doc(txnid).update({
          status: 'failed',
          error_message: error_Message || error,
          updated_at: new Date()
        });
      } else {
        await db.execute(
          `UPDATE payment_orders SET status = 'failed', error_message = ?, updated_at = ? WHERE txnid = ?`,
          [error_Message || error, new Date(), txnid]
        );
      }
      res.send('Payment failed. Redirecting...');
    }

  } catch (error: any) {
    logger.error('Verify PayU payment error:', error);
    console.error('❌ Verification error:', error.stack);
    res.status(500).send('Payment verification error');
  }
};

export const getPaymentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { txnid } = req.params;
    const db = getDatabase();

    console.log('📊 Fetching payment status for:', txnid);

    let paymentDetails;

    if (db.collection) {
      const doc = await db.collection('payment_orders').doc(txnid).get();
      paymentDetails = doc.exists ? doc.data() : null;
    } else {
      const [rows]: any = await db.execute(
        'SELECT * FROM payment_orders WHERE txnid = ?',
        [txnid]
      );
      paymentDetails = rows[0];
    }

    if (!paymentDetails) {
      res.status(404).json({
        status: 'error',
        message: 'Payment details not found'
      });
      return;
    }

    console.log('✅ Payment status found:', paymentDetails.status);

    res.status(200).json({
      status: 'success',
      data: paymentDetails
    });
  } catch (error: any) {
    logger.error('Get payment status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get payment status'
    });
  }
};

// Webhook for PayU (optional but recommended)
export const payuWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const postData = req.body;

    console.log('🌐 PayU Webhook received:', postData);

    // Get PayU configuration
    const PAYU_CONFIG = getPayUConfig();

    // Verify hash
    const hashString = `${PAYU_CONFIG.merchantKey}|${postData.txnid}|${postData.amount}|${postData.productinfo}|${postData.firstname}|${postData.email}|||||||||||${PAYU_CONFIG.merchantSalt}`;
    const calculatedHash = SHA256(hashString).toString(encHex).toLowerCase();

    if (calculatedHash === postData.hash) {
      // Process webhook data
      console.log('✅ Webhook hash verified, processing...');

      // Update your database here based on webhook data
      // You might want to update payment status, send email notifications, etc.

      logger.info('PayU webhook processed successfully:', postData);

      res.status(200).send('OK');
    } else {
      console.error('❌ Webhook hash mismatch');
      res.status(400).send('Invalid hash');
    }
  } catch (error: any) {
    logger.error('PayU webhook error:', error);
    res.status(500).send('Webhook error');
  }
};

// Get user subscriptions
export const getUserSubscriptions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const db = getDatabase();

    if (!userId) {
      res.status(400).json({
        status: 'error',
        message: 'User ID is required'
      });
      return;
    }

    console.log('📊 Fetching subscriptions for user:', userId);

    let subscriptions;

    if (db.collection) {
      // Firebase - Get user subscriptions
      const snapshot = await db.collection('user_subscriptions')
        .where('user_id', '==', userId)
        .orderBy('created_at', 'desc')
        .get();
      subscriptions = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

      // Get plan details for each subscription
      if (subscriptions.length > 0) {
        const plansSnapshot = await db.collection('subscription_plans').get();
        const plansMap = new Map();
        plansSnapshot.docs.forEach((doc: any) => {
          plansMap.set(doc.id, doc.data());
        });

        subscriptions = subscriptions.map((sub: any) => ({
          ...sub,
          plan_details: plansMap.get(sub.plan_id) || null
        }));
      }
    } else {
      // MySQL - Get user subscriptions with plan details
      const [rows]: any = await db.execute(
        `SELECT 
          us.*,
          sp.name as plan_name,
          sp.description as plan_description,
          sp.price_monthly,
          sp.price_yearly,
          sp.features as plan_features,
          sp.duration as plan_duration,
          CASE 
            WHEN us.end_date IS NULL THEN 'active'
            WHEN us.end_date > NOW() THEN 'active'
            ELSE 'expired'
          END as current_status
         FROM user_subscriptions us
         LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
         WHERE us.user_id = ?
         ORDER BY us.created_at DESC`,
        [userId]
      );

      subscriptions = rows.map((row: any) => {
        let featuresArray: string[] = [];
        try {
          if (row.plan_features && typeof row.plan_features === 'string') {
            featuresArray = JSON.parse(row.plan_features);
          }
        } catch (error) {
          featuresArray = [];
        }

        return {
          ...row,
          plan_features: featuresArray,
          status: row.current_status // Use calculated status
        };
      });
    }

    console.log(`✅ Found ${subscriptions?.length || 0} subscriptions for user`);

    res.status(200).json({
      status: 'success',
      data: { subscriptions: subscriptions || [] }
    });
  } catch (error: any) {
    logger.error('Get user subscriptions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get user subscriptions'
    });
  }
};

// Get current active subscription for a user
export const getCurrentSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const db = getDatabase();

    if (!userId) {
      res.status(400).json({
        status: 'error',
        message: 'User ID is required'
      });
      return;
    }

    console.log('🔍 Finding current subscription for user:', userId);

    let currentSubscription;

    if (db.collection) {
      // Firebase - Get active subscription
      const snapshot = await db.collection('user_subscriptions')
        .where('user_id', '==', userId)
        .where('status', '==', 'active')
        .orderBy('created_at', 'desc')
        .limit(1)
        .get();

      if (!snapshot.empty) {
        const subscriptionDoc = snapshot.docs[0];
        currentSubscription = { id: subscriptionDoc.id, ...subscriptionDoc.data() };

        // Get plan details
        const planDoc = await db.collection('subscription_plans').doc(currentSubscription.plan_id).get();
        if (planDoc.exists) {
          currentSubscription.plan_details = planDoc.data();
        }
        console.log('✅ Found active Firebase subscription');
      }
    } else {
      // MySQL - Get active subscription with plan details
      const [rows]: any = await db.execute(
        `SELECT 
          us.*,
          sp.name as plan_name,
          sp.description as plan_description,
          sp.price_monthly,
          sp.price_yearly,
          sp.features as plan_features,
          sp.duration as plan_duration
         FROM user_subscriptions us
         LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
         WHERE us.user_id = ? 
           AND us.status = 'active'
           AND (us.end_date IS NULL OR us.end_date > NOW())
         ORDER BY us.created_at DESC
         LIMIT 1`,
        [userId]
      );

      if (rows.length > 0) {
        let featuresArray: string[] = [];
        try {
          if (rows[0].plan_features && typeof rows[0].plan_features === 'string') {
            featuresArray = JSON.parse(rows[0].plan_features);
          }
        } catch (error) {
          featuresArray = [];
        }

        currentSubscription = {
          ...rows[0],
          plan_features: featuresArray
        };
        console.log('✅ Found active MySQL subscription');
      }
    }

    res.status(200).json({
      status: 'success',
      data: { subscription: currentSubscription || null }
    });
  } catch (error: any) {
    logger.error('Get current subscription error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get current subscription'
    });
  }
};

// Activate free subscription
export const activateFreeSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, planId } = req.body;

    if (!userId || !planId) {
      res.status(400).json({
        status: 'error',
        message: 'User ID and Plan ID are required'
      });
      return;
    }

    console.log('🆓 Activating free subscription for user:', userId, 'plan:', planId);

    const db = getDatabase();

    // Check if user already has an active subscription
    let existingSubscription;

    if (db.collection) {
      // Firebase
      const snapshot = await db.collection('user_subscriptions')
        .where('user_id', '==', userId)
        .where('status', '==', 'active')
        .get();
      existingSubscription = !snapshot.empty;
    } else {
      // MySQL
      const [rows]: any = await db.execute(
        `SELECT id FROM user_subscriptions 
         WHERE user_id = ? 
           AND status = 'active'
           AND (end_date IS NULL OR end_date > NOW())`,
        [userId]
      );
      existingSubscription = rows.length > 0;
    }

    if (existingSubscription) {
      console.log('⚠️ User already has active subscription');
      res.status(400).json({
        status: 'error',
        message: 'User already has an active subscription'
      });
      return;
    }

    // Check if plan is free
    let plan: any;
    if (db.collection) {
      const planDoc = await db.collection('subscription_plans').doc(planId).get();
      if (planDoc.exists) {
        plan = planDoc.data();
      }
    } else {
      const [rows]: any = await db.execute(
        'SELECT price_monthly FROM subscription_plans WHERE id = ?',
        [planId]
      );
      plan = rows[0];
    }

    if (!plan) {
      console.error('❌ Plan not found:', planId);
      res.status(404).json({
        status: 'error',
        message: 'Subscription plan not found'
      });
      return;
    }

    if (plan.price_monthly > 0) {
      console.error('❌ Plan is not free:', plan.price_monthly);
      res.status(400).json({
        status: 'error',
        message: 'Only free plans can be activated without payment'
      });
      return;
    }

    // Create free subscription
    const subscriptionData: UserSubscription = {
      user_id: userId,
      plan_id: planId,
      status: 'active',
      start_date: new Date(),
      end_date: null, // Free plan doesn't expire
      created_at: new Date()
    };

    if (db.collection) {
      const subscriptionRef = await db.collection('user_subscriptions').add(subscriptionData);
      console.log('✅ Free subscription activated in Firebase:', subscriptionRef.id);
    } else {
      await db.execute(
        `INSERT INTO user_subscriptions (id, user_id, plan_id, status, start_date, end_date, created_at)
         VALUES (UUID(), ?, ?, 'active', ?, NULL, ?)`,
        [userId, planId, new Date(), new Date()]
      );
      console.log('✅ Free subscription activated in MySQL');
    }

    res.status(200).json({
      status: 'success',
      message: 'Free subscription activated successfully'
    });
  } catch (error: any) {
    logger.error('Activate free subscription error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to activate free subscription'
    });
  }
};

// Cancel subscription
export const cancelSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const { subscriptionId } = req.params;
    const { userId } = req.body;

    if (!subscriptionId || !userId) {
      res.status(400).json({
        status: 'error',
        message: 'Subscription ID and User ID are required'
      });
      return;
    }

    console.log('🚫 Cancelling subscription:', subscriptionId, 'for user:', userId);

    const db = getDatabase();

    // Verify ownership
    let subscription: any;
    if (db.collection) {
      const doc = await db.collection('user_subscriptions').doc(subscriptionId).get();
      if (doc.exists) {
        subscription = doc.data();
        if (subscription.user_id !== userId) {
          console.error('❌ Unauthorized cancellation attempt');
          res.status(403).json({
            status: 'error',
            message: 'Not authorized to cancel this subscription'
          });
          return;
        }
      }
    } else {
      const [rows]: any = await db.execute(
        'SELECT * FROM user_subscriptions WHERE id = ? AND user_id = ?',
        [subscriptionId, userId]
      );
      if (rows.length === 0) {
        console.error('❌ Subscription not found');
        res.status(404).json({
          status: 'error',
          message: 'Subscription not found'
        });
        return;
      }
      subscription = rows[0];
    }

    if (!subscription) {
      console.error('❌ Subscription not found');
      res.status(404).json({
        status: 'error',
        message: 'Subscription not found'
      });
      return;
    }

    // Update subscription status
    if (db.collection) {
      await db.collection('user_subscriptions').doc(subscriptionId).update({
        status: 'cancelled',
        updated_at: new Date()
      });
      console.log('✅ Subscription cancelled in Firebase');
    } else {
      await db.execute(
        `UPDATE user_subscriptions 
         SET status = 'cancelled', updated_at = NOW()
         WHERE id = ? AND user_id = ?`,
        [subscriptionId, userId]
      );
      console.log('✅ Subscription cancelled in MySQL');
    }

    res.status(200).json({
      status: 'success',
      message: 'Subscription cancelled successfully'
    });
  } catch (error: any) {
    logger.error('Cancel subscription error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to cancel subscription'
    });
  }
};

// --- AUTHOR PLANS & HISTORY ---

export const getAuthorSubscriptionPlans = async (req: Request, res: Response): Promise<void> => {
  // Hardcoded plans as per requirement
  const plans = [
    {
      id: 'author_free',
      name: 'Free Plan',
      description: 'Essential tools for writers',
      price_monthly: 0,
      price_yearly: 0,
      features: [
        'Pay-per-use Plagiarism Check',
        'Standard Review Speed',
        'Basic Analytics',
        'Community Access'
      ],
      duration: 'monthly',
      badge: 'None'
    },
    {
      id: 'author_standard',
      name: 'Standard Plan',
      description: 'For regular contributors',
      price_monthly: 199,
      price_yearly: 1999,
      features: [
        '5 Free Plagiarism Checks/mo',
        'Priority Review Speed',
        'Bronze Author Badge',
        'Standard Support',
        'Detailed Analytics'
      ],
      duration: 'monthly',
      badge: 'Bronze'
    },
    {
      id: 'author_premium',
      name: 'Premium Plan',
      description: 'Maximum power & freedom',
      price_monthly: 499,
      price_yearly: 4999,
      features: [
        'Unlimited Plagiarism Checks',
        'Instant/Priority Review',
        'Gold Author Badge',
        'Dedicated Support',
        'Advanced Analytics & Insights'
      ],
      duration: 'monthly',
      badge: 'Gold'
    }
  ];

  res.status(200).json({
    status: 'success',
    data: { plans }
  });
};

export const getUserPaymentHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const db = getDatabase();

    if (!userId) {
      res.status(400).json({ status: 'error', message: 'User ID required' });
      return;
    }

    let history = [];

    if (db.collection) {
      const snapshot = await db.collection('payment_orders')
        .where('user_id', '==', userId)
        .orderBy('created_at', 'desc')
        .get();
      history = snapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id }));
    } else {
      const [rows]: any = await db.execute(
        `SELECT * FROM payment_orders WHERE user_id = ? ORDER BY created_at DESC`,
        [userId]
      );
      history = rows;
    }

    res.status(200).json({
      status: 'success',
      data: { history }
    });

  } catch (error: any) {
    logger.error('Get payment history error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch payment history' });
  }
};

// Helper function to calculate end date
function calculateEndDate(duration: string): Date {
  const date = new Date();
  if (duration === 'monthly') {
    date.setMonth(date.getMonth() + 1);
  } else if (duration === 'yearly') {
    date.setFullYear(date.getFullYear() + 1);
  } else if (duration === 'weekly') {
    date.setDate(date.getDate() + 7);
  } else {
    // Default to monthly
    date.setMonth(date.getMonth() + 1);
  }
  return date;
}

// Export all functions
export default {
  getSubscriptionPlans,
  createPayUOrder,
  verifyPayUPayment,
  getPaymentStatus,
  payuWebhook,
  getUserSubscriptions,
  getCurrentSubscription,
  activateFreeSubscription,
  cancelSubscription
};