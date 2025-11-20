import React, { useCallback, useState, useEffect } from "react";
import { Button, Input } from "../../../ui";
import { useModal } from "../../../core/hooks/useModal";
import { appService } from "../../../core/services/app";

import { removeUnderscoresAndCapitalize } from "../../../core/utils/remove-underscore";
import { useToast } from "../../../core/hooks/useToast";
import { IPayoutAccount } from "../../../core/interfaces/IPayout";

export interface RequestPayoutFormData {
  amount: string;
  bank_name: string;
  network_type: string;
  account_type: string;
  account_number: string;
  account_name: string;
  account_id: string;
  note?: string;
}

// Bank options
const BANK_OPTIONS = [
  { value: "", label: "Select Bank" },
  { value: "Ecobank Ghana", label: "Ecobank Ghana" },
  { value: "GCB Bank", label: "GCB Bank" },
  { value: "Absa Bank Ghana", label: "Absa Bank Ghana" },
  { value: "Stanbic Bank Ghana", label: "Stanbic Bank Ghana" },
  { value: "Fidelity Bank", label: "Fidelity Bank" },
  { value: "Access Bank Ghana", label: "Access Bank Ghana" },
  { value: "Standard Chartered Ghana", label: "Standard Chartered Ghana" },
  { value: "Zenith Bank Ghana", label: "Zenith Bank Ghana" },
  { value: "CalBank", label: "CalBank" },
  { value: "Other Bank", label: "Other Bank" },
];

const NETWORK_TYPE_OPTIONS = [
  { value: "", label: "Select Network" },
  { value: "MTN", label: "MTN" },
  { value: "AT", label: "AT Cash" },
  { value: "Telecel", label: "Telecel Cash" },
];
enum AccountType {
  BANK = "Bank",
  MOBILE_MONEY = "Mobile Money",
}

const ACCOUNT_TYPES = [
  { value: "", label: "Account Type" },
  { value: AccountType.BANK, label: "Bank" },
  { value: AccountType.MOBILE_MONEY, label: "Mobile Money" },
];

