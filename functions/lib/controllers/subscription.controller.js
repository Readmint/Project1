"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserPaymentHistory = exports.getAuthorSubscriptionPlans = exports.cancelSubscription = exports.activateFreeSubscription = exports.getCurrentSubscription = exports.getUserSubscriptions = exports.payuWebhook = exports.getPaymentStatus = exports.verifyPayUPayment = exports.createPayUOrder = exports.getSubscriptionPlans = void 0;
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = require("../utils/logger");
const sha256_1 = __importDefault(require("crypto-js/sha256"));
const enc_hex_1 = __importDefault(require("crypto-js/enc-hex"));
const firestore_helpers_1 = require("../utils/firestore-helpers");
// Dynamic PayU configuration function
const getPayUConfig = () => {
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
    }
    else if (process.env.PAYU_MODE === 'production') {
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
const getSubscriptionPlans = async (req, res) => {
    try {
        let subscriptionPlans = await (0, firestore_helpers_1.executeQuery)('subscription_plans', [], undefined, { field: 'price_monthly', dir: 'asc' });
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
        else {
            // Ensure features parsing if it was stored as string
            subscriptionPlans = subscriptionPlans.map(plan => {
                let features = plan.features;
                if (typeof features === 'string') {
                    try {
                        features = JSON.parse(features);
                    }
                    catch (e) {
                        features = [features];
                    }
                }
                return Object.assign(Object.assign({}, plan), { features });
            });
        }
        // Log for debugging
        console.log(`📊 Returning ${subscriptionPlans.length} subscription plans`);
        res.status(200).json({
            status: 'success',
            data: { plans: subscriptionPlans }
        });
    }
    catch (error) {
        logger_1.logger.error('Get subscription plans error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};
exports.getSubscriptionPlans = getSubscriptionPlans;
const createPayUOrder = async (req, res) => {
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
        const hashV1 = crypto_1.default.createHash('sha512').update(hashStringV1).digest('hex');
        console.log('✅ Generated Hash V1:', hashV1);
        console.log('✅ Hash V1 length:', hashV1.length);
        // Calculate v2 hash (reverse hash format)
        const hashStringV2 = `${PAYU_CONFIG.merchantSalt}|${txnId}|${amount}|${productInfo}|${firstNameValue}|${userEmail}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||||`;
        const hashV2 = crypto_1.default.createHash('sha512').update(hashStringV2).digest('hex');
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
        const orderData = {
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
            await (0, firestore_helpers_1.createDoc)('payment_orders', orderData, txnId);
            console.log('💾 Order saved to Firebase');
        }
        catch (dbError) {
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
        console.log('📋 Full response data to frontend:', Object.assign(Object.assign({}, responseData), { hash: hashObject // Show hash object in log, not string
         }));
        res.status(200).json({
            status: 'success',
            data: responseData
        });
    }
    catch (error) {
        logger_1.logger.error('Create PayU order error:', error);
        console.error('❌ Detailed error:', error.stack);
        res.status(500).json({
            status: 'error',
            message: 'Failed to create payment order: ' + error.message
        });
    }
};
exports.createPayUOrder = createPayUOrder;
const verifyPayUPayment = async (req, res) => {
    try {
        const { txnid, amount, productinfo, firstname, email, status, hash, key, addedon, error, error_Message } = req.body;
        console.log('🔍 Verifying PayU Payment:', { txnid, status, amount });
        // Get PayU configuration
        const PAYU_CONFIG = getPayUConfig();
        // Verify hash
        const reverseHashString = `${PAYU_CONFIG.merchantSalt}|${status}|||||||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${PAYU_CONFIG.merchantKey}`;
        const calculatedHash = (0, sha256_1.default)(reverseHashString).toString(enc_hex_1.default).toLowerCase();
        console.log('🔐 Hash Verification:', {
            receivedHash: hash ? hash.substring(0, 20) + '...' : 'MISSING',
            calculatedHash: calculatedHash.substring(0, 20) + '...',
            match: calculatedHash === hash
        });
        if (calculatedHash === hash && status === 'success') {
            // Payment successful
            console.log('✅ Payment successful for transaction:', txnid);
            // Get order details from database
            const orderData = await (0, firestore_helpers_1.getDoc)('payment_orders', txnid);
            if (orderData) {
                console.log('📋 Found order:', orderData.plan_id, 'for user:', orderData.user_id);
                // Update order status
                await (0, firestore_helpers_1.updateDoc)('payment_orders', txnid, {
                    status: 'completed',
                    payment_date: new Date(addedon || new Date()),
                    updated_at: new Date()
                });
                // Create subscription
                const subscriptionData = {
                    user_id: orderData.user_id,
                    plan_id: orderData.plan_id,
                    status: 'active',
                    payment_txn_id: txnid,
                    amount: parseFloat(amount),
                    start_date: new Date(),
                    end_date: calculateEndDate('monthly'),
                    created_at: new Date()
                };
                const subscriptionRef = await (0, firestore_helpers_1.createDoc)('user_subscriptions', subscriptionData);
                console.log('✅ Subscription created with ID:', subscriptionRef.id);
                // Return success response to PayU
                res.send('Payment successful. Redirecting...');
            }
            else {
                console.error('❌ Order not found for txnid:', txnid);
                res.status(400).send('Order not found');
            }
        }
        else {
            // Payment failed
            console.error('❌ Payment failed for transaction:', txnid, 'Status:', status);
            await (0, firestore_helpers_1.updateDoc)('payment_orders', txnid, {
                status: 'failed',
                error_message: error_Message || error,
                updated_at: new Date()
            });
            res.send('Payment failed. Redirecting...');
        }
    }
    catch (error) {
        logger_1.logger.error('Verify PayU payment error:', error);
        console.error('❌ Verification error:', error.stack);
        res.status(500).send('Payment verification error');
    }
};
exports.verifyPayUPayment = verifyPayUPayment;
const getPaymentStatus = async (req, res) => {
    try {
        const { txnid } = req.params;
        console.log('📊 Fetching payment status for:', txnid);
        const paymentDetails = await (0, firestore_helpers_1.getDoc)('payment_orders', txnid);
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
    }
    catch (error) {
        logger_1.logger.error('Get payment status error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get payment status'
        });
    }
};
exports.getPaymentStatus = getPaymentStatus;
// Webhook for PayU
const payuWebhook = async (req, res) => {
    try {
        const postData = req.body;
        console.log('🌐 PayU Webhook received:', postData);
        // Get PayU configuration
        const PAYU_CONFIG = getPayUConfig();
        // Verify hash
        const hashString = `${PAYU_CONFIG.merchantKey}|${postData.txnid}|${postData.amount}|${postData.productinfo}|${postData.firstname}|${postData.email}|||||||||||${PAYU_CONFIG.merchantSalt}`;
        const calculatedHash = (0, sha256_1.default)(hashString).toString(enc_hex_1.default).toLowerCase();
        if (calculatedHash === postData.hash) {
            // Process webhook data
            console.log('✅ Webhook hash verified, processing...');
            logger_1.logger.info('PayU webhook processed successfully:', postData);
            res.status(200).send('OK');
        }
        else {
            console.error('❌ Webhook hash mismatch');
            res.status(400).send('Invalid hash');
        }
    }
    catch (error) {
        logger_1.logger.error('PayU webhook error:', error);
        res.status(500).send('Webhook error');
    }
};
exports.payuWebhook = payuWebhook;
// Get user subscriptions
const getUserSubscriptions = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            res.status(400).json({
                status: 'error',
                message: 'User ID is required'
            });
            return;
        }
        console.log('📊 Fetching subscriptions for user:', userId);
        let subscriptions = await (0, firestore_helpers_1.executeQuery)('user_subscriptions', [{ field: 'user_id', op: '==', value: userId }]);
        // Sort in memory by created_at desc
        subscriptions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        // Get plan details for each subscription
        if (subscriptions.length > 0) {
            // Fetch all plans to join map
            const plans = await (0, firestore_helpers_1.executeQuery)('subscription_plans', []);
            const plansMap = new Map();
            plans.forEach((p) => plansMap.set(p.id, p));
            subscriptions = subscriptions.map((sub) => (Object.assign(Object.assign({}, sub), { plan_details: plansMap.get(sub.plan_id) || null })));
        }
        console.log(`✅ Found ${subscriptions.length} subscriptions for user`);
        res.status(200).json({
            status: 'success',
            data: { subscriptions: subscriptions }
        });
    }
    catch (error) {
        logger_1.logger.error('Get user subscriptions error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get user subscriptions'
        });
    }
};
exports.getUserSubscriptions = getUserSubscriptions;
// Get current active subscription for a user
const getCurrentSubscription = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            res.status(400).json({
                status: 'error',
                message: 'User ID is required'
            });
            return;
        }
        console.log('🔍 Finding current subscription for user:', userId);
        let currentSubscription = null;
        // Fetch active subscriptions
        const activeSubs = await (0, firestore_helpers_1.executeQuery)('user_subscriptions', [
            { field: 'user_id', op: '==', value: userId },
            { field: 'status', op: '==', value: 'active' }
        ]);
        // Sort desc by created_at
        activeSubs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        if (activeSubs.length > 0) {
            const sub = activeSubs[0];
            currentSubscription = Object.assign({}, sub);
            // Fetch plan details
            const plan = await (0, firestore_helpers_1.getDoc)('subscription_plans', sub.plan_id);
            if (plan) {
                currentSubscription.plan_details = plan;
            }
            console.log('✅ Found active Firebase subscription');
        }
        res.status(200).json({
            status: 'success',
            data: { subscription: currentSubscription || null }
        });
    }
    catch (error) {
        logger_1.logger.error('Get current subscription error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get current subscription'
        });
    }
};
exports.getCurrentSubscription = getCurrentSubscription;
// Activate free subscription
const activateFreeSubscription = async (req, res) => {
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
        // Check if user already has an active subscription
        const activeSubs = await (0, firestore_helpers_1.executeQuery)('user_subscriptions', [
            { field: 'user_id', op: '==', value: userId },
            { field: 'status', op: '==', value: 'active' }
        ]);
        if (activeSubs.length > 0) {
            console.log('⚠️ User already has active subscription');
            res.status(400).json({
                status: 'error',
                message: 'User already has an active subscription'
            });
            return;
        }
        // Check if plan is free
        const plan = await (0, firestore_helpers_1.getDoc)('subscription_plans', planId);
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
        const subscriptionData = {
            user_id: userId,
            plan_id: planId,
            status: 'active',
            start_date: new Date(),
            end_date: null, // Free plan doesn't expire
            created_at: new Date()
        };
        const subscriptionRef = await (0, firestore_helpers_1.createDoc)('user_subscriptions', subscriptionData);
        console.log('✅ Free subscription activated in Firebase:', subscriptionRef.id);
        res.status(200).json({
            status: 'success',
            message: 'Free subscription activated successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Activate free subscription error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to activate free subscription'
        });
    }
};
exports.activateFreeSubscription = activateFreeSubscription;
// Cancel subscription
const cancelSubscription = async (req, res) => {
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
        // Verify ownership
        const subscription = await (0, firestore_helpers_1.getDoc)('user_subscriptions', subscriptionId);
        if (!subscription) {
            console.error('❌ Subscription not found');
            res.status(404).json({
                status: 'error',
                message: 'Subscription not found'
            });
            return;
        }
        if (subscription.user_id !== userId) {
            console.error('❌ Unauthorized cancellation attempt');
            res.status(403).json({
                status: 'error',
                message: 'Not authorized to cancel this subscription'
            });
            return;
        }
        // Update subscription status
        await (0, firestore_helpers_1.updateDoc)('user_subscriptions', subscriptionId, {
            status: 'cancelled',
            updated_at: new Date()
        });
        console.log('✅ Subscription cancelled in Firebase');
        res.status(200).json({
            status: 'success',
            message: 'Subscription cancelled successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Cancel subscription error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to cancel subscription'
        });
    }
};
exports.cancelSubscription = cancelSubscription;
// --- AUTHOR PLANS & HISTORY ---
const getAuthorSubscriptionPlans = async (req, res) => {
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
exports.getAuthorSubscriptionPlans = getAuthorSubscriptionPlans;
const getUserPaymentHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            res.status(400).json({ status: 'error', message: 'User ID required' });
            return;
        }
        let history = await (0, firestore_helpers_1.executeQuery)('payment_orders', [{ field: 'user_id', op: '==', value: userId }]);
        // Sort desc
        history.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        res.status(200).json({
            status: 'success',
            data: { history }
        });
    }
    catch (error) {
        logger_1.logger.error('Get payment history error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch payment history' });
    }
};
exports.getUserPaymentHistory = getUserPaymentHistory;
// Helper function to calculate end date
function calculateEndDate(duration) {
    const date = new Date();
    if (duration === 'monthly') {
        date.setMonth(date.getMonth() + 1);
    }
    else if (duration === 'yearly') {
        date.setFullYear(date.getFullYear() + 1);
    }
    else if (duration === 'weekly') {
        date.setDate(date.getDate() + 7);
    }
    else {
        // Default to monthly
        date.setMonth(date.getMonth() + 1);
    }
    return date;
}
// Export all functions
exports.default = {
    getSubscriptionPlans: exports.getSubscriptionPlans,
    createPayUOrder: exports.createPayUOrder,
    verifyPayUPayment: exports.verifyPayUPayment,
    getPaymentStatus: exports.getPaymentStatus,
    payuWebhook: exports.payuWebhook,
    getUserSubscriptions: exports.getUserSubscriptions,
    getCurrentSubscription: exports.getCurrentSubscription,
    activateFreeSubscription: exports.activateFreeSubscription,
    cancelSubscription: exports.cancelSubscription,
    getAuthorSubscriptionPlans: exports.getAuthorSubscriptionPlans,
    getUserPaymentHistory: exports.getUserPaymentHistory
};
//# sourceMappingURL=subscription.controller.js.map