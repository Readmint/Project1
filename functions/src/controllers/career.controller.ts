import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import * as firestore from '../utils/firestore-helpers';
import { logger } from '../utils/logger';

// --- Types ---
export interface JobRole {
    id: string;
    role: string;
    department: string;
    type: string;
    openings: number;
    experience: string;
    description: string;
    icon: string; // 'Users' | 'Briefcase' | 'Code' | 'Palette' | 'Star' | 'ShieldCheck'
    image: string; // URL
    posted_at: string;
    closing_date?: string;
    status: 'active' | 'closed';
}

export interface JobApplication {
    id: string;
    role_id: string;
    role_name: string;
    applicant_name: string;
    email: string;
    phone: string;
    resume_link: string;
    portfolio_link?: string;
    cover_letter?: string;
    applied_at: string;
    status: 'pending' | 'reviewed' | 'interviewing' | 'rejected' | 'hired';
}

// --- Controller Methods ---

/**
 * Create a new Job Role (Admin/CM)
 */
export const createRole = async (req: Request, res: Response) => {
    try {
        const { role, department, type, openings, experience, description, icon, image, closing_date } = req.body;

        const newRole: JobRole = {
            id: uuidv4(),
            role,
            department,
            type,
            openings: Number(openings),
            experience,
            description,
            icon: icon || 'Briefcase',
            image: image || '/careers/default.jpg',
            posted_at: new Date().toISOString(),
            closing_date: closing_date || undefined,
            status: 'active'
        };

        await firestore.createDoc('career_roles', newRole, newRole.id);

        res.status(201).json({
            status: 'success',
            message: 'Job role created successfully',
            data: { role: newRole }
        });
    } catch (error) {
        logger.error('Error creating job role', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};

/**
 * Get all active Job Roles (Public)
 * Admins might want to see all including closed, via query param ?all=true
 */
export const getRoles = async (req: Request, res: Response) => {
    try {
        const showAll = req.query.all === 'true';
        let conditions: { field: string; op: FirebaseFirestore.WhereFilterOp; value: any }[] = [];

        if (!showAll) {
            conditions.push({ field: 'status', op: '==', value: 'active' });
        }

        const roles = await firestore.executeQuery('career_roles', conditions);

        // Sort by posted_at descending (newest first)
        roles.sort((a: any, b: any) => new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime());

        res.status(200).json({
            status: 'success',
            results: roles.length,
            data: { roles }
        });
    } catch (error) {
        logger.error('Error fetching job roles', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};

/**
 * Get single Role details (Public)
 */
export const getRole = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const role = await firestore.getDoc('career_roles', id);

        if (!role) {
            return res.status(404).json({ status: 'error', message: 'Job role not found' });
        }

        return res.status(200).json({
            status: 'success',
            data: { role }
        });
    } catch (error) {
        logger.error('Error fetching job role', error);
        return res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};

/**
 * Update a Job Role (Admin/CM)
 */
export const updateRole = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        await firestore.updateDoc('career_roles', id, updates);

        res.status(200).json({
            status: 'success',
            message: 'Job role updated successfully'
        });
    } catch (error) {
        logger.error('Error updating job role', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};

/**
 * Delete a Job Role (Admin/CM)
 */
export const deleteRole = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await firestore.deleteDoc('career_roles', id);

        res.status(200).json({
            status: 'success',
            message: 'Job role deleted successfully'
        });
    } catch (error) {
        logger.error('Error deleting job role', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};

/**
 * Submit a Job Application (Public)
 */
export const submitApplication = async (req: Request, res: Response) => {
    try {
        const { role_id, role_name, applicant_name, email, phone, resume_link, portfolio_link, cover_letter } = req.body;

        const newApplication: JobApplication = {
            id: uuidv4(),
            role_id,
            role_name,
            applicant_name,
            email,
            phone,
            resume_link,
            portfolio_link: portfolio_link || '',
            cover_letter: cover_letter || '',
            applied_at: new Date().toISOString(),
            status: 'pending'
        };

        await firestore.createDoc('career_applications', newApplication, newApplication.id);

        res.status(201).json({
            status: 'success',
            message: 'Application submitted successfully',
            data: { application: newApplication }
        });
    } catch (error) {
        logger.error('Error submitting application', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};

/**
 * Get all Applications (Admin/CM)
 */
export const getApplications = async (req: Request, res: Response) => {
    try {
        const applications = await firestore.executeQuery('career_applications');

        // Sort by applied_at descending
        applications.sort((a: any, b: any) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime());

        res.status(200).json({
            status: 'success',
            results: applications.length,
            data: { applications }
        });
    } catch (error) {
        logger.error('Error fetching applications', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};

/**
 * Update Application Status (Admin/CM)
 */
export const updateApplicationStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['pending', 'reviewed', 'interviewing', 'rejected', 'hired'].includes(status)) {
            return res.status(400).json({ status: 'error', message: 'Invalid status' });
        }

        await firestore.updateDoc('career_applications', id, { status });

        return res.status(200).json({
            status: 'success',
            message: 'Application status updated'
        });
    } catch (error) {
        logger.error('Error updating application status', error);
        return res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};
