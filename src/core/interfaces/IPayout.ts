export interface IPayoutAccount {
  id: string;
  account_type: 'Mobile Money' | 'Bank' | string; 
  account_number: string;
  account_name: string;
  bank: string; 
  created: string;
  updated: string; 
  recently_used: boolean | string; 
}

export interface IPayout {
  id: string;
  payout_account: IPayoutAccount;
  amount: string; 
  currency: string;
  reference: string; 
  request_note: string;
  status: 'Pending' | 'Processing' | 'Successful' | 'Failed' | string;
  created: string; 
  time_completed: string | null;
}


export interface IPayoutWallet {
  id: string;
  payout_amount_available: string;
  payout_amount_paidout: string;
  currency: string;
  created: string;
  updated: string;
}
