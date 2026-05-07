export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Coordinates {
  latitude: number; // zakres: [-90, 90]
  longitude: number; // zakres: [-180, 180]
}

export interface FileValidationResult {
  valid: boolean;
  error?: 'FILE_TOO_LARGE' | 'UNSUPPORTED_FORMAT';
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    field?: string;
  };
}
