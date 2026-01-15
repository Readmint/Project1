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
exports.sanitizeHtml = void 0;
const cheerio = __importStar(require("cheerio"));
const sanitizeHtml = (html) => {
    if (!html)
        return '';
    const $ = cheerio.load(html, { xmlMode: false }); // xmlMode: false allows standard HTML parsing
    // Iterate over all elements
    $('*').each((i, el) => {
        const element = $(el);
        // Remove all attributes except href, src, alt, title (allow basic structure)
        // Or simpler: remove specifically the bad ones. 
        // The user's issue is style and data attributes.
        // Let's be aggressive but safe for images/links.
        const attribs = el.attribs;
        if (attribs) {
            Object.keys(attribs).forEach(attr => {
                // Keep specific safe attributes
                if (['src', 'href', 'alt', 'title', 'width', 'height', 'target'].includes(attr)) {
                    return;
                }
                // Remove everything else (style, class, data-*, etc)
                element.removeAttr(attr);
            });
        }
    });
    return $('body').html() || '';
};
exports.sanitizeHtml = sanitizeHtml;
//# sourceMappingURL=sanitizer.js.map