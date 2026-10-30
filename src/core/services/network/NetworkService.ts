import { handleAuthExpiration } from '@/core/auth/authExpiration';

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export class NetworkService {
  private readonly baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000';
  }

  private buildHeaders(customHeaders?: HeadersInit): Headers {
    const headers = new Headers(customHeaders || {});

    try {
      const authRaw = localStorage.getItem('ferventa_auth');
      if (authRaw) {
        const parsed = JSON.parse(authRaw);
        if (parsed?.accessToken && !headers.has('Authorization')) {
          headers.set('Authorization', `Bearer ${parsed.accessToken}`);
        }
      }
    } catch {
      // Ignore localStorage parse errors
    }

    const activeBranchId = localStorage.getItem('ferventa_active_branch');
    if (!headers.has('x-branch-id')) {
      headers.set('x-branch-id', activeBranchId || '000000000000000000000000');
    }

    if (!headers.has('Content-Type') && !(customHeaders instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    return headers;
  }

  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(path.startsWith('http') ? path : `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  async request<T>(path: string, options: RequestOptions = {}, retryCount = 0): Promise<T> {
    const { params, headers: customHeaders, signal: externalSignal, ...restOptions } = options;
    const url = this.buildUrl(path, params);
    const headers = this.buildHeaders(customHeaders);
    const method = (restOptions.method || 'GET').toUpperCase();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    if (externalSignal) {
      externalSignal.addEventListener('abort', () => controller.abort());
    }

    let response: Response;
    try {
      response = await fetch(url, {
        ...restOptions,
        headers,
        signal: controller.signal,
      });
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (method === 'GET' && retryCount < 1) {
        await new Promise((r) => setTimeout(r, 2500));
        return this.request<T>(path, options, retryCount + 1);
      }
      if (err.name === 'AbortError') {
        throw new Error('La solicitud tardó más de 60 segundos en responder. El servidor podría estar iniciando.');
      }
      throw new Error('No se pudo conectar con el servidor. Verifica tu conexión o espera un momento a que el servidor despierte.');
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      if (method === 'GET' && [502, 503, 504].includes(response.status) && retryCount < 2) {
        await new Promise((r) => setTimeout(r, 2500));
        return this.request<T>(path, options, retryCount + 1);
      }

      const errorText = await response.text().catch(() => '');
      let message = '';
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.message) {
          message = Array.isArray(errorJson.message) ? errorJson.message.join(', ') : errorJson.message;
        } else if (errorJson.error) {
          message = errorJson.error;
        }
      } catch {
        // Text is not JSON
      }

      if (!message) {
        if ([502, 503, 504].includes(response.status)) {
          message = 'El servidor se encuentra iniciando en la nube. Por favor reintenta en unos instantes.';
        } else {
          message = errorText || `Error HTTP ${response.status}: ${response.statusText}`;
        }
      }

      if (response.status === 401) {
        handleAuthExpiration();
        throw new Error('UNAUTHORIZED');
      }

      throw new Error(message);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const json = await response.json();
      if (json && typeof json === 'object' && 'success' in json && json.success === false) {
        throw new Error(json.message || 'Error en la respuesta del servidor');
      }
      return json as T;
    }

    return response.text() as Promise<T>;
  }

  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }
}

export const networkService = new NetworkService();
