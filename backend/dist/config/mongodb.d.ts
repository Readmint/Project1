import { Db, GridFSBucket, ObjectId } from 'mongodb';
export declare const connectMongo: () => Promise<void>;
export declare const getMongoDb: () => Db;
export declare const getGridFSBucket: () => GridFSBucket;
export declare const toObjectId: (id: string | undefined | ObjectId) => ObjectId;
export declare const closeMongo: () => Promise<void>;
//# sourceMappingURL=mongodb.d.ts.map