export type ApiErrorResponse = {
  error: string;
};

export type ApiSuccessResponse<T> = {
  data: T;
};
