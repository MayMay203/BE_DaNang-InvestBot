export enum StatusCodeHTTP {
  SUCCESS = 200,
  CREATED = 201,
  NOT_AUTHORIZATION = 401,
  NOT_FOUND = 404,
  BAD_REQUEST = 400,
  FORBIDDEN = 403,
  SERVER_ERROR = 500,
}

export enum MessageHTTP {
  SUCCESS = 'Server responded successfully.',
  CREATED = 'Resource created successfully.',
  NOT_AUTHORIZATION = 'Unauthorized access. Please log in.',
  NOT_FOUND = 'Requested resource not found.',
  BAD_REQUEST = 'Invalid request parameters.',
  FORBIDDEN = 'Access to this resource is forbidden.',
  ERROR = 'Internal server error.',
  PASSWORD_NOT_MATCH = 'Password does not match the confirm password',
}
