"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCount = exports.executeQuery = exports.deleteDoc = exports.updateDoc = exports.createDoc = exports.getDoc = exports.getCollection = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const database_1 = require("../config/database");
const logger_1 = require("./logger");
const getCollection = (collectionName) => {
    const db = (0, database_1.getDatabase)();
    return db.collection(collectionName);
};
exports.getCollection = getCollection;
const getDoc = async (collectionName, docId) => {
    try {
        const doc = await (0, exports.getCollection)(collectionName).doc(docId).get();
        if (!doc.exists)
            return null;
        return { id: doc.id, ...doc.data() };
    }
    catch (error) {
        logger_1.logger.error(`Error fetching doc ${collectionName}/${docId}:`, error);
        throw error;
    }
};
exports.getDoc = getDoc;
const createDoc = async (collectionName, data, docId) => {
    try {
        const colRef = (0, exports.getCollection)(collectionName);
        const docRef = docId ? colRef.doc(docId) : colRef.doc();
        // Add timestamps
        const now = firebase_admin_1.default.firestore.FieldValue.serverTimestamp();
        const finalData = {
            ...data,
            created_at: data.created_at || now,
            updated_at: now
        };
        await docRef.set(finalData);
        return { id: docRef.id, ...finalData };
    }
    catch (error) {
        logger_1.logger.error(`Error creating doc in ${collectionName}:`, error);
        throw error;
    }
};
exports.createDoc = createDoc;
const updateDoc = async (collectionName, docId, data) => {
    try {
        const docRef = (0, exports.getCollection)(collectionName).doc(docId);
        const finalData = {
            ...data,
            updated_at: firebase_admin_1.default.firestore.FieldValue.serverTimestamp()
        };
        await docRef.update(finalData);
        return { id: docId, ...finalData };
    }
    catch (error) {
        logger_1.logger.error(`Error updating doc ${collectionName}/${docId}:`, error);
        throw error;
    }
};
exports.updateDoc = updateDoc;
const deleteDoc = async (collectionName, docId) => {
    try {
        await (0, exports.getCollection)(collectionName).doc(docId).delete();
        return true;
    }
    catch (error) {
        logger_1.logger.error(`Error deleting doc ${collectionName}/${docId}:`, error);
        throw error;
    }
};
exports.deleteDoc = deleteDoc;
const executeQuery = async (collectionName, filters = [], limit, orderBy) => {
    try {
        let query = (0, exports.getCollection)(collectionName);
        filters.forEach(f => {
            query = query.where(f.field, f.op, f.value);
        });
        if (orderBy) {
            query = query.orderBy(orderBy.field, orderBy.dir);
        }
        if (limit) {
            query = query.limit(limit);
        }
        const snapshot = await query.get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    catch (error) {
        logger_1.logger.error(`Error executing query on ${collectionName}:`, error);
        throw error;
    }
};
exports.executeQuery = executeQuery;
const getCount = async (collectionName, filters = []) => {
    try {
        let query = (0, exports.getCollection)(collectionName);
        filters.forEach(f => {
            query = query.where(f.field, f.op, f.value);
        });
        const snapshot = await query.count().get();
        return snapshot.data().count;
    }
    catch (error) {
        logger_1.logger.error(`Error counting ${collectionName}:`, error);
        return 0; // Return 0 on error safely
    }
};
exports.getCount = getCount;
//# sourceMappingURL=firestore-helpers.js.map