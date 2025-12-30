import { api } from "./api";

interface RegisterPayload {
    name: string;
    nick: string;
    email: string;
    password: string;
    gang: 'potatoes' | 'tomatoes';
}

interface LoginPayload {
    identifier: string;
    password: string;
}

interface Login2FAPayload {
    token: string;
}

interface Enable2FAPayload {
    token: string;
    secret: string;
}

interface Disable2FAPayload {
    token: string;
}

interface AnonymousPayload {
    nick: string;
}

interface UserResponse {
    id: number;
    name: string;
    nick: string;
    email?: string;
    isAnonymous: boolean;
    gang: 'potatoes' | 'tomatoes';
    has2FA: boolean;
	avatar?: string;
}

interface LoginResponse {
    token: string;
    user: UserResponse;
    requires2FA?: boolean;
    tempToken?: string;
}

interface RegisterResponse {
    id: number;
    name: string;
    nick: string;
    email: string;
    isAnonymous: boolean;
    gang: 'potatoes' | 'tomatoes';
}

interface AnonymousResponse {
    token: string;
    user: UserResponse;
}

interface Setup2FAResponse {
    secret: string;
    qrcode: string;
}

interface Enable2FAResponse {
    message: string;
    backupCodes: string[];
}

interface Disable2FAResponse {
    message: string;
}

interface LogoutResponse {
    message?: string;
}

// --- 1. Interface Adicionada ---
interface DeleteAccountResponse {
    message: string;
}

export const authService = {
    register: (data: RegisterPayload): Promise<RegisterResponse> =>
        api.post<RegisterResponse>("/auth/register", data),

    login: (data: LoginPayload): Promise<LoginResponse> =>
        api.post<LoginResponse>("/auth/login", data),

    login2FA: (data: Login2FAPayload): Promise<LoginResponse> => {
        const tempToken = localStorage.getItem('tempToken');

        return api.post<LoginResponse>("/auth/login/2fa", data, {
            headers: {
                Authorization: `Bearer ${tempToken}`
            }
        });
    },

    createAnonymous: (data: AnonymousPayload): Promise<AnonymousResponse> =>
        api.post<AnonymousResponse>("/auth/anonymous", data),

    getProfile: (): Promise<{ user: UserResponse }> =>
        api.get<{ user: UserResponse }>("/auth/me"),

    setup2FA: (): Promise<Setup2FAResponse> =>
        api.post<Setup2FAResponse>("/auth/2fa/setup", {}),

    enable2FA: (data: Enable2FAPayload): Promise<Enable2FAResponse> =>
        api.post<Enable2FAResponse>("/auth/2fa/enable", data),

    disable2FA: (data: Disable2FAPayload): Promise<Disable2FAResponse> =>
        api.post<Disable2FAResponse>("/auth/2fa/disable", data),

    logout: (): Promise<LogoutResponse> =>
        api.post<LogoutResponse>("/auth/logout", {}),

    deleteAccount: (data: { password?: string; token?: string }): Promise<DeleteAccountResponse> => {
        return api.delete<DeleteAccountResponse>('/auth/delete', data);
    },
};
