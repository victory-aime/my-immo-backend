enum BASE_APIS_URL {
  UNSECURED = '_api/v1/unsecured',
  SECURED = '_api/v1/secure',
  SWAGGER = 'api/v1/bo',
}

enum CLOUDINARY_FOLDER_NAME {
  SALON = 'SALON',
  USERS = 'USERS',
}

enum SWAGGER_TAGS {
  USER_MANAGEMENT = 'Users management',
  AUTH_MANAGEMENT = 'Auth management',
  OTP_MANAGEMENT = 'OTP policy management',
}

enum APP_ROLES {
  ADMIN = 'ADMIN',
  USER = 'USER',
  IMMO_OWNER = 'IMMO_OWNER',
}

enum TOKEN_EXCEPTION {
  TOKEN_INVALID = 101,
  TOKEN_EXPIRED = 102,
  NO_TOKEN = 103,
}

enum JWT_TIME {
  _1_DAY = '1d',
  _2_DAY = '2d',
  _30_MINUTES = '30m',
  _15_MINUTES = '15m',
}

export {
  TOKEN_EXCEPTION,
  JWT_TIME,
  APP_ROLES,
  CLOUDINARY_FOLDER_NAME,
  BASE_APIS_URL,
  SWAGGER_TAGS,
};
