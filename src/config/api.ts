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
  AGENCY: {
    CREATE_AGENCY: `${BASE_APIS_URL.SECURED}/agency/create`,
    AGENCY_INFO: `${BASE_APIS_URL.SECURED}/agency`,
    UPDATE_AGENCY: `${BASE_APIS_URL.SECURED}/agency/update`,
    CLOSE_AGENCY: `${BASE_APIS_URL.SECURED}/agency/close`,
    CHECK_NAME: `${BASE_APIS_URL.UNSECURED}/agency/verified-name`,
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
    OTP: {
      GLOBAL_ROUTES: `${BASE_APIS_URL.UNSECURED}/otp`,
      GENERATE: 'generate',
      VALIDATE: 'validate',
    },
    FAQ: {
      GLOBAL_ROUTE: `${BASE_APIS_URL.SECURED}/faq`,
      CREATE: `create-faq`,
      UPDATE: `update-faq`,
      DELETE: `delete-faq`,
    },
  },
};
