"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateApplicationStatus = exports.getApplications = exports.submitApplication = exports.deleteRole = exports.updateRole = exports.getRole = exports.getRoles = exports.createRole = void 0;
const uuid_1 = require("uuid");
const firestore = __importStar(require("../utils/firestore-helpers"));
const logger_1 = require("../utils/logger");
// --- Controller Methods ---
/**
 * Create a new Job Role (Admin/CM)
 */
const createRole = async (req, res) => {
    try {
        const { role, department, type, openings, experience, description, icon, image, closing_date } = req.body;
        const newRole = {
            id: (0, uuid_1.v4)(),
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
    }
    catch (error) {
        logger_1.logger.error('Error creating job role', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};
exports.createRole = createRole;
/**
 * Get all active Job Roles (Public)
 * Admins might want to see all including closed, via query param ?all=true
 */
const getRoles = async (req, res) => {
    try {
        const showAll = req.query.all === 'true';
        let conditions = [];
        if (!showAll) {
            conditions.push({ field: 'status', op: '==', value: 'active' });
        }
        const roles = await firestore.executeQuery('career_roles', conditions);
        // Sort by posted_at descending (newest first)
        roles.sort((a, b) => new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime());
        res.status(200).json({
            status: 'success',
            results: roles.length,
            data: { roles }
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching job roles', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};
exports.getRoles = getRoles;
/**
 * Get single Role details (Public)
 */
const getRole = async (req, res) => {
    try {
        const { id } = req.params;
        const role = await firestore.getDoc('career_roles', id);
        if (!role) {
            return res.status(404).json({ status: 'error', message: 'Job role not found' });
        }
        res.status(200).json({
            status: 'success',
            data: { role }
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching job role', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};
exports.getRole = getRole;
/**
 * Update a Job Role (Admin/CM)
 */
const updateRole = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        await firestore.updateDoc('career_roles', id, updates);
        res.status(200).json({
            status: 'success',
            message: 'Job role updated successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error updating job role', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};
exports.updateRole = updateRole;
/**
 * Delete a Job Role (Admin/CM)
 */
const deleteRole = async (req, res) => {
    try {
        const { id } = req.params;
        await firestore.deleteDoc('career_roles', id);
        res.status(200).json({
            status: 'success',
            message: 'Job role deleted successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Error deleting job role', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};
exports.deleteRole = deleteRole;
/**
 * Submit a Job Application (Public)
 */
const submitApplication = async (req, res) => {
    try {
        const { role_id, role_name, applicant_name, email, phone, resume_link, portfolio_link, cover_letter } = req.body;
        const newApplication = {
            id: (0, uuid_1.v4)(),
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
    }
    catch (error) {
        logger_1.logger.error('Error submitting application', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};
exports.submitApplication = submitApplication;
/**
 * Get all Applications (Admin/CM)
 */
const getApplications = async (req, res) => {
    try {
        const applications = await firestore.executeQuery('career_applications');
        // Sort by applied_at descending
        applications.sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime());
        res.status(200).json({
            status: 'success',
            results: applications.length,
            data: { applications }
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching applications', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};
exports.getApplications = getApplications;
/**
 * Update Application Status (Admin/CM)
 */
const updateApplicationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!['pending', 'reviewed', 'interviewing', 'rejected', 'hired'].includes(status)) {
            return res.status(400).json({ status: 'error', message: 'Invalid status' });
        }
        await firestore.updateDoc('career_applications', id, { status });
        res.status(200).json({
            status: 'success',
            message: 'Application status updated'
        });
    }
    catch (error) {
        logger_1.logger.error('Error updating application status', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
};
exports.updateApplicationStatus = updateApplicationStatus;
//# sourceMappingURL=career.controller.js.map