export const apiValues = {
  get APP_THEMES_ENDPOINT() { return 'utilities/theme/' },
  get GET_COUNTRIES_ENDPOINT() { return 'utilities/countries/' },
  get UPLOAD_ASSETS_ENDPOINT() { return 'utilities/upload-single-file/' },
  get SIGNIN_ENDPOINT() { return 'users/login' },

  get BUSINESS_ENTITIES_ENDPOINT() { return 'entities/' },
  get ASSIGN_USER_ENTITY_ENDPOINT() { return 'entities/assign-user-to-entity/' },
  get CREATE_BUSINESS_ENTITY_ENDPOINT() { return 'entities/' },
  get DASHBOARD_ANALYTICS_ENDPOINT() { return 'analytics/business-dashboard/' },
  get PRODUCTS_ENDPOINT() { return 'products/' },
  get UPDATE_PRODUCT_AVAILABILITY_ENDPOINT() { return 'products/update-availability/' },
  get UPDATE_PRODUCT_STOCK_ENDPOINT() { return 'products/update-stock/' },
  get GET_PRODUCT_EXTRA_INFO_ENDPOINT() { return 'products/extra-product-data/' },
  get GET_ORDERS_ENDPOINT() { return 'orders/' },
  get CREATE_ORDER_ENDPOINT() { return 'orders/create/' },
  get GET_CUSTOMERS_ENDPOINT() { return 'users/customers/' },
  get ADD_CUSTOMERS_ENDPOINT() { return 'users/customers/add/' },
  get GET_CURRENT_USER_ENDPOINT() { return 'profile/' },
  get USERS_ENDPOINT() { return 'users/' },
  get ADD_USER_ENDPOINT() { return 'users/add/' },








  get SESSIONS_ENDPOINT() { return 'analytics/business-dashboard/' },

  get SIGN_OUT_USER_ENDPOINT() { return 'users/mct/signout/' },
  get SIGNUP_ENDPOINT() { return 'users/mct/signup/' },
  get VERIFY_OTP_ENDPOINT() { return 'users/verify-otp/' },
  get RESEND_OTP_ENDPOINT() { return 'users/resend-otp/' },



  get UPDATE_USER_ROLE_ENDPOINT() { return 'users/mct/update-merchant-role/' },
  get UPDATE_MERCHANT_ACCESS_STATE_ENDPOINT() { return 'users/mct/update-merchant-access/' },
  
  get PAYOUTS_ENDPOINT() { return 'transactions/mct/payouts/' },
  get PAYOUT_WALLET_ENDPOINT() { return 'transactions/mct/payout-wallet/' },
  get PAYOUT_ACCOUNTS_ENDPOINT() { return 'transactions/mct/payout-accounts/' },


  get ADMIN_PAYOUTS_ENDPOINT() { return 'administration/payouts/' },


};