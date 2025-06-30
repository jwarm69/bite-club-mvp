import { UserRole } from '@prisma/client';
export interface JWTPayload {
    userId: string;
    email: string;
    role: UserRole;
    schoolId?: string;
}
export declare const hashPassword: (password: string) => Promise<string>;
export declare const comparePassword: (password: string, hashedPassword: string) => Promise<boolean>;
export declare const generateToken: (payload: JWTPayload) => string;
export declare const verifyToken: (token: string) => JWTPayload;
export declare const extractToken: (authHeader?: string) => string | null;
//# sourceMappingURL=auth.d.ts.map