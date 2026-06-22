// features/customers/CustomerDetails.tsx
import React, { useState, useEffect } from "react";
import {
  X,
  Edit,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Building,
  FileText,
  Calendar,
  User,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { ICustomer } from "../../core/types";
import { Button } from "../../components/common";
import { useModal } from "../../core/hooks/useModal";
import { useNavigate } from "react-router-dom";
import { DateFormatEnums, formatDate } from "../../core/utils/date-format";
import CustomerService from "../../core/services/customer";
import { toast } from "sonner";

const CustomerDetail = () => {
  const { modalData, modalRef } = useModal();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<ICustomer | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Initialize customer from modal data
  useEffect(() => {
    if (modalData?.customer) {
      setCustomer(modalData.customer);
    }
  }, [modalData]);

  // Fetch fresh customer data
  const fetchCustomerData = async () => {
    if (!customer?.uuid) return;

    try {
      setRefreshing(true);
      const response = await CustomerService.getCustomerByUuid(customer.uuid);
      
      if (response.success && response.results?.customer) {
        setCustomer(response.results.customer);
        toast.success('Success', { description: 'Customer data refreshed' });
      }
    } catch (error: any) {
      console.error('Error refreshing customer data:', error);
      toast.error('Error', { description: error.message || 'Failed to refresh customer data' });
    } finally {
      setRefreshing(false);
    }
  };

  if (!customer) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-light">No customer data available</p>
      </div>
    );
  }

  const handleEdit = () => {
    modalRef?.close({ action: "edit", customer });
  };

  const handleViewInvoices = () => {
    modalRef?.close();
    navigate(`/invoices?customer=${customer.uuid}`);
  };

  const handleCreateInvoice = () => {
    modalRef?.close();
    navigate(`/invoices/create`, { 
      state: { 
        customer: {
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
        }
      } 
    });
  };

  return (
    <div className="max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-xl">
            {customer.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-xl font-bold text-text">{customer.name}</h3>
            <p className="text-sm text-text-light">Customer Details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchCustomerData}
            disabled={refreshing}
            className="p-2 hover:bg-background rounded-lg transition-colors disabled:opacity-50"
            title="Refresh customer data"
          >
            <RefreshCw className={`w-4 h-4 text-text-light ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <Button
            onClick={handleEdit}
            className="flex items-center gap-2"
            size="sm"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Button>
          <button
            onClick={() => modalRef?.close()}
            className="p-2 hover:bg-background rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-text-light" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Status Badge & Info */}
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              customer.is_active !== false
                ? "bg-emerald-100 text-emerald-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {customer.is_active !== false ? "Active" : "Inactive"}
          </span>
          <span className="text-sm text-text-light flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Joined: {formatDate(customer.created_at, DateFormatEnums.DATE_TIME_SHORT)}
          </span>
          {customer.total_invoices !== undefined && (
            <span className="text-sm text-text-light flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Invoices: {customer.total_invoices || 0}
            </span>
          )}
          {customer.total_spent !== undefined && customer.total_spent > 0 && (
            <span className="text-sm text-text-light flex items-center gap-1">
              <CreditCard className="w-3 h-3" />
              Total Spent: GHS {customer.total_spent?.toFixed(2) || '0.00'}
            </span>
          )}
        </div>

        {/* Customer Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-background p-4 rounded-lg border border-border">
            <div className="flex items-center gap-2 text-text-light mb-2">
              <User className="w-4 h-4" />
              <span className="text-sm font-medium">Name</span>
            </div>
            <p className="text-text font-medium">{customer.name}</p>
          </div>

          <div className="bg-background p-4 rounded-lg border border-border">
            <div className="flex items-center gap-2 text-text-light mb-2">
              <Mail className="w-4 h-4" />
              <span className="text-sm font-medium">Email</span>
            </div>
            <p className="text-text font-medium">{customer.email || 'Not provided'}</p>
          </div>

          <div className="bg-background p-4 rounded-lg border border-border">
            <div className="flex items-center gap-2 text-text-light mb-2">
              <Phone className="w-4 h-4" />
              <span className="text-sm font-medium">Phone</span>
            </div>
            <p className="text-text font-medium">{customer.phone || 'Not provided'}</p>
          </div>

          <div className="bg-background p-4 rounded-lg border border-border">
            <div className="flex items-center gap-2 text-text-light mb-2">
              <CreditCard className="w-4 h-4" />
              <span className="text-sm font-medium">Balance</span>
            </div>
            <p
              className={`text-xl font-bold ${(customer.balance || 0) > 0 ? "text-amber-600" : "text-emerald-600"}`}
            >
              GHS {(customer.balance || 0).toFixed(2)}
            </p>
            {customer.total_balance !== undefined && (
              <p className="text-sm text-text-light mt-1">
                Outstanding: GHS {customer.total_balance?.toFixed(2) || '0.00'}
              </p>
            )}
          </div>

          {customer.address && (
            <div className="bg-background p-4 rounded-lg border border-border md:col-span-2">
              <div className="flex items-center gap-2 text-text-light mb-2">
                <MapPin className="w-4 h-4" />
                <span className="text-sm font-medium">Address</span>
              </div>
              <p className="text-text font-medium">{customer.address}</p>
            </div>
          )}

          {customer.tax_id && (
            <div className="bg-background p-4 rounded-lg border border-border">
              <div className="flex items-center gap-2 text-text-light mb-2">
                <Building className="w-4 h-4" />
                <span className="text-sm font-medium">Tax ID</span>
              </div>
              <p className="text-text font-medium">{customer.tax_id}</p>
            </div>
          )}
        </div>

        {/* Notes */}
        {customer.notes && (
          <div className="bg-background p-4 rounded-lg border border-border">
            <h3 className="font-semibold text-text mb-2">Notes</h3>
            <p className="text-text-light whitespace-pre-wrap">{customer.notes}</p>
          </div>
        )}

        {/* Recent Invoices */}
        {customer.recent_invoices && customer.recent_invoices.length > 0 && (
          <div className="bg-background p-4 rounded-lg border border-border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-text">Recent Invoices</h3>
              <button
                onClick={handleViewInvoices}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                View All <ExternalLink className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-2">
              {customer.recent_invoices.map((invoice) => (
                <div
                  key={invoice.uuid}
                  className="flex justify-between items-center p-3 bg-card border border-border rounded-lg hover:bg-background transition-colors cursor-pointer"
                  onClick={() => {
                    modalRef?.close();
                    navigate(`/invoices/${invoice.uuid}`);
                  }}
                >
                  <div>
                    <p className="font-medium text-text">{invoice.number}</p>
                    <p className="text-xs text-text-light">
                      {formatDate(invoice.created_at, DateFormatEnums.SHORT_DATE)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-text">GHS {invoice.total.toFixed(2)}</p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        invoice.status === 'paid' ? 'bg-success-10 text-success' :
                        invoice.status === 'invoiced' ? 'bg-primary-10 text-primary' :
                        invoice.status === 'partially' ? 'bg-info-10 text-info' :
                        invoice.status === 'overdue' ? 'bg-danger-10 text-danger' :
                        'bg-card text-text'
                      }`}
                    >
                      {invoice.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
          <Button
            onClick={handleCreateInvoice}
            className="flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Create Invoice
          </Button>
          <Button
            onClick={handleViewInvoices}
            variant="ghost"
            className="flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            View All Invoices
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetail;