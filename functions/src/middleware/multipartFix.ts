
import { Request, Response, NextFunction } from 'express';
import { Readable } from 'stream';

/**
 * Middleware to fix 'Unexpected end of form' error in Firebase Functions / Cloud Run
 * when using Multer. The environment consumes the stream to populate req.rawBody,
 * leaving the stream empty for Multer. This repopulates it.
 */
export const fixMultipartRequest = (req: Request, res: Response, next: NextFunction) => {
    if (
        req.method === 'POST' &&
        req.headers['content-type']?.startsWith('multipart/form-data') &&
        (req as any).rawBody
    ) {
        const rawBody = (req as any).rawBody;

        // Create a new readable stream from the raw body buffer
        const stream = new Readable();
        stream.push(rawBody);
        stream.push(null);

        // Override the pipe method of the request to pipe from our new stream
        (req as any).pipe = (destination: any) => stream.pipe(destination);

        // Also ensure events are handled if needed (Multer uses pipe)
        // Some versions of busboy might attach handlers directly? 
        // Pipe override is usually sufficient for busboy.
    }
    next();
};
