"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fixMultipartRequest = void 0;
const stream_1 = require("stream");
/**
 * Middleware to fix 'Unexpected end of form' error in Firebase Functions / Cloud Run
 * when using Multer. The environment consumes the stream to populate req.rawBody,
 * leaving the stream empty for Multer. This repopulates it.
 */
const fixMultipartRequest = (req, res, next) => {
    var _a;
    if (req.method === 'POST' &&
        ((_a = req.headers['content-type']) === null || _a === void 0 ? void 0 : _a.startsWith('multipart/form-data')) &&
        req.rawBody) {
        const rawBody = req.rawBody;
        // Create a new readable stream from the raw body buffer
        const stream = new stream_1.Readable();
        stream.push(rawBody);
        stream.push(null);
        // Override the pipe method of the request to pipe from our new stream
        req.pipe = (destination) => stream.pipe(destination);
        // Also ensure events are handled if needed (Multer uses pipe)
        // Some versions of busboy might attach handlers directly? 
        // Pipe override is usually sufficient for busboy.
    }
    next();
};
exports.fixMultipartRequest = fixMultipartRequest;
//# sourceMappingURL=multipartFix.js.map