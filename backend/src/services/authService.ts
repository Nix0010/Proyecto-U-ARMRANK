import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db';

const JWT_SECRET = process.env.JWT_SECRET || 'armrank_dev_secret_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface TokenPayload {
    userId: string;
    email: string;
    role: string;
}

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar: string | null;
    country: string | null;
    team: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function signToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] });
}

export function verifyToken(token: string): TokenPayload {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

// ─── Auth Operations ──────────────────────────────────────────────────────────

export interface RegisterInput {
    name: string;
    email: string;
    password: string;
    country?: string;
    team?: string;
}

export async function registerUser(input: RegisterInput): Promise<{ user: AuthUser; token: string }> {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
        throw Object.assign(new Error('El email ya está registrado'), { status: 409 });
    }

    const passwordHash = await hashPassword(input.password);
    const user = await prisma.user.create({
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

export async function loginUser(email: string, password: string): Promise<{ user: AuthUser; token: string }> {
    const user = await prisma.user.findUnique({ where: { email } });
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

export async function getUserById(userId: string): Promise<AuthUser | null> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;
    return toAuthUser(user);
}

function toAuthUser(user: { id: string; name: string; email: string; role: string; avatar: string | null; country: string | null; team: string | null }): AuthUser {
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
