export interface User {
    id: string;
    name: string;
    email: string;
    role: string;
}

export interface AuthResponse {
    token?: string; // Optional for signup response (backend might not return a token for signup)
    id: string;
    name: string;
    email: string;
    role: string;
}