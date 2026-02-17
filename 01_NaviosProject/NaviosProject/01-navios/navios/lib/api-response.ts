export interface ApiErrorPayload {
  code: string;
  message: string;
  issues?: unknown;
}

export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiFailure {
  ok: false;
  error: ApiErrorPayload;
}

export function ok<T>(data: T): ApiSuccess<T> {
  return { ok: true, data };
}

export function fail(
  code: string,
  message: string,
  issues?: unknown,
): ApiFailure {
  return { ok: false, error: { code, message, issues } };
}
