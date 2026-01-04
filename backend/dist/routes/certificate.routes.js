"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const certificate_controller_1 = require("../controllers/certificate.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public verification
router.get('/:certId/verify', certificate_controller_1.verifyCertificate);
router.get('/my-certificates', auth_1.authenticate, certificate_controller_1.getMyCertificates);
// Admin manual generation
router.post('/generate', certificate_controller_1.generateCertificateManually);
exports.default = router;
//# sourceMappingURL=certificate.routes.js.map