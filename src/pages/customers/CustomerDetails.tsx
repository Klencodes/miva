import {
  X,
  Edit,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Building,
} from "lucide-react";
import { Customer } from "../../core/types";
import { Button } from "../../components/common";
import { useModal } from "../../core/hooks/useModal";
import { DateFormatEnums, formatDate } from "../../core/utils/date-format";

const CustomerDetail = () => {
  const { modalData, modalRef } = useModal();

  const customer = modalData?.customer as Customer | null;

  if (!customer) {
    return null;
  }

  const handleEdit = () => {
    modalRef?.close({ action: "edit", customer });
  };

  return (
    <div className="max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
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
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-text-light" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              customer.is_active !== false
                ? "bg-emerald-100 text-emerald-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {customer.is_active !== false ? "Active" : "Inactive"}
          </span>
          <span className="text-sm text-text-light">
            Joined: {formatDate(customer?.created_at, DateFormatEnums.DATE_TIME_SHORT)}
          </span>
        </div>

        {/* Customer Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 text-text-light mb-2">
              <Mail className="w-4 h-4" />
              <span className="text-sm font-medium">Email</span>
            </div>
            <p className="text-text font-medium">{customer.email}</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 text-text-light mb-2">
              <Phone className="w-4 h-4" />
              <span className="text-sm font-medium">Phone</span>
            </div>
            <p className="text-text font-medium">{customer.phone}</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 md:col-span-2">
            <div className="flex items-center gap-2 text-text-light mb-2">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium">Address</span>
            </div>
            <p className="text-text font-medium">{customer.address}</p>
          </div>

          {customer.tax_id && (
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 text-text-light mb-2">
                <Building className="w-4 h-4" />
                <span className="text-sm font-medium">Tax ID</span>
              </div>
              <p className="text-text font-medium">{customer.tax_id}</p>
            </div>
          )}

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2 text-text-light mb-2">
              <CreditCard className="w-4 h-4" />
              <span className="text-sm font-medium">Balance</span>
            </div>
            <p
              className={`text-xl font-bold ${(customer.balance || 0) > 0 ? "text-amber-600" : "text-emerald-600"}`}
            >
              GHS {(customer.balance || 0).toFixed(2)}
            </p>
            {/* {customer.creditLimit && (
              <p className="text-sm text-text-light mt-1">
                Credit Limit: GHS {customer.creditLimit.toFixed(2)}
              </p>
            )} */}
          </div>
        </div>

        {/* Notes */}
        {customer.notes && (
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h3 className="font-semibold text-text mb-2">Notes</h3>
            <p className="text-text-light">{customer.notes}</p>
          </div>
        )}

        {/* Invoice History */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <h3 className="font-semibold text-text mb-4">Invoice History</h3>
          <div className="text-center py-8 text-text-light">
            <p>No invoices found for this customer.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetail;
