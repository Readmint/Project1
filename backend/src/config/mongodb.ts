// src/config/mongodb.ts
import { MongoClient, Db, GridFSBucket, ObjectId } from 'mongodb';
import { logger } from '../utils/logger';

let client: MongoClient | null = null;
let dbInstance: Db | null = null;
let gridFsBucket: GridFSBucket | null = null;

export const connectMongo = async (): Promise<void> => {
  if (dbInstance) return;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set');

  client = new MongoClient(uri, { maxPoolSize: 10 });
  await client.connect();

  const dbName = process.env.MONGODB_DBNAME || 'readmint';
  dbInstance = client.db(dbName);

  const bucketName = process.env.GRIDFS_BUCKET_NAME || 'attachments_files';
  gridFsBucket = new GridFSBucket(dbInstance, { bucketName });

  logger.info(`Connected to MongoDB (${dbName}) and GridFS bucket "${bucketName}"`);

  // create some recommended indexes (idempotent)
  try {
    await dbInstance.collection('attachments').createIndex({ article_id: 1 });
    await dbInstance.collection('content').createIndex({ author_id: 1 });
  } catch (err) {
    logger.warn('Index creation warning', err);
  }
};

export const getMongoDb = (): Db => {
  if (!dbInstance) throw new Error('MongoDB not initialized. Call connectMongo first.');
  return dbInstance;
};

export const getGridFSBucket = (): GridFSBucket => {
  if (!gridFsBucket) throw new Error('GridFSBucket not initialized. Call connectMongo first.');
  return gridFsBucket;
};

export const toObjectId = (id: string | undefined | ObjectId): ObjectId => {
  if (!id) throw new Error('id required');
  return typeof id === 'string' ? new ObjectId(id) : id;
};

export const closeMongo = async (): Promise<void> => {
  if (client) await client.close();
  client = null;
  dbInstance = null;
  gridFsBucket = null;
};
