import { Request } from 'express';
import Busboy from 'busboy';
import path from 'path';
import os from 'os';
import fs from 'fs';

export interface ParsedFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    buffer: Buffer;
    size: number;
}

export interface MultipartResult {
    fields: Record<string, any>;
    files: ParsedFile[];
}

export const parseMultipart = (req: Request): Promise<MultipartResult> => {
    return new Promise((resolve, reject) => {
        const fields: Record<string, any> = {};
        const files: ParsedFile[] = [];

        try {
            const busboy = Busboy({ headers: req.headers });

            busboy.on('file', (fieldname, file, info) => {
                const { filename, encoding, mimeType } = info;
                const chunks: Buffer[] = [];

                file.on('data', (data) => {
                    chunks.push(data);
                });

                file.on('end', () => {
                    const buffer = Buffer.concat(chunks);
                    files.push({
                        fieldname,
                        originalname: filename,
                        encoding,
                        mimetype: mimeType,
                        buffer,
                        size: buffer.length
                    });
                });
            });

            busboy.on('field', (fieldname, val) => {
                fields[fieldname] = val;
            });

            busboy.on('finish', () => {
                resolve({ fields, files });
            });

            busboy.on('error', (err) => {
                reject(err);
            });

            // CRITICAL: Handle Firebase Cloud Functions V2 rawBody vs Stream
            if ((req as any).rawBody) {
                // If body is already read into a buffer, write it to busboy
                busboy.end((req as any).rawBody);
            } else {
                // Otherwise pipe the stream
                req.pipe(busboy);
            }

        } catch (err) {
            reject(err);
        }
    });
};
