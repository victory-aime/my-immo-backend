enum BASE_APIS_URL {
  UNSECURED = 'v1/unsecured',
  SECURED = 'v1/secure',
  SWAGGER = 'v1/bo',
}

enum CLOUDINARY_FOLDER_NAME {
  AGENCY = 'agency',
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

enum EXPIRE_TIME {
  _30_MINUTES = 1800,
  _60_MINUTES = 3600,
  _15_MINUTES = 900,
  _5_MINUTES = 300,
}

export {
  TOKEN_EXCEPTION,
  JWT_TIME,
  APP_ROLES,
  CLOUDINARY_FOLDER_NAME,
  BASE_APIS_URL,
  SWAGGER_TAGS,
  EXPIRE_TIME,
};
