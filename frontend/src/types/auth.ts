export enum UserRole {
    APPLICANT = 'applicant',
    EMPLOYER = 'employer',
    ADMIN = 'admin',
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
    token_type: string;
    user: User;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    role?: UserRole;
}
