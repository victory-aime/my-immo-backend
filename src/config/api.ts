import { BASE_APIS_URL } from './enum';

export const API_URL = {
  AUTH: {
    SSO_GOOGLE: `${BASE_APIS_URL.SECURED}/auth/sso/google`,
    SYNC_USER: `${BASE_APIS_URL.UNSECURED}/auth/sync-user`,
    LOGIN: `${BASE_APIS_URL.UNSECURED}/auth/login`,
    REFRESH_TOKEN: `${BASE_APIS_URL.SECURED}/auth/refresh-token`,
    LOGOUT: `${BASE_APIS_URL.SECURED}/auth/logout`,
    FORGOT_PASSWORD: `${BASE_APIS_URL.UNSECURED}/auth/forgot-password`,
    RESET_PASSWORD: `${BASE_APIS_URL.SECURED}/auth/reset-password`,
  },
  CONTACT: {
    PUBLIC_REQUEST: `${BASE_APIS_URL.UNSECURED}/contact/public-request`,
    AGENCY_REQUEST_LIST: `${BASE_APIS_URL.SECURED}/request/list`,
    CHANGE_REQUEST_STATUS: `${BASE_APIS_URL.SECURED}/request/status`,
    READ_ALL_REQUESTS: `${BASE_APIS_URL.SECURED}/request/read-all`,
  },
  RENTAL_REQUESTS: {
    CREATE: `${BASE_APIS_URL.SECURED}/rental/create`,
    RENTAL_REQUESTS_AGENCY_LIST: `${BASE_APIS_URL.SECURED}/rental/agency-list`,
    RENTAL_REQUESTS_USER_LIST: `${BASE_APIS_URL.SECURED}/rental/user-list`,
  },
  RENTAL_AGREEMENT: {
    APPROVE: `${BASE_APIS_URL.SECURED}/rental-agreement/approve`,
    REJECT: `${BASE_APIS_URL.SECURED}/rental-agreement/reject`,
    CLOSE: `${BASE_APIS_URL.SECURED}/rental-agreement/terminate`,
  },
  AGENCY: {
    CREATE_AGENCY: `${BASE_APIS_URL.SECURED}/agency/create`,
    AGENCY_INFO: `${BASE_APIS_URL.SECURED}/agency`,
    UPDATE_AGENCY: `${BASE_APIS_URL.SECURED}/agency/update`,
    CLOSE_AGENCY: `${BASE_APIS_URL.SECURED}/agency/close`,
    CHECK_NAME: `${BASE_APIS_URL.UNSECURED}/agency/verified-name`,
  },
  PROPERTY: {
    CREATE_PROPERTY: `${BASE_APIS_URL.SECURED}/property/create`,
    ALL_PROPERTIES: `${BASE_APIS_URL.SECURED}/property/all`,
    ALL_PROPERTIES_PUBLIC: `${BASE_APIS_URL.UNSECURED}/property`,
    PROPERTY_INFO: `${BASE_APIS_URL.SECURED}/property`,
    UPDATE_PROPERTY: `${BASE_APIS_URL.SECURED}/property/update`,
    CLOSE_PROPERTY: `${BASE_APIS_URL.SECURED}/property/close`,
  },
  USER: {
    INFO: `${BASE_APIS_URL.SECURED}/user/info`,
    SESSION: `${BASE_APIS_URL.SECURED}/user/session`,
    REGENERATE_PASSWORD: `${BASE_APIS_URL.SECURED}/user/regenerate-password`,
    CHECK_EMAIL: `${BASE_APIS_URL.UNSECURED}/user/verified-email`,
  },
  COMMON: {
    INVOICE: {
      GENERATE: `${BASE_APIS_URL.SECURED}/invoice/generate`,
    },
    FAQ: {
      GLOBAL_ROUTE: `${BASE_APIS_URL.SECURED}/faq`,
      CREATE: `create-faq`,
      UPDATE: `update-faq`,
      DELETE: `delete-faq`,
    },
  },
};
