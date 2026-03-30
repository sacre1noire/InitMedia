export enum UserRole {
    APPLICANT = 'APPLICANT',
    EMPLOYER = 'EMPLOYER',
    ADMIN = 'ADMIN',
}

export interface User {
    id: number;
    email: string;
    role: UserRole;
    is_active: boolean;
    created_at: string;
}

export interface TokenResponse {
    access_token: string;
    refresh_token: string;
}

export interface RegisterResponse {
    id: number;
    email: string;
    role: UserRole;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    role: UserRole;
}
