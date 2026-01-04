"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedPayment = void 0;
const firestore_helpers_1 = require("../utils/firestore-helpers");
const seedPayment = async (req, res) => {
    try {
        const txnid = 'seed_' + Date.now();
        await (0, firestore_helpers_1.createDoc)('orders', {
            id: txnid,
            user_id: 'test_user_id',
            total_amount: '99.99',
            status: 'success',
            transaction_id: txnid,
            created_at: new Date()
        }, txnid);
        res.json({ status: 'success', message: 'Seeded' });
    }
    catch (e) {
        res.status(500).json({ error: e });
    }
};
exports.seedPayment = seedPayment;
//# sourceMappingURL=seed.controller.js.map