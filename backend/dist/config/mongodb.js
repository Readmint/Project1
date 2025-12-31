"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeMongo = exports.toObjectId = exports.getGridFSBucket = exports.getMongoDb = exports.connectMongo = void 0;
// src/config/mongodb.ts
const mongodb_1 = require("mongodb");
const logger_1 = require("../utils/logger");
let client = null;
let dbInstance = null;
let gridFsBucket = null;
const connectMongo = async () => {
    if (dbInstance)
        return;
    const uri = process.env.MONGODB_URI;
    if (!uri)
        throw new Error('MONGODB_URI not set');
    client = new mongodb_1.MongoClient(uri, { maxPoolSize: 10 });
    await client.connect();
    const dbName = process.env.MONGODB_DBNAME || 'readmint';
    dbInstance = client.db(dbName);
    const bucketName = process.env.GRIDFS_BUCKET_NAME || 'attachments_files';
    gridFsBucket = new mongodb_1.GridFSBucket(dbInstance, { bucketName });
    logger_1.logger.info(`Connected to MongoDB (${dbName}) and GridFS bucket "${bucketName}"`);
    // create some recommended indexes (idempotent)
    try {
        await dbInstance.collection('attachments').createIndex({ article_id: 1 });
        await dbInstance.collection('content').createIndex({ author_id: 1 });
    }
    catch (err) {
        logger_1.logger.warn('Index creation warning', err);
    }
};
exports.connectMongo = connectMongo;
const getMongoDb = () => {
    if (!dbInstance)
        throw new Error('MongoDB not initialized. Call connectMongo first.');
    return dbInstance;
};
exports.getMongoDb = getMongoDb;
const getGridFSBucket = () => {
    if (!gridFsBucket)
        throw new Error('GridFSBucket not initialized. Call connectMongo first.');
    return gridFsBucket;
};
exports.getGridFSBucket = getGridFSBucket;
const toObjectId = (id) => {
    if (!id)
        throw new Error('id required');
    return typeof id === 'string' ? new mongodb_1.ObjectId(id) : id;
};
exports.toObjectId = toObjectId;
const closeMongo = async () => {
    if (client)
        await client.close();
    client = null;
    dbInstance = null;
    gridFsBucket = null;
};
exports.closeMongo = closeMongo;
//# sourceMappingURL=mongodb.js.map