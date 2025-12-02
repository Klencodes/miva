import React from "react";
import { Button } from "../../../ui";
import { useModal } from "../../../core/hooks/useModal";
import { DateFormatEnums, dateUtils } from "../../../core/utils/date-format";
import { IPayout } from "../../../core/interfaces/IPayout";
import { Roles } from "../../../core/enums/roles";

import { useStore } from "../../../core/hooks/useStore";
import { toast } from "sonner";
import { authService } from "../../../core/services/auth";

interface PayoutDetailsModalProps {
  payout: IPayout;
  title: string;
  subtitle: string;
}

export const PayoutDetailsModal: React.FC = () => {
  const { modalRef, modalData } = useModal();
  const { user } = useStore();
  const [isLoading, setIsLoading] = React.useState(false);
  const { payout, title, subtitle } = modalData as PayoutDetailsModalProps;

  const payoutStatus = payout.status.toLowerCase(); 
  
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "successful":
        return "text-success";
      case "pending":
        return "text-info";
      case "failed":
        return "text-danger";
      default:
        return "text-gray";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "successful":
        return "ri-checkbox-circle-line";
      case "pending":
        return "ri-time-line";
      case "failed":
        return "ri-close-circle-line";
      default:
        return "ri-information-line";
    }
  };

  const handleDownloadReceipt = () => {
    modalRef!.close({ action: "download_receipt" });
  };


  const handleApproveRequest = async () => {
    setIsLoading(true);
    try {
        const payload = {
            payout_id: payout?.id
        }
        const res = await authService.addNewUser(payload);

        if (res.success) {
            toast.success("Success", {description: "Payout request approved successfully"});
            modalRef!.close({action: "complete"})
        }
    } catch (error) {
        toast.error("Error", {description: "An error occurred while approving payout request"});
    } finally {
        setIsLoading(false);
    }

  };
  

  // UPDATED: Accepts a string amount and uses payout.currency
  const formatCurrency = (amount: string | number | undefined, currency: string) => {
    if (amount === undefined || amount === null) return "N/A";
    
    let numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(numAmount)) return "N/A";
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(numAmount);
  };

  // Helper function to render a detail row
  const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex justify-between">
      <span className="text-text-light">{label}:</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );

  // Safely access nested account details
  const account = payout.payout_account;


  return (
    <div className="p-4 max-h-[90vh] overflow-y-auto">
      {/* Modal Header */}
      <div className="flex flex-row justify-between items-start mb-6 border-b border-border pb-4 sticky top-0 bg-card z-10">
        <div className="flex flex-col">
          <h2 className="text-2xl text-text font-bold">{title}</h2>
          <h4 className="text-md text-text-light mt-1">{subtitle}</h4>
        </div>
        <button
          onClick={() => modalRef!.dismiss()}
          className="w-8 h-8 rounded-full text-text-light transition-colors flex items-center justify-center"
          aria-label="Close modal"
        >
          <i className="ri-close-line text-xl"></i>
        </button>
      </div>

      {/* Payout Details Content */}
      <div className="space-y-6 mb-6">
        
        {/* Status & Amount Summary */}
        <div className="bg-gray-10 rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <div className={`flex items-center gap-2 text-lg font-semibold ${getStatusColor(payoutStatus)}`}>
                <i className={`${getStatusIcon(payoutStatus)} ${payoutStatus === 'pending' ? 'animate-spin' : ''}`}></i>
                {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
              </div>
              <p className="text-text-light text-sm mt-1">
                {payoutStatus === 'successful' ? 'Successfully processed' : 
                 payoutStatus === 'pending' ? 'Awaiting processing' :
                 'Processing failed'}
              </p>
            </div>
            <div className="text-right">
              {/* UPDATED: Use payout.amount and payout.currency */}
              <div className="text-2xl font-bold text-text">
                {formatCurrency(payout.amount, payout.currency)}
              </div>
              {/* Assuming net_amount is still a possibility on the main payout object */}
              {(payout as any).net_amount && (
                <div className="text-sm text-text-light">
                  Net: {formatCurrency((payout as any).net_amount, payout.currency)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Transaction & Account Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Transaction Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-text border-b border-border pb-2">
              Transaction Details
            </h3>
            
            <div className="space-y-3">
              <DetailRow label="Reference ID" value={payout.reference} />
              
              <DetailRow label="Payment Method" value={account?.account_type || "N/A"} />
              
              <DetailRow 
                label="Requested Date" 
                value={dateUtils.formatDate(payout.created, DateFormatEnums.DATE_TIME_SHORT)} 
              />
              
              {payout.time_completed && payout.status === 'successful' &&(
                <DetailRow 
                  label="Completed Date" 
                  value={dateUtils.formatDate(payout.time_completed, DateFormatEnums.DATE_TIME_SHORT)} 
                />
              )}
              
              {(payout as any).fees && (
                <DetailRow 
                  label="Processing Fees" 
                  value={
                    <span className="text-danger">
                      -{formatCurrency((payout as any).fees, payout.currency)}
                    </span>
                  }
                />
              )}
              
              {payout.request_note && (
                <DetailRow 
                  label="Request Note" 
                  value={<p className="max-w-[150px] overflow-auto whitespace-normal">{payout.request_note}</p>}
                />
              )}
            </div>
          </div>

          {/* Payout Account Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-text border-b border-border pb-2">
              Account Details
            </h3>
            
            <div className="space-y-3">
              <DetailRow label="Bank/Network" value={account?.bank || "N/A"} />
              
              <DetailRow label="Account Holder" value={account?.account_name || "N/A"} />
              
              <DetailRow 
                label="Account Number" 
                value={
                  account?.account_number ? `${account.account_number}` : "N/A"
                }
              />
              
              {(account as any)?.routing_number && (
                <DetailRow 
                  label="Routing Number" 
                  value={`****${(account as any).routing_number.slice(-4)}`}
                />
              )}
            </div>
          </div>
        </div>

        {/* Failure Reason (if failed) */}
        {/* Assuming failure_reason is still a possibility on the main payout object */}
        {payoutStatus === 'failed' && (payout as any).failure_reason && (
          <div className="bg-danger-10 border border-danger-20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-danger font-semibold mb-2">
              <i className="ri-error-warning-line"></i>
              Failure Reason
            </div>
            <p className="text-danger text-sm">{(payout as any).failure_reason}</p>
          </div>
        )}

        {/* Additional Information */}
        <div className="bg-info-10 rounded-lg p-4">
          <div className="flex items-center gap-2 text-info font-semibold mb-2">
            <i className="ri-information-line"></i>
            Important Information
          </div>
          <ul className="text-info text-sm space-y-1">
            <li>• Payouts typically process within 2-3 business days.</li>
            <li>• Processing fees may vary based on payment method.</li>
            <li>• Contact support if you have any questions about your payout.</li>
          </ul>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between gap-3 pt-4 border-t border-border sticky bottom-0 bg-card">
    {user?.role !== Roles.SUPER_ADMIN ? (
        // FIX: Remove the outer curly braces around the conditional Button rendering
        payout.status.toLowerCase() === "successful" && (
          <Button
            onClick={handleDownloadReceipt}
            variant="outline"
            disabled={payoutStatus !== 'successful'}
          >
            <i className="ri-download-line mr-2"></i>
            Download Receipt
          </Button>
        )
      ) : (
        payoutStatus !== "successful" && <Button 
          onClick={handleApproveRequest}
          variant="outline"
          loading={isLoading}
        >
          Approve Request
        </Button>
      )}
        
        <div className="flex gap-3">
          <Button 
            onClick={() => modalRef!.dismiss()} 
            variant="danger"
          >
            Close
          </Button>
          
          {payoutStatus === 'failed' && (
            <Button 
              onClick={handleApproveRequest}
            >
              <i className="ri-refresh-line mr-2"></i>
              Retry Payout
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};