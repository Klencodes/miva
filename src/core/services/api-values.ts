export const apiValues = {
  get GET_APP_THEMES_ENDPOINT() { return 'utilities/app-themes/' },
  get GET_COUNTRIES_ENDPOINT() { return 'utilities/countries/' },
  get UPLOAD_ASSETS_ENDPOINT() { return 'utilities/asset-upload/' },
  get SIGNIN_ENDPOINT() { return 'users/login' },

  get BUSINESS_ENTITIES_ENDPOINT() { return 'entities/' },
  get CREATE_BUSINESS_ENTITY_ENDPOINT() { return 'entities/' },
  get DASHBOARD_ANALYTICS_ENDPOINT() { return 'analytics/business-dashboard/' },
  get GET_PRODUCTS_ENDPOINT() { return 'products/' },







  get SESSIONS_ENDPOINT() { return 'analytics/business-dashboard/' },

  get SIGN_OUT_USER_ENDPOINT() { return 'users/mct/signout/' },
  get SIGNUP_ENDPOINT() { return 'users/mct/signup/' },
  get VERIFY_OTP_ENDPOINT() { return 'users/verify-otp/' },
  get RESEND_OTP_ENDPOINT() { return 'users/resend-otp/' },
  get GET_CURRENT_USER_ENDPOINT() { return 'users/mct/me/' },
  get STATIONS_ENDPOINT() { return 'stations/mct/stations/' },
  get UPDATE_STATION_ENDPOINT() { return 'stations/mct/station/' },
  get CONNECTOR_TYPES_ENDPOINT() { return 'stations/connector-types/' },
  get ADD_STATION_ENDPOINT() { return 'stations/mct/station/add/' },
  get ADD_CHARGERS_ENDPOINT() { return 'stations/mct/charger/add/' },
  get ACTIVATE_CHARGERS_ENDPOINT() { return 'stations/mct/activate-charger/' },
  get GET_UPDATE_CHARGER_ENDPOINT() { return 'stations/mct/charger/' },
  get RESET_CHARGER_ENDPOINT() { return 'stations/mct/reset-charger/' },
  get UPDATE_CONNECTOR_CHARGE_PRICE_ENDPOINT() { return 'stations/mct/update-connector-charge-price/' },
  get UPDATE_CONNECTOR_ENDPOINT() { return 'stations/mct/connector/' },
  get STATION_AMENITIES_ENDPOINT() { return 'stations/mct/amenities/' },
  get UPDATE_STATION_AMENITIES_ENDPOINT() { return 'stations/mct/station-amenities/' },
  get ADD_AMENITY_ENDPOINT() { return 'stations/mct/station-amenities/' },
  get UPDATE_AMENITY_ENDPOINT() { return 'stations/mct/station-amenities/' },
  get REMOVE_AMENITY_FROM_STATION_ENDPOINT() { return 'stations/mct/station-amenities/' },

  get GET_USERS_ENDPOINT() { return 'users/mct/users/' },
  get UPDATE_USER_ROLE_ENDPOINT() { return 'users/mct/update-merchant-role/' },
  get UPDATE_MERCHANT_ACCESS_STATE_ENDPOINT() { return 'users/mct/update-merchant-access/' },

  get SUPER_ADMIN_DASHBOARD_ANALYTICS_ENDPOINT() { return 'administration/dashboard/' },
  get GET_PENDING_APPROVAL_ENTITIES_ENDPOINT() { return 'administration/pending-approval-entities/' },
  get UPDATE_PENDING_ENTITY_STATUS_ENDPOINT() { return 'administration/approve-entity/' },
  get PLATFORM_CONFIG_DATA_ENDPOINT() { return 'administration/platform-config-data/' },
  get UPDATE_COMMISSION_SPLIT_ENDPOINT() { return 'administration/platform-config-data/cscpercent/' },
  
  get PAYOUTS_ENDPOINT() { return 'transactions/mct/payouts/' },
  get PAYOUT_WALLET_ENDPOINT() { return 'transactions/mct/payout-wallet/' },
  get PAYOUT_ACCOUNTS_ENDPOINT() { return 'transactions/mct/payout-accounts/' },

  get ADD_UPDATE_IN_APP_SERVICE_ENDPOINT() { return 'in-app-services/' },
  get LIST_IN_APP_SERVICES_ENDPOINT() { return 'in-app-services/listing/' } ,
  get UPDATE_IN_APP_SERVICE_STATUS_ENDPOINT() { return 'in-app-services/update-in-app-service-status/' } ,
  get DELETE_IN_APP_SERVICE_ENDPOINT() { return 'in-app-services/delete/' } ,

  get ADMIN_PAYOUTS_ENDPOINT() { return 'administration/payouts/' },
  get GET_SYSTEM_USERS_ENDPOINT() { return 'administration/accounts/' },
  get UPDATE_USER_STATE_ENDPOINT() { return 'administration/update-user-state/' },

  get ADMINISTRATION_AMENITIES_ENDPOINT() { return 'administration/sc/amenities/' },
  get ADMINISTRATION_CONNECTOR_TYPES_ENDPOINT() { return 'administration/sc/connector-types/' },
  get ADMINISTRATION_SERVICE_TYPES_ENDPOINT() { return 'administration/sc/service-types/' },
  get APPROVE_REQUEST_ENDPOINT() { return 'administration/process-payout/' },

};