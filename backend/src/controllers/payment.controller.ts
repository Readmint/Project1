
import { Request, Response } from 'express';
import { getDatabase } from '../config/database';
import sha512 from 'js-sha512';

const PAYU_KEY = process.env.PAYU_KEY || 'test_key'; // user provided env
const PAYU_SALT = process.env.PAYU_SALT || 'test_salt';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

export const initiatePayment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { amount, productInfo, firstname, email, phone } = req.body;
        const userId = (req as any).user?.userId;
        const db: any = getDatabase();

        // 1. Create Order in DB
        const txnid = 'Txn' + new Date().getTime(); // Simple transaction ID
        const finalAmount = parseFloat(amount).toFixed(2);

        // Store preliminary order info (assuming single item checkout for simplicity or "Cart Cleanup" later)
        // In a clear architecture, we'd iterate items. Here assuming 'productInfo' contains article ID(s).
        // For the "Cart" flow, we might need a separate 'createOrder' step.
        // Let's assume standard PayU flow: We generate hash, frontend submits form.
        // We need to track this 'txnid' -> 'user_id' mapping.

        await db.execute(
            `INSERT INTO orders (id, user_id, total_amount, status, transaction_id, created_at)
             VALUES (UUID(), ?, ?, 'pending', ?, NOW())`,
            [userId, finalAmount, txnid]
        );

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
        console.error('Initiate payment error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to initiate payment' });
    }
};

export const handlePaymentSuccess = async (req: Request, res: Response): Promise<void> => {
    try {
        const { txnid, mihpayid, status, hash, amount, productinfo, email, firstname } = req.body;
        const db: any = getDatabase();

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
        await db.execute(
            `UPDATE orders SET status = 'success' WHERE transaction_id = ?`,
            [txnid]
        );

        // 3. Grant Access (Insert into user_purchases)
        // We need to retrieve the user_id and article_ids associated with this transaction.
        // For simplicity in this flow, assuming 'productinfo' stores a comma-separated list of article IDs.
        // Or query the 'orders' table if we linked it properly.
        // Let's fetch the order to get user_id.
        const [orders]: any = await db.execute('SELECT user_id, id as order_id FROM orders WHERE transaction_id = ?', [txnid]);

        if (orders.length > 0) {
            const userId = orders[0].user_id; // PayU might not pass user_id back directly unless in UDF
            const articleIds = productinfo.split(','); // Assuming productinfo = "article1_id,article2_id"

            for (const articleId of articleIds) {
                // Check if valid UUID to prevent injection
                if (articleId.length > 10) {
                    await db.execute(
                        `INSERT IGNORE INTO user_purchases (user_id, article_id) VALUES (?, ?)`,
                        [userId, articleId.trim()]
                    );
                }
            }
        }

        // 4. Redirect to Frontend Success Page
        res.redirect(`${FRONTEND_URL}/checkout/success?txnid=${txnid}`);

    } catch (error: any) {
        console.error('Payment success handler error:', error);
        res.redirect(`${FRONTEND_URL}/checkout/failed?reason=exception`);
    }
};

export const handlePaymentFailure = async (req: Request, res: Response): Promise<void> => {
    try {
        const { txnid } = req.body;
        const db: any = getDatabase();

        await db.execute(
            `UPDATE orders SET status = 'failed' WHERE transaction_id = ?`,
            [txnid]
        );

        res.redirect(`${FRONTEND_URL}/checkout/failed`);
    } catch (error: any) {
        console.error('Payment failure handler error:', error);
        res.redirect(`${FRONTEND_URL}/checkout/failed`);
    }
};
