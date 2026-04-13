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
export declare function signToken(payload: TokenPayload): string;
export declare function verifyToken(token: string): TokenPayload;
export declare function hashPassword(password: string): Promise<string>;
export declare function verifyPassword(password: string, hash: string): Promise<boolean>;
export interface RegisterInput {
    name: string;
    email: string;
    password: string;
    country?: string;
    team?: string;
}
export declare function registerUser(input: RegisterInput): Promise<{
    user: AuthUser;
    token: string;
}>;
export declare function loginUser(email: string, password: string): Promise<{
    user: AuthUser;
    token: string;
}>;
export declare function getUserById(userId: string): Promise<AuthUser | null>;
export declare function loginWithGoogle(idToken: string): Promise<{
    user: AuthUser;
    token: string;
}>;
//# sourceMappingURL=authService.d.ts.map