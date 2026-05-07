export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly field?: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const Errors = {
  // Auth
  emailAlreadyExists: () =>
    new AppError(409, 'AUTH_EMAIL_ALREADY_EXISTS', 'This email address is already registered.', 'email'),
  usernameAlreadyExists: () =>
    new AppError(409, 'AUTH_USERNAME_ALREADY_EXISTS', 'This username is already taken.', 'username'),
  invalidCredentials: () =>
    new AppError(401, 'AUTH_INVALID_CREDENTIALS', 'Invalid email or password.'),
  accountNotVerified: () =>
    new AppError(403, 'AUTH_ACCOUNT_NOT_VERIFIED', 'Please verify your email address before signing in.'),
  tokenInvalid: () =>
    new AppError(401, 'AUTH_TOKEN_INVALID', 'This link is invalid or has expired.'),
  tokenExpired: () =>
    new AppError(401, 'AUTH_TOKEN_EXPIRED', 'Your session has expired. Please sign in again.'),
  tokenAlreadyUsed: () =>
    new AppError(401, 'AUTH_TOKEN_ALREADY_USED', 'This link has already been used.'),
  unauthorized: () =>
    new AppError(401, 'UNAUTHORIZED', 'Authentication required.'),
  forbidden: () =>
    new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action.'),
  // Password
  passwordTooShort: () =>
    new AppError(400, 'PASSWORD_TOO_SHORT', 'Password must be at least 8 characters.', 'password'),
  passwordMismatch: () =>
    new AppError(400, 'PASSWORD_MISMATCH', 'Passwords do not match.', 'confirmPassword'),
  invalidCurrentPassword: () =>
    new AppError(400, 'INVALID_CURRENT_PASSWORD', 'Current password is incorrect.', 'currentPassword'),
  // File
  fileTooLarge: (maxMb: number) =>
    new AppError(413, 'FILE_TOO_LARGE', `File is too large. Maximum size is ${maxMb} MB.`),
  unsupportedFormat: () =>
    new AppError(415, 'FILE_UNSUPPORTED_FORMAT', 'Unsupported file format. Accepted: JPEG, PNG, WebP.'),
  // Find
  findNameRequired: () =>
    new AppError(400, 'FIND_NAME_REQUIRED', 'Find name is required.', 'name'),
  findCoordinatesInvalid: () =>
    new AppError(422, 'FIND_COORDINATES_INVALID', 'Invalid coordinates. Latitude must be -90 to 90, longitude -180 to 180.'),
  findPhotoLimitExceeded: () =>
    new AppError(400, 'FIND_PHOTO_LIMIT_EXCEEDED', 'A find can have a maximum of 10 photos.'),
  findNotFound: () =>
    new AppError(404, 'FIND_NOT_FOUND', 'Find not found.'),
  // Attribute
  attributeKeyRequired: () =>
    new AppError(400, 'ATTRIBUTE_KEY_REQUIRED', 'Attribute key is required.', 'key'),
  attributeNotFound: () =>
    new AppError(404, 'ATTRIBUTE_NOT_FOUND', 'Attribute not found.'),
  // Photo
  photoNotFound: () =>
    new AppError(404, 'PHOTO_NOT_FOUND', 'Photo not found.'),
  // Generic
  notFound: (resource = 'Resource') =>
    new AppError(404, 'NOT_FOUND', `${resource} not found.`),
  internalError: () =>
    new AppError(500, 'INTERNAL_SERVER_ERROR', 'An internal server error occurred.'),
};
