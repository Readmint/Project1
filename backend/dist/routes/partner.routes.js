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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const partnerController = __importStar(require("../controllers/partner.controller"));
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Middleware to protect routes
router.use(auth_1.authenticate);
// Admin: Create a new Partner Organization
router.post('/create-partner', [
    (0, express_validator_1.body)('email').isEmail(),
    (0, express_validator_1.body)('password').isLength({ min: 6 }),
    (0, express_validator_1.body)('name').notEmpty(),
    (0, express_validator_1.body)('organization_name').notEmpty(),
], partnerController.createPartner);
// Partner: Create a managed user (Author/Reader)
router.post('/users', [
    (0, express_validator_1.body)('email').isEmail(),
    (0, express_validator_1.body)('password').isLength({ min: 6 }),
    (0, express_validator_1.body)('name').notEmpty(),
    (0, express_validator_1.body)('role').isIn(['author', 'reader']),
], partnerController.createManagedUser);
// Partner: Create an event
router.post('/events', [
    (0, express_validator_1.body)('title').notEmpty(),
    (0, express_validator_1.body)('start_date').isISO8601(),
], partnerController.createEvent);
// Partner/User: List events
router.get('/events', partnerController.listEvents);
// Partner: Dashboard Stats
router.get('/stats', partnerController.getPartnerStats);
// Admin: List all partners
router.get('/all', partnerController.getAllPartners);
exports.default = router;
//# sourceMappingURL=partner.routes.js.map