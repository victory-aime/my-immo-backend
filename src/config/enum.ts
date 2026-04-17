enum BASE_APIS_URL {
  UNSECURED = 'v1/unsecured',
  SECURED = 'v1/secure',
  SWAGGER = 'v1/bo',
}

enum APIS_URL_GLOBAL_PATH {
  USERS = 'users',
  PACKS = 'packs',
  AUTH = 'auth',
  BUILDING = 'building',
  LAND = 'land',
  COMMON = 'common',
  PERMS = 'perms',
}

enum CLOUDINARY_FOLDER_NAME {
  AGENCY = 'agency',
  LOGO = 'logo',
  DOC = 'documents',
  PROPERTY = 'properties',
  USERS = 'USERS',
  ANNONCE = 'annonces',
}

enum SWAGGER_TAGS {
  USER_MANAGEMENT = 'Users management',
}

enum TOKEN_EXCEPTION {
  TOKEN_INVALID = 101,
  TOKEN_EXPIRED = 102,
  NO_TOKEN = 103,
}

enum EXPIRE_TIME {
  _30_MINUTES = 1800,
  _60_MINUTES = 3600,
  _15_MINUTES = 900,
  _5_MINUTES = 300,
}

export {
  TOKEN_EXCEPTION,
  CLOUDINARY_FOLDER_NAME,
  BASE_APIS_URL,
  SWAGGER_TAGS,
  EXPIRE_TIME,
  APIS_URL_GLOBAL_PATH,
};
