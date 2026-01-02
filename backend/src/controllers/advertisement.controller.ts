import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { validationResult } from 'express-validator';
import { logger } from '../utils/logger';
import { getCollection, createDoc, updateDoc, deleteDoc, executeQuery, getDoc } from '../utils/firestore-helpers';

/**
 * ==========================================
 * ADVERTISEMENT PLANS (Admin Manageable)
 * ==========================================
 */

/**
 * GET /api/advertisement/plans
 * Public endpoint to fetch active plans
 */
export const getPlans = async (req: Request, res: Response): Promise<void> => {
    try {
        const plans = await executeQuery('advertisement_plans', [], 100, { field: 'price_amount', dir: 'asc' });
        res.status(200).json({ status: 'success', data: { plans } });
    } catch (err: any) {
        logger.error('getPlans error:', err);
        res.status(500).json({ status: 'error', message: 'Failed to fetch plans', error: err?.message });
    }
};

/**
 * POST /api/advertisement/plans
 * Admin only: Create a new plan
 */
export const createPlan = async (req: Request, res: Response): Promise<void> => {
    try {
        // Assuming auth middleware checks for admin role
        const { name, description, price_amount, price_currency, features, is_active } = req.body;

        if (!name || !price_amount) {
            res.status(400).json({ status: 'error', message: 'Name and Price are required' });
            return;
        }

        const planId = uuidv4();
        await createDoc('advertisement_plans', {
            name,
            description: description || '',
            price_amount: Number(price_amount),
            price_currency: price_currency || 'INR',
            features: Array.isArray(features) ? features : [],
            is_active: is_active !== undefined ? is_active : true,
            created_at: new Date(),
        }, planId);

        res.status(201).json({ status: 'success', message: 'Plan created', data: { id: planId } });
    } catch (err: any) {
        logger.error('createPlan error:', err);
        res.status(500).json({ status: 'error', message: 'Failed to create plan', error: err?.message });
    }
};

/**
 * PATCH /api/advertisement/plans/:id
 * Admin only: Update a plan
 */
export const updatePlan = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Helper to cleanup undefined
        Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

        await updateDoc('advertisement_plans', id, { ...updates, updated_at: new Date() });
        res.status(200).json({ status: 'success', message: 'Plan updated' });
    } catch (err: any) {
        logger.error('updatePlan error:', err);
        res.status(500).json({ status: 'error', message: 'Failed to update plan', error: err?.message });
    }
};

/**
 * DELETE /api/advertisement/plans/:id
 * Admin only: Delete a plan
 */
export const deletePlan = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        await deleteDoc('advertisement_plans', id);
        res.status(200).json({ status: 'success', message: 'Plan deleted' });
    } catch (err: any) {
        logger.error('deletePlan error:', err);
        res.status(500).json({ status: 'error', message: 'Failed to delete plan', error: err?.message });
    }
};


/**
 * ==========================================
 * ENQUIRIES (Submissions & Review)
 * ==========================================
 */

/**
 * POST /api/advertisement/enquiries
 * Public: Submit an enquiry
 */
export const submitEnquiry = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, email, company, message, plan_id, plan_name } = req.body;

        if (!name || !email || !message) {
            res.status(400).json({ status: 'error', message: 'Name, Email and Message are required' });
            return;
        }

        const id = uuidv4();
        await createDoc('advertisement_enquiries', {
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
    } catch (err: any) {
        logger.error('submitEnquiry error:', err);
        res.status(500).json({ status: 'error', message: 'Failed to submit enquiry', error: err?.message });
    }
};

/**
 * GET /api/advertisement/enquiries
 * Admin: View all enquiries
 */
export const getEnquiries = async (req: Request, res: Response): Promise<void> => {
    try {
        const enquiries = await executeQuery('advertisement_enquiries', [], 100, { field: 'created_at', dir: 'desc' });
        res.status(200).json({ status: 'success', data: { enquiries } });
    } catch (err: any) {
        logger.error('getEnquiries error:', err);
        res.status(500).json({ status: 'error', message: 'Failed to fetch enquiries', error: err?.message });
    }
};

/**
 * PATCH /api/advertisement/enquiries/:id/status
 * Admin: Update status
 */
export const updateEnquiryStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'pending' | 'reviewed' | 'contacted'

        if (!status) {
            res.status(400).json({ status: 'error', message: 'Status is required' });
            return;
        }

        await updateDoc('advertisement_enquiries', id, { status, updated_at: new Date() });
        res.status(200).json({ status: 'success', message: 'Enquiry status updated' });
    } catch (err: any) {
        logger.error('updateEnquiryStatus error:', err);
        res.status(500).json({ status: 'error', message: 'Failed to update status', error: err?.message });
    }
};
