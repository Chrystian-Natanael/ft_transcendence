const BASE_URL = import.meta.env.VITE_API_URL

if (!BASE_URL) {
    throw new Error("VITE_API_URL is not defined in environment variables");
}

interface RequestOptions extends RequestInit {
    body?: any;
}

async function fetchWrapper<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
        "Content-type": "application/json",
    };

    const token = localStorage.getItem('token');
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const finalHeaders = {
        ...headers,
        ...(options.headers as Record<string, string>)
    };

    const config: RequestInit = {
        ...options,
        headers: finalHeaders,
        body: options.body ? JSON.stringify(options.body) : undefined,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || `Erro HTTP: ${errorBody.status}`);
    }

    return await response.json();
}

export const api = {
    get: <T>(endpoint: string, options?: RequestOptions) =>
        fetchWrapper<T>(endpoint, { ...options, method: "GET" }),

    post: <T>(endpoint: string, body: any, options?: RequestOptions) =>
        fetchWrapper<T>(endpoint, { ...options, method: "POST", body }),

    put: <T>(endpoint: string, body: any, options?: RequestOptions) =>
        fetchWrapper<T>(endpoint, { ...options, method: "PUT", body }),

    delete: <T>(endpoint: string, body: any, options?: RequestOptions) =>
        fetchWrapper<T>(endpoint, { ...options, method: "DELETE", body }),

    patch: <T>(endpoint: string, body: any, options?: RequestOptions) =>
        fetchWrapper<T>(endpoint, { ...options, method: "PATCH", body }),

    request: fetchWrapper
};
