
import { Request, Response } from 'express';
import { createDoc } from '../utils/firestore-helpers';

export const seedPayment = async (req: Request, res: Response) => {
    try {
        const txnid = 'seed_' + Date.now();
        await createDoc('orders', {
            id: txnid,
            user_id: 'test_user_id',
            total_amount: '99.99',
            status: 'success',
            transaction_id: txnid,
            created_at: new Date()
        }, txnid);
        res.json({ status: 'success', message: 'Seeded' });
    } catch (e) {
        res.status(500).json({ error: e });
    }
}
