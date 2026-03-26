export const apiValues = {
  get APP_THEMES_ENDPOINT() { return 'utilities/theme/' },
  get GET_COUNTRIES_ENDPOINT() { return 'utilities/countries/' },
  get UPLOAD_ASSETS_ENDPOINT() { return 'utilities/upload-single-file/' },
  get SIGNIN_ENDPOINT() { return 'users/signin' },
  get SIGNUP_ENDPOINT() { return 'users/signup' },
  get UPDATE_USER_STATE_ENDPOINT() { return 'users/update-state' },
  get UPDATE_USER_ROLE_ENDPOINT() { return 'users/update-role' },

  get BUSINESS_ENTITIES_ENDPOINT() { return 'entities/' },
  get ASSIGN_USER_ENTITY_ENDPOINT() { return 'entities/assign-user-to-entity/' },
  get CREATE_BUSINESS_ENTITY_ENDPOINT() { return 'entities/' },
  get DASHBOARD_ANALYTICS_ENDPOINT() { return 'analytics/business-dashboard/' },
  get REVENUE_TIME_SERIES_ENDPOINT() { return 'analytics/revenue-time-series/' },
  get PRODUCTS_ENDPOINT() { return 'products/' },
  get PRODUCT_BULK_UPLOAD_ENDPOINT() { return 'products/bulk_upload/' },
  get ALL_PRODUCTS_ENDPOINT() { return 'products/all/' },
  get UPDATE_PRODUCT_AVAILABILITY_ENDPOINT() { return 'products/update_availability/' },
  get UPDATE_PRODUCT_STOCK_ENDPOINT() { return 'products/update_stock/' },
  get UPDATE_PRODUCT_PRICE_ENDPOINT() { return 'products/update_price/' },
  get SYNC_PRODUCTS_WHOLE_STOCK_ENDPOINT() { return 'products/sync_whole_stock/' },
  get SYNC_PRODUCTS_PRICE_CALCULATION_ENDPOINT() { return 'products/sync_product_calculations/' },
  get GET_PRODUCT_EXTRA_INFO_ENDPOINT() { return 'products/extra_product_data/' },
  get GET_ORDERS_ENDPOINT() { return 'orders/' },
  get CREATE_ORDER_ENDPOINT() { return 'orders/create/' },
  get GET_CUSTOMERS_ENDPOINT() { return 'users/customers/' },
  get ADD_CUSTOMERS_ENDPOINT() { return 'users/customers/add/' },
  get GET_CURRENT_USER_ENDPOINT() { return 'profile/' },
  get USERS_ENDPOINT() { return 'users/' },
  get ADD_USER_ENDPOINT() { return 'users/add/' },  
  get SUPPLIERS_ENDPOINT() { return 'suppliers/' },
  get ADD_SUPPLIER_ENDPOINT() { return 'suppliers/add/' },

  get PAYOUTS_ENDPOINT() { return 'transactions/mct/payouts/' },
  get PAYOUT_WALLET_ENDPOINT() { return 'transactions/mct/payout-wallet/' },
  get PAYOUT_ACCOUNTS_ENDPOINT() { return 'transactions/mct/payout-accounts/' },


  get ADMIN_PAYOUTS_ENDPOINT() { return 'administration/payouts/' },


};