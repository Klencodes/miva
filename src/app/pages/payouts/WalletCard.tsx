import React from 'react';

interface WalletCardProps {
  data: {
    currency: string; 
    id: string;
    payout_amount_available: string;
    payout_amount_paidout: string;
  };
  loading: boolean;
}

const WalletCard: React.FC<WalletCardProps> = ({ data, loading }) => {
  const formatAmount = (amount: string) => {
    const value = parseFloat(amount);
    return isNaN(value) ? '0.00' : value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const availableAmount = parseFloat(data?.payout_amount_available);
  // const paidOutAmount = parseFloat(data?.payout_amount_paidout);

  const isZeroBalance = availableAmount === 0;


  if (loading) {
    return (
      <div className="bg-card p-8 rounded-sm mb-4 shadow-md animate-pulse">
       
        <div className="flex justify-between mt-4">
          <div className="h-4 w-1/4 bg-background rounded"></div>
          <div className="h-4 w-1/4 bg-background rounded"></div>
        </div>
        <div className="flex gap-2 mt-6">
          <div className="h-10 w-1/2 bg-background rounded-lg"></div>
          <div className="h-10 w-1/2 bg-background rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="card rounded-sm p-6 shadow-sm ">
      
      {/* Header and Currency Initial */}
      {/* <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <span className={`text-base font-semibold px-3 py-1 rounded-sm ${paidOutAmount > 0 ? 'bg-primary-10 text-primary' : 'bg-background text-text-light'}`}>
            {paidOutAmount > 0 ? 'Active' : 'Dormant'}
          </span>
        </div>
       
      </div> */}

      

      {/* Available and Paid Out with Divider */}
      <div className="flex items-center justify-between">
        
        {/* Available on the left */}
        <div className="text-center flex-1">
            <p className="text-sm font-medium text-text-light mb-1">
            Available Balance 
            </p>
            <h2 className={`text-4xl font-extrabold ${isZeroBalance ? 'text-text-light' : 'text-success'}`}>
            {data?.currency}{formatAmount(data?.payout_amount_available)}
            </h2>
        </div>
        
        {/* Vertical Divider */}
        <div className="h-auto h-full w-1 bg-primary-10 mx-4"></div>
        
        {/* Paid Out on the right */}
         <div className="text-center flex-1">
            <p className="text-sm font-medium text-text-light mb-1">
            Paid Out 
            </p>
            <h2 className={`text-4xl font-extrabold`}>
            {data?.currency}{formatAmount(data?.payout_amount_paidout)}
            </h2>
        </div>
      </div>
    </div>
  );
};

export default WalletCard;