"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signToken = signToken;
exports.verifyToken = verifyToken;
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.registerUser = registerUser;
exports.loginUser = loginUser;
exports.getUserById = getUserById;
exports.loginWithGoogle = loginWithGoogle;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const google_auth_library_1 = require("google-auth-library");
const db_1 = require("../db");
const googleClient = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || 'armrank_dev_secret_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
// ─── Helpers ──────────────────────────────────────────────────────────────────
function signToken(payload) {
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}
function verifyToken(token) {
    return jsonwebtoken_1.default.verify(token, JWT_SECRET);
}
const SALT_ROUNDS = 12;
async function hashPassword(password) {
    return bcryptjs_1.default.hash(password, SALT_ROUNDS);
}
async function verifyPassword(password, hash) {
    return bcryptjs_1.default.compare(password, hash);
}
async function registerUser(input) {
    const config = await db_1.prisma.systemConfig.findUnique({ where: { id: 'global' } });
    if (config && !config.registrationsEnabled) {
        throw Object.assign(new Error('Los registros están temporalmente deshabilitados'), { status: 403 });
    }
    const existing = await db_1.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
        throw Object.assign(new Error('El email ya está registrado'), { status: 409 });
    }
    const passwordHash = await hashPassword(input.password);
    const user = await db_1.prisma.user.create({
        data: {
            name: input.name,
            email: input.email,
            passwordHash,
            country: input.country,
            team: input.team,
        },
    });
    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    return { user: toAuthUser(user), token };
}
async function loginUser(email, password) {
    const user = await db_1.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
        throw Object.assign(new Error('Credenciales inválidas'), { status: 401 });
    }
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
        throw Object.assign(new Error('Credenciales inválidas'), { status: 401 });
    }
    if (!user.active) {
        throw Object.assign(new Error('Cuenta desactivada'), { status: 403 });
    }
    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    return { user: toAuthUser(user), token };
}
async function getUserById(userId) {
    const user = await db_1.prisma.user.findUnique({ where: { id: userId } });
    if (!user)
        return null;
    return toAuthUser(user);
}
async function loginWithGoogle(idToken) {
    if (!process.env.GOOGLE_CLIENT_ID) {
        throw Object.assign(new Error('Configuración de Google no encontrada en el servidor'), { status: 500 });
    }
    const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
        throw Object.assign(new Error('Token de Google inválido'), { status: 401 });
    }
    const { email, name, picture, sub: googleId } = payload;
    let user = await db_1.prisma.user.findUnique({ where: { email } });
    if (!user) {
        const config = await db_1.prisma.systemConfig.findUnique({ where: { id: 'global' } });
        if (config && !config.registrationsEnabled) {
            throw Object.assign(new Error('Los registros están temporalmente deshabilitados'), { status: 403 });
        }
        // Register automatically
        user = await db_1.prisma.user.create({
            data: {
                email,
                name: name || 'Usuario de Google',
                avatar: picture,
                googleId,
            },
        });
    }
    else if (!user.googleId) {
        // Link googleId to existing account
        user = await db_1.prisma.user.update({
            where: { id: user.id },
            data: { googleId, avatar: user.avatar || picture },
        });
    }
    if (!user.active) {
        throw Object.assign(new Error('Cuenta suspendida'), { status: 403 });
    }
    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    return { user: toAuthUser(user), token };
}
function toAuthUser(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        country: user.country,
        team: user.team,
    };
}
//# sourceMappingURL=authService.js.map