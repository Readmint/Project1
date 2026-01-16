"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseMultipart = void 0;
const busboy_1 = __importDefault(require("busboy"));
const parseMultipart = (req) => {
    return new Promise((resolve, reject) => {
        const fields = {};
        const files = [];
        try {
            const busboy = (0, busboy_1.default)({ headers: req.headers });
            busboy.on('file', (fieldname, file, info) => {
                const { filename, encoding, mimeType } = info;
                const chunks = [];
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
            if (req.rawBody) {
                // If body is already read into a buffer, write it to busboy
                busboy.end(req.rawBody);
            }
            else {
                // Otherwise pipe the stream
                req.pipe(busboy);
            }
        }
        catch (err) {
            reject(err);
        }
    });
};
exports.parseMultipart = parseMultipart;
//# sourceMappingURL=multipart.js.map