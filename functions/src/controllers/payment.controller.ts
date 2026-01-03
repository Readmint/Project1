
import { Request, Response } from 'express';
import sha512 from 'js-sha512';
import { executeQuery, getDoc, createDoc, updateDoc } from '../utils/firestore-helpers';
import { logger } from '../utils/logger';

const PAYU_KEY = process.env.PAYU_KEY || 'test_key'; // user provided env
const PAYU_SALT = process.env.PAYU_SALT || 'test_salt';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

export const initiatePayment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { amount, productInfo, firstname, email, phone } = req.body;
        const userId = (req as any).user?.userId;

        // 1. Create Order in DB
        const txnid = 'Txn' + new Date().getTime(); // Simple transaction ID
        const finalAmount = parseFloat(amount).toFixed(2);

        // Store preliminary order info
        await createDoc('orders', {
            id: txnid, // use txnid as doc id for easy lookup
            user_id: userId,
            total_amount: finalAmount,
            status: 'pending',
            transaction_id: txnid,
            product_info: productInfo,
            created_at: new Date()
        }, txnid);

        // 2. Generate Hash
        // Formula: sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|...|udf10|salt)
        const hashString = `${PAYU_KEY}|${txnid}|${finalAmount}|${productInfo}|${firstname}|${email}|||||||||||${PAYU_SALT}`;
        const hash = sha512.sha512(hashString);

        res.status(200).json({
            status: 'success',
            data: {
                key: PAYU_KEY,
                txnid,
                amount: finalAmount,
                productInfo,
                firstname,
                email,
                phone,
                hash,
                surl: `${BACKEND_URL}/api/payment/success`, // Success URL
                furl: `${BACKEND_URL}/api/payment/failure`  // Failure URL
            }
        });

    } catch (error: any) {
        logger.error('Initiate payment error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to initiate payment' });
    }
};

export const handlePaymentSuccess = async (req: Request, res: Response): Promise<void> => {
    try {
        const { txnid, mihpayid, status, hash, amount, productinfo, email, firstname } = req.body;

        // 1. Verify Hash
        // Formula: sha512(salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
        const hashString = `${PAYU_SALT}|${status}|||||||||||${email}|${firstname}|${productinfo}|${amount}|${txnid}|${PAYU_KEY}`;
        const calculatedHash = sha512.sha512(hashString);

        if (calculatedHash !== hash) {
            console.error('Payment hash mismatch');
            res.redirect(`${FRONTEND_URL}/checkout/failed?reason=hash_mismatch`);
            return;
        }

        // 2. Update Order Status
        // txnid is doc id
        await updateDoc('orders', txnid, {
            status: 'success',
            payment_id: mihpayid, // store gateway ID
            updated_at: new Date()
        });

        // 3. Grant Access (Insert into user_purchases)
        // Retrieve order to get user_id (if not passed in UDFs, assuming we fetch from DB)
        const order: any = await getDoc('orders', txnid);

        if (order) {
            const userId = order.user_id;
            const articleIds = productinfo.split(','); // Assuming productinfo = "article1_id,article2_id"

            for (const articleId of articleIds) {
                const aid = articleId.trim();
                // Check if valid UUID/ID length to prevent junk keys
                if (aid.length > 5) {
                    // Create purchase record
                    // Use a unique ID or auto-ID. Since one user can buy multiple times?
                    // Actually, if they buy same book twice, it's fine.
                    // But we want to query "does user own X?".
                    // Avoid duplicates?
                    // Query existing first?
                    // Firestore reads are cheap enough for check.
                    const existing = await executeQuery('user_purchases', [
                        { field: 'user_id', op: '==', value: userId },
                        { field: 'article_id', op: '==', value: aid }
                    ]);

                    if (existing.length === 0) {
                        await createDoc('user_purchases', {
                            user_id: userId,
                            article_id: aid,
                            order_id: txnid,
                            purchased_at: new Date()
                        });
                    }
                }
            }
        }

        // 4. Redirect to Frontend Success Page
        res.redirect(`${FRONTEND_URL}/checkout/success?txnid=${txnid}`);

    } catch (error: any) {
        logger.error('Payment success handler error:', error);
        res.redirect(`${FRONTEND_URL}/checkout/failed?reason=exception`);
    }
};

export const handlePaymentFailure = async (req: Request, res: Response): Promise<void> => {
    try {
        const { txnid } = req.body;

        await updateDoc('orders', txnid, {
            status: 'failed',
            updated_at: new Date()
        });

        res.redirect(`${FRONTEND_URL}/checkout/failed`);
    } catch (error: any) {
        logger.error('Payment failure handler error:', error);
        res.redirect(`${FRONTEND_URL}/checkout/failed`);
    }
};