const RequestPayoutModal: React.FC = () => {
  const { modalRef, modalData } = useModal();
  const { show } = useToast();

  // State for existing accounts and form data
  const [existingAccounts, setExistingAccounts] = useState<IPayoutAccount[]>(
    []
  );
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [useExistingAccount, setUseExistingAccount] = useState(false);

  // Initialize form state
  const [formData, setFormData] = useState<RequestPayoutFormData>({
    amount: "",
    bank_name: "",
    account_type: "",
    network_type: "",
    account_number: "",
    account_name: "",
    account_id: "",
    note: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if current account type is mobile money
  const isMobileMoney = formData.account_type === AccountType.MOBILE_MONEY;
  const isBankAccount = formData.account_type === AccountType.BANK;

  // Fetch existing accounts on component mount
  useEffect(() => {
    const fetchExistingAccounts = async () => {
      try {
        setIsLoadingAccounts(true);
        const res = await appService.getPayoutAccounts();
        if (res.success) {
          const accounts = res.results.map((acc: any) => {
            return {
              id: acc.id,
              bank: acc.bank,
              network_type: acc.network_type,
              account_type: acc.account_type,
              account_number: `****${acc.account_number.slice(-4)}`,
              account_name: acc.account_name,
              recently_used: acc.recently_used,
              updated: acc.updated,
            };
          });
          setExistingAccounts(accounts);

          // If there are existing accounts, pre-select the first one
          if (accounts.length > 0) {
            const lastUsedAccount =
              accounts.find((acc: any) => acc.recently_used) || accounts[0];
            setUseExistingAccount(true);
            setFormData((prev) => ({
              ...prev,
              account_id: lastUsedAccount.id,
              bank_name: lastUsedAccount.bank_name,
              account_type: lastUsedAccount.account_type,
              network_type: lastUsedAccount.network_type,
              account_number: lastUsedAccount.account_number,
              account_name: lastUsedAccount.account_name,
            }));
          }
        }
      } catch (error) {
        console.error("Failed to fetch existing accounts:", error);
      } finally {
        setIsLoadingAccounts(false);
      }
    };

    fetchExistingAccounts();
  }, []);

  const handleInputChange = useCallback(
    (field: keyof typeof formData, value: string) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));

      // Clear error when user starts typing
      if (errors[field]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [errors]
  );

  const handleAccountSelection = (accountId: string) => {
    const selectedAccount = existingAccounts.find(
      (acc) => acc.id === accountId
    );
    if (selectedAccount) {
      setFormData((prev) => ({
        ...prev,
        account_id: selectedAccount.id,
        bank_name: selectedAccount.bank,
        account_type: selectedAccount.account_type,
        network_type: selectedAccount.bank,
        account_number: selectedAccount.account_number,
        account_name: selectedAccount.account_name,
      }));
    }
  };

  const handleUseNewAccount = () => {
    setUseExistingAccount(false);
    setFormData((prev) => ({
      ...prev,
      account_id: "",
      bank_name: "",
      account_type: "",
      network_type: "",
      account_number: "",
      account_name: "",
    }));
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount.trim()) {
      newErrors.amount = "Amount is required";
    } else if (
      isNaN(parseFloat(formData.amount)) ||
      parseFloat(formData.amount) <= 0
    ) {
      newErrors.amount = "Please enter a valid amount";
    } else if (
      parseFloat(formData.amount) > parseFloat(modalData?.balance || "0")
    ) {
      newErrors.amount = "Amount cannot exceed available balance";
    }

    if (useExistingAccount) {
      if (!formData.account_id) {
        newErrors.account_id = "Please select an account";
      }
    } else {
      // For new accounts, validate based on account type
      if (!formData.account_type.trim()) {
        newErrors.account_type = "Account type is required";
      }

      if (!formData.account_number.trim()) {
        newErrors.account_number = "Account number is required";
      } else if (!/^\d+$/.test(formData.account_number)) {
        newErrors.account_number = "Account number must contain only numbers";
      }

      // Validation based on account type
      if (isMobileMoney) {
        if (!formData.network_type.trim()) {
          newErrors.network_type = "Network type is required for mobile money";
        }
      } else if (isBankAccount) {
        if (!formData.bank_name.trim()) {
          newErrors.bank_name = "Bank name is required";
        }
        if (!formData.account_name.trim()) {
          newErrors.account_name = "Account holder name is required";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleConfirm = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare request data
      const requestData = {
        amount: formData.amount,
        note: formData.note,
        ...(useExistingAccount
          ? { account_id: formData.account_id }
          : {
              bank_name: isMobileMoney
                ? `${formData.network_type} - ${AccountType.MOBILE_MONEY}`
                : formData.bank_name,
              account_type: formData.account_type,
              account_number: formData.account_number,
              ...(isMobileMoney
                ? {
                    network_type: formData.network_type,
                    account_name: formData.account_name,
                  }
                : {
                    account_name: formData.account_name,
                    bank_name: formData.bank_name,
                  }),
            }),
      };

      const res = await appService.requestPayout(requestData);
      if (res && res.results) {
        show("Success", "Payout request submitted successfully", "success");
        modalRef?.close({ success: true, data: res.results });
      }
    } catch (error) {
      show("Error", "Failed to request payout, try again later.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleConfirm();
    }
  };

  return (
    <div className="p-4 max-h-[90vh]">
      <div className="flex flex-row justify-between items-start mb-6 border-b border-border pb-4 sticky top-0 bg-card z-10">
        <div className="flex flex-col">
          <h2 className="text-2xl text-text font-bold">{modalData.title}</h2>
          <h4 className="text-md text-text-light mt-1">{modalData.subtitle}</h4>
        </div>
        <button
          onClick={() => modalRef!.dismiss()}
          className="w-8 h-8 rounded-full text-text-light transition-colors flex items-center justify-center"
          aria-label="Close modal"
        >
          <i className="ri-close-line text-xl"></i>
        </button>
      </div>

      {/* Payout Request Form */}
      <div className="space-y-4 mb-6" onKeyPress={handleKeyPress}>
        <div className="bg-primary-10 rounded-sm p-4 border-l-4 border-primary-70">
          <p className="text-xs uppercase tracking-wide text-text-light mb-1">
            Available Balance
          </p>
          <p className="text-xl font-bold text-text">
            {modalData?.currency} {modalData?.balance}
          </p>
        </div>

        {/* Amount */}
        <Input
          label="Payout Amount ($)"
          type="number"
          value={formData.amount}
          onChange={(value) => handleInputChange("amount", value)}
          error={errors.amount}
          placeholder="0.00"
          required={true}
          min={5}
          max={parseFloat(modalData?.balance)}
        />
        {/* --- Header and Toggle Button --- */}
        <div className="flex justify-between items-center pb-2 border-b border-border">
          {(existingAccounts.length > 0  && !isLoadingAccounts) ? (
            <>
              <h3 className="text-md font-semibold text-text">
                {useExistingAccount
                  ? "Use Existing Account"
                  : "Enter New Account"}
              </h3>
              <>
                {useExistingAccount ? (
                  <button
                    type="button"
                    onClick={handleUseNewAccount}
                    className="text-sm text-primary hover:text-primary-dark font-medium"
                  >
                    <i className="ri-add-line mr-1"></i> Add New Account
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setUseExistingAccount(true)}
                    className="text-sm text-primary hover:text-primary-dark font-medium"
                  >
                    <i className="ri-bank-card-line mr-1"></i> Use Existing
                    Account ({existingAccounts.length})
                  </button>
                )}
              </>
            </>
          ) : (
            <h3 className="text-md font-semibold text-text">
              {"Enter Account Details"}
            </h3>
          )}
        </div>
        {/* Existing Accounts Selection */}
        <div className="space-y-4 border p-4 rounded-sm bg-background-light">
          {useExistingAccount ? (
            <div className="space-y-2">
              <Input
                type="select"
                label="Select Existing Account"
                value={formData.account_id}
                onChange={(value) => handleAccountSelection(value)}
                error={errors.account_id}
                selectOptions={[
                  { value: "", label: "Select an account" },
                  ...existingAccounts.map((acc) => ({
                    value: acc.id,
                    label:
                      acc.bank === "MTN" ||
                      acc.bank === "AT Cash" ||
                      acc.bank === "Telecel Cash"
                        ? `${acc.bank} - ${removeUnderscoresAndCapitalize(
                            acc.account_type
                          )} | ****${acc.account_number.slice(-4)}`
                        : `${acc.bank} | ****${acc.account_number.slice(
                            -4
                          )} - (${acc.account_name})`,
                  })),
                ]}
                required={true}
              />
              <p className="text-xs text-text-light italic">
                The selected account details will be used for this payout.
              </p>

              {/* Display selected account type info */}
              {formData.account_id && (
                <div className="mt-2 p-2 bg-background rounded-sm">
                  <p className="text-sm text-text">
                    <strong>Account Type:</strong>{" "}
                    {formData.account_type === AccountType.MOBILE_MONEY
                      ? "Mobile Money"
                      : "Bank Account"}
                  </p>
                  {formData.account_type === AccountType.MOBILE_MONEY &&
                    formData.network_type && (
                      <p className="text-sm text-text">
                        <strong>Network:</strong> {formData.network_type}
                      </p>
                    )}
                  {formData.account_type === AccountType.BANK &&
                    formData.bank_name && (
                      <p className="text-sm text-text">
                        <strong>Bank:</strong> {formData.bank_name}
                      </p>
                    )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className=" text-sm text-text-light italic">
                <i className="ri-information-line mr-1"></i>
                Please fill out the form below with your new account details.
              </div>

              {/* New Account Form - Only show if no existing accounts OR user chooses to add new */}
              {(!useExistingAccount || existingAccounts.length === 0) && (
                <>
                  {/* Account Type */}
                  <Input
                    label="Account Type"
                    type="select"
                    value={formData.account_type}
                    onChange={(value) =>
                      handleInputChange("account_type", value)
                    }
                    error={errors.account_type}
                    selectOptions={ACCOUNT_TYPES}
                    required={true}
                  />

                  {/* Show Bank Name for Bank Accounts */}
                  {isBankAccount && (
                    <Input
                      label="Bank Name"
                      type="select"
                      value={formData.bank_name}
                      onChange={(value) =>
                        handleInputChange("bank_name", value)
                      }
                      error={errors.bank_name}
                      selectOptions={BANK_OPTIONS}
                      required={true}
                    />
                  )}

                  {/* Show Network Type for Mobile Money */}
                  {isMobileMoney && (
                    <Input
                      label="Network Type"
                      type="select"
                      value={formData.network_type}
                      onChange={(value) =>
                        handleInputChange("network_type", value)
                      }
                      error={errors.network_type}
                      selectOptions={NETWORK_TYPE_OPTIONS}
                      required={true}
                    />
                  )}
                  {/* Account Number */}
                  <Input
                    label={
                      isMobileMoney ? "Mobile Money Number" : "Account Number"
                    }
                    type="text"
                    value={formData.account_number}
                    onChange={(value) =>
                      handleInputChange("account_number", value)
                    }
                    error={errors.account_number}
                    placeholder={
                      isMobileMoney
                        ? "Enter mobile money number"
                        : "Enter account number"
                    }
                    required={true}
                  />

                  {/* Account Holder Name - Always show but conditionally validate */}
                  <Input
                    label="Account Holder Name"
                    type="text"
                    value={formData.account_name}
                    onChange={(value) =>
                      handleInputChange("account_name", value)
                    }
                    error={errors.account_name}
                    placeholder="Enter account holder name"
                    required={isBankAccount} // Only required for bank accounts in validation
                  />
                </>
              )}
            </div>
          )}
        </div>

        {/* Note (Optional) */}
        <Input
          label="Notes (Optional)"
          type="textarea"
          value={formData.note}
          onChange={(value) => handleInputChange("note", value)}
          placeholder="Any additional notes or instructions"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button
          onClick={() => modalRef!.dismiss()}
          variant="danger"
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button onClick={handleConfirm} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <i className="ri-loader-4-line animate-spin mr-2"></i>
              Processing...
            </>
          ) : (
            "Request Payout"
          )}
        </Button>
      </div>
    </div>
  );
};

export default RequestPayoutModal;
