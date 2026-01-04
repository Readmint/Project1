"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateEnquiryStatus = exports.getEnquiries = exports.submitEnquiry = exports.deletePlan = exports.updatePlan = exports.createPlan = exports.getPlans = void 0;
const uuid_1 = require("uuid");
const logger_1 = require("../utils/logger");
const firestore_helpers_1 = require("../utils/firestore-helpers");
/**
 * ==========================================
 * ADVERTISEMENT PLANS (Admin Manageable)
 * ==========================================
 */
/**
 * GET /api/advertisement/plans
 * Public endpoint to fetch active plans
 */
const getPlans = async (req, res) => {
    try {
        const plans = await (0, firestore_helpers_1.executeQuery)('advertisement_plans', [], 100, { field: 'price_amount', dir: 'asc' });
        res.status(200).json({ status: 'success', data: { plans } });
    }
    catch (err) {
        logger_1.logger.error('getPlans error:', err);
        res.status(500).json({ status: 'error', message: 'Failed to fetch plans', error: err?.message });
    }
};
exports.getPlans = getPlans;
/**
 * POST /api/advertisement/plans
 * Admin only: Create a new plan
 */
const createPlan = async (req, res) => {
    try {
        // Assuming auth middleware checks for admin role
        const { name, description, price_amount, price_currency, features, is_active } = req.body;
        if (!name || !price_amount) {
            res.status(400).json({ status: 'error', message: 'Name and Price are required' });
            return;
        }
        const planId = (0, uuid_1.v4)();
        await (0, firestore_helpers_1.createDoc)('advertisement_plans', {
            name,
            description: description || '',
            price_amount: Number(price_amount),
            price_currency: price_currency || 'INR',
            features: Array.isArray(features) ? features : [],
            is_active: is_active !== undefined ? is_active : true,
            created_at: new Date(),
        }, planId);
        res.status(201).json({ status: 'success', message: 'Plan created', data: { id: planId } });
    }
    catch (err) {
        logger_1.logger.error('createPlan error:', err);
        res.status(500).json({ status: 'error', message: 'Failed to create plan', error: err?.message });
    }
};
exports.createPlan = createPlan;
/**
 * PATCH /api/advertisement/plans/:id
 * Admin only: Update a plan
 */
const updatePlan = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        // Helper to cleanup undefined
        Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);
        await (0, firestore_helpers_1.updateDoc)('advertisement_plans', id, { ...updates, updated_at: new Date() });
        res.status(200).json({ status: 'success', message: 'Plan updated' });
    }
    catch (err) {
        logger_1.logger.error('updatePlan error:', err);
        res.status(500).json({ status: 'error', message: 'Failed to update plan', error: err?.message });
    }
};
exports.updatePlan = updatePlan;
/**
 * DELETE /api/advertisement/plans/:id
 * Admin only: Delete a plan
 */
const deletePlan = async (req, res) => {
    try {
        const { id } = req.params;
        await (0, firestore_helpers_1.deleteDoc)('advertisement_plans', id);
        res.status(200).json({ status: 'success', message: 'Plan deleted' });
    }
    catch (err) {
        logger_1.logger.error('deletePlan error:', err);
        res.status(500).json({ status: 'error', message: 'Failed to delete plan', error: err?.message });
    }
};
exports.deletePlan = deletePlan;
/**
 * ==========================================
 * ENQUIRIES (Submissions & Review)
 * ==========================================
 */
/**
 * POST /api/advertisement/enquiries
 * Public: Submit an enquiry
 */
const submitEnquiry = async (req, res) => {
    try {
        const { name, email, company, message, plan_id, plan_name } = req.body;
        if (!name || !email || !message) {
            res.status(400).json({ status: 'error', message: 'Name, Email and Message are required' });
            return;
        }
        const id = (0, uuid_1.v4)();
        await (0, firestore_helpers_1.createDoc)('advertisement_enquiries', {
            name,
            email,
            company: company || '',
            message,
            plan_id: plan_id || null,
            plan_name: plan_name || null,
            status: 'pending', // pending, reviewed, contacted
            created_at: new Date(),
        }, id);
        res.status(201).json({ status: 'success', message: 'Enquiry submitted successfully' });
    }
    catch (err) {
        logger_1.logger.error('submitEnquiry error:', err);
        res.status(500).json({ status: 'error', message: 'Failed to submit enquiry', error: err?.message });
    }
};
exports.submitEnquiry = submitEnquiry;
/**
 * GET /api/advertisement/enquiries
 * Admin: View all enquiries
 */
const getEnquiries = async (req, res) => {
    try {
        const enquiries = await (0, firestore_helpers_1.executeQuery)('advertisement_enquiries', [], 100, { field: 'created_at', dir: 'desc' });
        res.status(200).json({ status: 'success', data: { enquiries } });
    }
    catch (err) {
        logger_1.logger.error('getEnquiries error:', err);
        res.status(500).json({ status: 'error', message: 'Failed to fetch enquiries', error: err?.message });
    }
};
exports.getEnquiries = getEnquiries;
/**
 * PATCH /api/advertisement/enquiries/:id/status
 * Admin: Update status
 */
const updateEnquiryStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'pending' | 'reviewed' | 'contacted'
        if (!status) {
            res.status(400).json({ status: 'error', message: 'Status is required' });
            return;
        }
        await (0, firestore_helpers_1.updateDoc)('advertisement_enquiries', id, { status, updated_at: new Date() });
        res.status(200).json({ status: 'success', message: 'Enquiry status updated' });
    }
    catch (err) {
        logger_1.logger.error('updateEnquiryStatus error:', err);
        res.status(500).json({ status: 'error', message: 'Failed to update status', error: err?.message });
    }
};
exports.updateEnquiryStatus = updateEnquiryStatus;
//# sourceMappingURL=advertisement.controller.js.map