"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkDatabaseStatus = exports.getDatabase = exports.getFirestoreDatabase = exports.getStorageBucket = exports.connectDatabase = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const logger_1 = require("../utils/logger");
let firestoreDb = null;
const connectDatabase = async () => {
    try {
        if (!firebase_admin_1.default.apps.length) {
            // Use Application Default Credentials (best for Cloud Functions)
            // If FIREBASE_PRIVATE_KEY is present, we can use it (local dev), otherwise default.
            if (process.env.FIREBASE_PRIVATE_KEY) {
                const serviceAccount = {
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                };
                firebase_admin_1.default.initializeApp({
                    credential: firebase_admin_1.default.credential.cert(serviceAccount),
                    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
                });
            }
            else {
                firebase_admin_1.default.initializeApp(); // Use ADC
            }
        }
        firestoreDb = firebase_admin_1.default.firestore();
        logger_1.logger.info('Connected to Firebase Firestore');
        console.log('✅ Connected to Firebase Firestore (via ADC or Config)');
        if (!firestoreDb) {
            throw new Error('Firestore database not initialized');
        }
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
        logger_1.logger.error('Database connection failed:', error);
        // process.exit(1); // Do not crash the container!
    }
};
exports.connectDatabase = connectDatabase;
const getStorageBucket = () => {
    return firebase_admin_1.default.storage().bucket();
};
exports.getStorageBucket = getStorageBucket;
const getFirestoreDatabase = () => {
    if (!firestoreDb) {
        throw new Error('Firestore database not initialized');
    }
    return firestoreDb;
};
exports.getFirestoreDatabase = getFirestoreDatabase;
// Main getDatabase function - defaults to Firestore
const getDatabase = () => {
    if (firestoreDb) {
        return firestoreDb;
    }
    throw new Error('No database initialized');
};
exports.getDatabase = getDatabase;
/**
 * Health / status helpers
 */
const checkDatabaseStatus = async () => {
    const status = {};
    try {
        if (firestoreDb) {
            // simple read test
            await firestoreDb.collection('test_connection').limit(1).get();
            status.firestore = { connected: true };
        }
        else {
            status.firestore = { connected: false };
        }
    }
    catch (error) {
        status.firestore = { connected: false, error: error instanceof Error ? error.message : String(error) };
    }
    return status;
};
exports.checkDatabaseStatus = checkDatabaseStatus;
//# sourceMappingURL=database.js.map