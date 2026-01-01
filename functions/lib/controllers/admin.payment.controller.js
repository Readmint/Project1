"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFinancialStats = exports.getPaymentReceipts = exports.getAdminPlans = exports.deletePlan = exports.updatePlan = exports.createPlan = void 0;
const firestore_helpers_1 = require("../utils/firestore-helpers");
const logger_1 = require("../utils/logger");
// --- PLANS MANAGEMENT ---
const createPlan = async (req, res) => {
    try {
        const { name, description, price_monthly, price_yearly, features, duration, type, badge } = req.body;
        // Validations
        if (!name || price_monthly === undefined) {
            res.status(400).json({ status: 'error', message: 'Name and Monthly Price are required' });
            return;
        }
        const planData = {
            name,
            description: description || '',
            price_monthly: Number(price_monthly),
            price_yearly: Number(price_yearly || 0),
            features: Array.isArray(features) ? features : [],
            duration: duration || 'monthly',
            type: type || 'reader', // 'reader' or 'author'
            badge: badge || 'None',
            is_active: true,
            created_at: new Date()
        };
        const result = await (0, firestore_helpers_1.createDoc)('subscription_plans', planData);
        logger_1.logger.info(`Admin created plan: ${name} (${result.id})`);
        res.status(201).json({
            status: 'success',
            data: result
        });
    }
    catch (error) {
        logger_1.logger.error('Create plan error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to create plan' });
    }
};
exports.createPlan = createPlan;
const updatePlan = async (req, res) => {
    try {
        const { planId } = req.params;
        const updates = req.body;
        // Prevent updating ID or immutable fields if any
        delete updates.id;
        delete updates.created_at;
        if (updates.price_monthly)
            updates.price_monthly = Number(updates.price_monthly);
        if (updates.price_yearly)
            updates.price_yearly = Number(updates.price_yearly);
        await (0, firestore_helpers_1.updateDoc)('subscription_plans', planId, updates);
        logger_1.logger.info(`Admin updated plan: ${planId}`);
        res.status(200).json({ status: 'success', message: 'Plan updated successfully' });
    }
    catch (error) {
        logger_1.logger.error('Update plan error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to update plan' });
    }
};
exports.updatePlan = updatePlan;
const deletePlan = async (req, res) => {
    try {
        const { planId } = req.params;
        // Logical delete preferred, but physical delete requested?
        // Let's do physical delete for now as per "control" requirement, or toggle active.
        // Doing physical delete.
        await (0, firestore_helpers_1.deleteDoc)('subscription_plans', planId);
        logger_1.logger.info(`Admin deleted plan: ${planId}`);
        res.status(200).json({ status: 'success', message: 'Plan deleted successfully' });
    }
    catch (error) {
        logger_1.logger.error('Delete plan error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to delete plan' });
    }
};
exports.deletePlan = deletePlan;
const getAdminPlans = async (req, res) => {
    try {
        // Fetch all, including inactive if we had a flag
        const plans = await (0, firestore_helpers_1.executeQuery)('subscription_plans', [], undefined, { field: 'price_monthly', dir: 'asc' });
        res.status(200).json({
            status: 'success',
            data: { plans }
        });
    }
    catch (error) {
        logger_1.logger.error('Get admin plans error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch plans' });
    }
};
exports.getAdminPlans = getAdminPlans;
// --- RECEIPTS / TRANSACTIONS ---
const getPaymentReceipts = async (req, res) => {
    try {
        const { status, limit } = req.query;
        const filters = [];
        if (status) { // 'success', 'failed', 'pending'
            filters.push({ field: 'status', op: '==', value: status });
        }
        const maxLimit = limit ? Number(limit) : 50;
        const receipts = await (0, firestore_helpers_1.executeQuery)('payment_orders', filters, maxLimit, { field: 'created_at', dir: 'desc' });
        res.status(200).json({
            status: 'success',
            data: { receipts }
        });
    }
    catch (error) {
        logger_1.logger.error('Get receipts error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch receipts' });
    }
};
exports.getPaymentReceipts = getPaymentReceipts;
const getFinancialStats = async (req, res) => {
    try {
        // Simple aggregation
        // Note: Firestore aggregation in code is expensive for large datasets.
        // Using getCount for simplicity where possible or limit.
        // For total revenue, we'd need to sum 'amount' of 'success' orders.
        // Fetching last 100 successful orders for "Recent Revenue".
        const successOrders = await (0, firestore_helpers_1.executeQuery)('payment_orders', [{ field: 'status', op: '==', value: 'completed' }], 100);
        const totalRevenue = successOrders.reduce((sum, order) => sum + (Number(order.amount) || 0), 0);
        const countSuccess = await (0, firestore_helpers_1.getCount)('payment_orders', [{ field: 'status', op: '==', value: 'completed' }]);
        const countFailed = await (0, firestore_helpers_1.getCount)('payment_orders', [{ field: 'status', op: '==', value: 'failed' }]);
        res.status(200).json({
            status: 'success',
            data: {
                totalRevenue, // of last 100 orders only, effectively "Recent Revenue"
                successfulTransactions: countSuccess,
                failedTransactions: countFailed
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Get financial stats error:', error);
        res.status(500).json({ status: 'error', message: 'Failed to fetch stats' });
    }
};
exports.getFinancialStats = getFinancialStats;
//# sourceMappingURL=admin.payment.controller.js.map