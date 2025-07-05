"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkSchoolAccess = exports.authorize = exports.authenticate = void 0;
const client_1 = require("@prisma/client");
const auth_1 = require("../utils/auth");
const index_1 = require("../index");
const authenticate = async (req, res, next) => {
    try {
        const token = (0, auth_1.extractToken)(req.headers.authorization);
        if (!token) {
            res.status(401).json({ error: 'No token provided' });
            return;
        }
        const payload = (0, auth_1.verifyToken)(token);
        // Verify user still exists and is active
        const user = await (await (0, index_1.getPrisma)()).user.findUnique({
            where: { id: payload.userId, active: true }
        });
        if (!user) {
            res.status(401).json({ error: 'User not found or inactive' });
            return;
        }
        req.user = payload;
        next();
    }
    catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};
exports.authenticate = authenticate;
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({ error: 'Insufficient permissions' });
            return;
        }
        next();
    };
};
exports.authorize = authorize;
// Middleware to check if user belongs to the same school (for students/restaurants)
const checkSchoolAccess = async (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }
        // Admins can access all schools
        if (req.user.role === client_1.UserRole.ADMIN) {
            next();
            return;
        }
        const schoolId = req.params.schoolId || req.body.schoolId;
        if (schoolId && req.user.schoolId !== schoolId) {
            res.status(403).json({ error: 'Access denied to this school' });
            return;
        }
        next();
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.checkSchoolAccess = checkSchoolAccess;
//# sourceMappingURL=auth.js.map