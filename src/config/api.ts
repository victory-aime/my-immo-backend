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
    PUBLIC_CONTACT: `${BASE_APIS_URL.UNSECURED}/contact/public`,
    AGENCY_CONTACT_LIST: `${BASE_APIS_URL.SECURED}/contact/agency-contact-list`,
    AGENCY_CONTACT_UPDATE_STATUS: `${BASE_APIS_URL.SECURED}/contact/agency-update-status`,
    AGENCY_CONTACT_READ_ALL: `${BASE_APIS_URL.SECURED}/contact/agency-update-status`,
  },
  APPLICATION: {
    CREATE: `${BASE_APIS_URL.SECURED}/application/create`,
    AGENCY_APPLICATION_LIST: `${BASE_APIS_URL.SECURED}/application/agency-application-list`,
    USER_APPLICATION_LIST: `${BASE_APIS_URL.SECURED}/application/user-application-list`,
  },
  RENTAL_AGREEMENT: {
    APPROVE: `${BASE_APIS_URL.SECURED}/rental-agreement/approve`,
    REJECT: `${BASE_APIS_URL.SECURED}/rental-agreement/reject`,
    CLOSE: `${BASE_APIS_URL.SECURED}/rental-agreement/terminate`,
    AGENCY_LIST: `${BASE_APIS_URL.SECURED}/rental-agreement/rental-agreement-agency-list`,
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
    ALL_PROPERTIES_BY_AGENCY: `${BASE_APIS_URL.SECURED}/property/all`,
    ALL_PROPERTIES_PUBLIC: `${BASE_APIS_URL.UNSECURED}/property`,
    PROPERTY_INFO: `${BASE_APIS_URL.SECURED}/property/property-info`,
    UPDATE_PROPERTY: `${BASE_APIS_URL.SECURED}/property/update`,
    OCCUPATION_RATE_BY_PROPERTY_TYPE: `${BASE_APIS_URL.SECURED}/property/occupation-rate-property-type`,
    MONTHLY_REVENUE: `${BASE_APIS_URL.SECURED}/property/monthly-revenue`,
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
  CHAT: {
    CREATE_CONV: `${BASE_APIS_URL.SECURED}/chat/create-conversation`,
    GET_CONV: `${BASE_APIS_URL.SECURED}/chat/get-conversation`,
    GET_MESSAGE: `${BASE_APIS_URL.SECURED}/chat/get-message`,
    SEND_MESSAGE: `${BASE_APIS_URL.SECURED}/chat/send-message`,
    READ_MESSAGE: `${BASE_APIS_URL.SECURED}/chat/read`,
  },
  NOTIFICATION: {
    GET_ALL: `${BASE_APIS_URL.SECURED}/notif/get-all`,
    READ_ALL: `${BASE_APIS_URL.SECURED}/notif/read-all`,
    READ_ONE: `${BASE_APIS_URL.SECURED}/notif/read`,
    GET_UNREAD_NOTIF: `${BASE_APIS_URL.SECURED}/notif/get-all-unread`,
  },
};
