import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import {
  Plus,
  Trash2,
  Search,
  User,
  FileText,
  CreditCard,
  Phone,
  Mail,
  Check,
  ArrowLeft,
  Hash,
  MapPin,
  X,
  Calendar,
  Clock,
} from "lucide-react";
import Input, { SelectOption } from "../../components/common/Input";
import { Button } from "../../components/common";
import { useTheme } from "../../core/contexts/ThemeProvider";
import InvoiceService from "../../core/services/invoice";
import { toast } from "sonner";
import {
  InventoryItem,
  InvItemType,
  InvItemUnitType,
  InvoicePayment,
} from "../../core/types";
import InventoryService from "../../core/services/inventory";
import { eventService } from "../../core/services/events";
import { useStore } from "../../core/contexts/StoreProvider";
import CustomerService from "../../core/services/customer";

interface FormInvoiceItem {
  id: string;
  name: string;
  part_number?: string;
  type: string;
  unit: string;
  quantity: number;
  price: number;
  cost: number;
  total: number;
  metadata?: Record<string, any>;
}

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  tax_id?: string;
}

const CreateInvoice = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [LoadingInventory, setLoadingInventory] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [invoiceUuid, setInvoiceUuid] = useState<string>("");

  // Customer state
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Item search state
  const [itemSearch, setItemSearch] = useState("");
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>("");

  // Invoice details
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("Net 30");

  // Items
  const [items, setItems] = useState<FormInvoiceItem[]>([]);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<
    "Cash" | "MoMo" | "Bank" | "Credit"
  >("Cash");
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentReference, setPaymentReference] = useState("");
  const [bankBranch, setbankBranch] = useState("");
  const [showPaymentSection, setShowPaymentSection] = useState(false);

  // Discount & Tax
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">(
    "percentage",
  );
  const [discountRate, setDiscountRate] = useState(0);

  // Focus states for clearing default values
  const [isDiscountFocused, setIsDiscountFocused] = useState(false);
  const [isPaymentFocused, setIsPaymentFocused] = useState(false);

  const { isDark } = useTheme();
  const { entity } = useStore();

  // Get tax rates from entity metadata with defaults
  const taxRates = useMemo(() => {
    const metadata = entity?.metadata || {};

    // Check if metadata is a Map and convert if needed
    let metadataObj = metadata;
    if (metadata instanceof Map) {
      metadataObj = Object.fromEntries(metadata);
    }
    return {
      tax_rate: metadataObj.tax_rate || 0,
      nhil_rate: metadataObj.nhil_rate || 0,
      getfund_rate: metadataObj.getfund_rate || 0,
      covid_levy_rate: metadataObj.covid_levy_rate || 0,
      vat_enabled: metadataObj.vat_enabled ?? true,
      nhil_enabled: metadataObj.nhil_enabled ?? true,
      getfund_enabled: metadataObj.getfund_enabled ?? true,
      covid_levy_enabled: metadataObj.covid_levy_enabled ?? true,
    };
  }, [entity?.metadata]);

  // Load inventory items
  const fetchInventoryItem = useCallback(async () => {
    setLoadingInventory(true);
    try {
      console.log("🔄 Fetching inventory items...");
      const res = await InventoryService.getItems({ page: 1, limit: 20000 });
      if (res.success) {
        const items = res.results?.items || [];
        console.log(`✅ Fetched ${items.length} inventory items`);
        setInventoryItems(items);
      } else {
        console.warn("⚠️ Failed to fetch inventory:", res.message);
        setInventoryItems([]);
      }
    } catch (error) {
      console.error("❌ Error fetching inventory:", error);
      setInventoryItems([]);
      toast.error("Error", {
        description: "Failed to load inventory items. Please try again.",
      });
    } finally {
      setLoadingInventory(false);
    }
  }, []);

  // 1. Initial load
  useEffect(() => {
    fetchInventoryItem();
  }, [fetchInventoryItem]);

  // 3. Refresh on events
  useEffect(() => {
    const handleRefresh = () => {
      console.log("📨 Refresh event received - fetching inventory");
      fetchInventoryItem();
    };

    // Register event listeners
    eventService.onRefresh(handleRefresh);

    // Cleanup
    return () => {
      eventService.offRefresh(handleRefresh);
    };
  }, [fetchInventoryItem]);

  // Generate invoice number
  //eslint-disable-next-line
  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
    const prefix = entity?.metadata?.invoice_prefix || "INV";
    return `${prefix}${year}${month}${day}-${random}`;
  };

  // Fetch customers from API
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);

      // Build query params
      const params: any = {
        page: 1,
        limit: 10,
      };

      if (customerSearch) {
        params.search = customerSearch;
      }

      const response = await CustomerService.getCustomers(params);

      if (response.success) {
        const customerData = response.results?.customers || [];
        setCustomers(customerData);
      } else {
        toast.error("Error", {
          description: response.message || "Failed to load customers",
        });
      }
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Failed to load customers",
      });
    } finally {
      setLoading(false);
    }
  }, [customerSearch]);

  useEffect(() => {
    fetchCustomers();
    //eslint-disable-next-line
  }, []);

  // Set invoice number on load

  useEffect(() => {
    if (!isEditing && !invoiceNumber) {
      setInvoiceNumber(generateInvoiceNumber());
    }
  }, [isEditing, generateInvoiceNumber, invoiceNumber]);

  // Auto-set due date based on terms
  useEffect(() => {
    if (!isEditing && invoiceDate) {
      const date = new Date(invoiceDate);
      let daysToAdd = 30; // Default Net 30

      switch (terms) {
        case "Due on Receipt":
          daysToAdd = 0;
          break;
        case "Net 15":
          daysToAdd = 15;
          break;
        case "Net 30":
          daysToAdd = 30;
          break;
        case "Net 45":
          daysToAdd = 45;
          break;
        case "Net 60":
          daysToAdd = 60;
          break;
        default:
          daysToAdd = 30;
      }

      date.setDate(date.getDate() + daysToAdd);
      setDueDate(date.toISOString().split("T")[0]);
    }
  }, [invoiceDate, terms, isEditing]);

  // Load invoice for editing
  useEffect(() => {
    const loadInvoice = async () => {
      const stateInvoice = location.state?.invoice;

      if (stateInvoice) {
        setIsEditing(true);
        setInvoiceUuid(stateInvoice.uuid || stateInvoice.id);
        setInvoiceNumber(stateInvoice.number);
        setInvoiceDate(
          stateInvoice.date?.split("T")[0] ||
            new Date().toISOString().split("T")[0],
        );
        setDueDate(stateInvoice.due_date?.split("T")[0] || "");
        setNotes(stateInvoice.notes || "");
        setTerms(stateInvoice.terms || "Net 30");

        // Set customer
        const customer = customers.find(
          (c) => c.name === stateInvoice.customer?.name,
        );
        if (customer) {
          setSelectedCustomer(customer.id);
          setCustomerSearch(customer.name);
        }

        // Set items
        if (Array.isArray(stateInvoice.items)) {
          setItems(
            stateInvoice.items.map((item: any) => ({
              ...item,
              part_number: item.part_number || "",
              total: item.price * item.quantity,
              metadata: item.metadata || {},
            })),
          );
        }

        // Set payment info
        setPaymentMethod(stateInvoice.paymentMethod || "Cash");
        setPaymentAmount(stateInvoice.amount_paid || 0);

        // Set discount and tax
        setDiscountType(stateInvoice.discount_type || "percentage");
        setDiscountRate(stateInvoice.discount_rate || 0);

        return;
      }

      // Fetch by UUID if editing
      if (id) {
        try {
          setLoading(true);
          const response = await InvoiceService.getInvoiceByUuid(id);

          if (response.success && response.results?.invoice) {
            const invoice = response.results.invoice;
            setIsEditing(true);
            setInvoiceUuid(invoice.uuid);
            setInvoiceNumber(invoice.number);
            setInvoiceDate(
              invoice.date?.split("T")[0] ||
                new Date().toISOString().split("T")[0],
            );
            setDueDate(invoice.due_date?.split("T")[0] || "");
            setNotes(invoice.notes || "");
            setTerms(invoice.terms || "Net 30");

            // Set customer
            const customer = customers.find(
              (c) => c.name === invoice.customer?.name,
            );
            if (customer) {
              setSelectedCustomer(customer.id);
              setCustomerSearch(customer.name);
            }

            // Set items
            if (Array.isArray(invoice.items)) {
              setItems(
                invoice.items.map((item: any) => ({
                  ...item,
                  part_number: item.part_number || "",
                  total: item.price * item.quantity,
                  metadata: item.metadata || {},
                })),
              );
            }

            // Set payment info
            setPaymentMethod(invoice.paymentMethod || "Cash");
            setPaymentAmount(invoice.amount_paid || 0);

            // Set discount and tax
            setDiscountType(invoice.discount_type || "percentage");
            setDiscountRate(invoice.discount_rate || 0);
          }
        } catch (error) {
          console.error("Error loading invoice:", error);
          toast.error("Error", { description: "Failed to load invoice data" });
        } finally {
          setLoading(false);
        }
      }
    };

    loadInvoice();
  }, [id, location.state, customers]);

  // Calculations with conditional taxes
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [items]);

  const discountTotal = useMemo(() => {
    if (discountType === "percentage") {
      return (subtotal * discountRate) / 100;
    }
    return discountRate;
  }, [subtotal, discountType, discountRate]);

  const netSubtotal = subtotal - discountTotal;

  // Calculate each tax only if enabled
  const vat = useMemo(() => {
    if (taxRates.vat_enabled && taxRates.tax_rate > 0) {
      return netSubtotal * (taxRates.tax_rate / 100);
    }
    return 0;
  }, [netSubtotal, taxRates.vat_enabled, taxRates.tax_rate]);

  const nhil = useMemo(() => {
    if (taxRates.nhil_enabled && taxRates.nhil_rate > 0) {
      return netSubtotal * (taxRates.nhil_rate / 100);
    }
    return 0;
  }, [netSubtotal, taxRates.nhil_enabled, taxRates.nhil_rate]);

  const getfund = useMemo(() => {
    if (taxRates.getfund_enabled && taxRates.getfund_rate > 0) {
      return netSubtotal * (taxRates.getfund_rate / 100);
    }
    return 0;
  }, [netSubtotal, taxRates.getfund_enabled, taxRates.getfund_rate]);

  const covidLevy = useMemo(() => {
    if (taxRates.covid_levy_enabled && taxRates.covid_levy_rate > 0) {
      return netSubtotal * (taxRates.covid_levy_rate / 100);
    }
    return 0;
  }, [netSubtotal, taxRates.covid_levy_enabled, taxRates.covid_levy_rate]);

  const total = netSubtotal + vat + nhil + getfund + covidLevy;
  const remainingBalance = total - paymentAmount;
  const balanceLabel = remainingBalance < 0 ? "Change" : "Owing";

  // Payment method options
  const paymentMethodOptions: SelectOption[] = [
    { value: "Cash", label: "Cash" },
    { value: "MoMo", label: "Mobile Money" },
    { value: "Bank", label: "Bank Transfer" },
    { value: "Credit", label: "Credit" },
  ];

  const discountTypeOptions: SelectOption[] = [
    { value: "percentage", label: "Percentage (%)" },
    { value: "fixed", label: "Fixed Amount (GHS)" },
  ];

  const termsOptions: SelectOption[] = [
    { value: "Due on Receipt", label: "Due on Receipt" },
    { value: "Net 15", label: "Net 15" },
    { value: "Net 30", label: "Net 30" },
    { value: "Net 45", label: "Net 45" },
    { value: "Net 60", label: "Net 60" },
  ];

  // Customer filtering
  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers;
    const search = customerSearch.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(search) ||
        c.email?.toLowerCase().includes(search) ||
        c.phone?.toLowerCase().includes(search),
    );
  }, [customers, customerSearch]);

  const selectedCustomerData = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomer);
  }, [customers, selectedCustomer]);

  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!itemSearch) return inventoryItems;
    const search = itemSearch.toLowerCase();
    return inventoryItems.filter(
      (item) =>
        item.name.toLowerCase().includes(search) ||
        (item.part_number && item.part_number.toLowerCase().includes(search)) ||
        item.type.toLowerCase().includes(search),
    );
  }, [inventoryItems, itemSearch]);

  // Selected item data
  const selectedItemData = useMemo(() => {
    return inventoryItems.find((i) => i.uuid === selectedItemId);
  }, [inventoryItems, selectedItemId]);

  // Add item
  const addItem = () => {
    if (!selectedItemId) return;
    const inventoryItem = inventoryItems.find((i) => i.uuid === selectedItemId);
    if (!inventoryItem) return;

    const existingItem = items.find((i) => i.id === selectedItemId);
    if (existingItem) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === selectedItemId
            ? {
                ...i,
                quantity: i.quantity + itemQuantity,
                total: (i.quantity + itemQuantity) * i.price,
              }
            : i,
        ),
      );
    } else {
      setItems((prev) => [
        ...prev,
        {
          id: inventoryItem.uuid,
          name: inventoryItem.name,
          part_number: inventoryItem.part_number || "",
          type: inventoryItem.type || "other",
          unit: inventoryItem.unit || "pieces",
          quantity: itemQuantity,
          price: inventoryItem.price,
          cost: inventoryItem.cost || 0,
          total: itemQuantity * inventoryItem.price,
          metadata: inventoryItem.metadata || {},
        },
      ]);
    }
    setSelectedItemId("");
    setItemSearch("");
    setShowItemDropdown(false);
    setItemQuantity(1);
  };

  // Remove item
  const removeItem = (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  // Update item quantity
  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? { ...i, quantity: newQuantity, total: newQuantity * i.price }
          : i,
      ),
    );
  };

  // Submit invoice
  const handleSubmit = async (status: "draft" | "invoiced" = "invoiced") => {
    if (items.length === 0) {
      toast.error("Validation Error", {
        description: "Please add at least one item",
      });
      return;
    }

    setLoading(true);
    try {
      const customer = customers.find((c) => c.id === selectedCustomer);

      // Prepare payments
      const payments: InvoicePayment[] = [];
      if (paymentAmount > 0) {
        payments.push({
          amount: paymentAmount,
          method: paymentMethod,
          reference: paymentReference || undefined,
          bank_branch: bankBranch || undefined,
        });
      }

      const invoiceData = {
        number: isEditing ? invoiceNumber : generateInvoiceNumber(),
        date: invoiceDate,
        due_date: dueDate || undefined,
        customer: {
          name: customer?.name || "Walk-In-Client",
          email: customer?.email || "",
          phone: customer?.phone || "",
          address: customer?.address || "",
          tax_id: customer?.tax_id || "",
        },
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          part_number: item.part_number || "",
          type: item.type as InvItemType,
          unit: item.unit as InvItemUnitType,
          quantity: item.quantity,
          price: item.price,
          cost: item.cost || 0,
          metadata: item.metadata || {},
        })),
        discount_type: discountType,
        discount_rate: discountRate,
        vat_rate: taxRates.vat_enabled ? taxRates.tax_rate : 0,
        nhil_rate: taxRates.nhil_enabled ? taxRates.nhil_rate : 0,
        getfund_rate: taxRates.getfund_enabled ? taxRates.getfund_rate : 0,
        covid_levy_rate: taxRates.covid_levy_enabled
          ? taxRates.covid_levy_rate
          : 0,
        notes: notes || undefined,
        terms: terms || "Due on Receipt",
        currency: entity?.currency || "GHC",
        status: status,
        payments: payments,
        amount_paid: paymentAmount || 0,
        taxes_enabled: {
          vat: taxRates.vat_enabled,
          nhil: taxRates.nhil_enabled,
          getfund: taxRates.getfund_enabled,
          covid_levy: taxRates.covid_levy_enabled,
        },
      };

      let response;
      if (isEditing && invoiceUuid) {
        response = await InvoiceService.updateInvoice(invoiceUuid, invoiceData);
      } else {
        response = await InvoiceService.createInvoice(invoiceData);
      }

      if (response.success) {
        const invoice = response.results.invoice;
        toast.success("Success", {
          description:
            status === "draft"
              ? `Draft invoice ${invoice.number} saved!`
              : `Invoice ${invoice.number} ${isEditing ? "updated" : "created"} successfully!`,
        });

        navigate(`/invoices/${invoice.uuid}`, {
          state: { invoice, success: true },
        });
      }
    } catch (error: any) {
      console.error("Error saving invoice:", error);
      toast.error("Error", {
        description:
          error.message || "Failed to save invoice. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-card shadow-sm p-6 mb-6 border border-border flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/invoices")}
              className="p-2 hover:bg-slate-100 transition-colors rounded-lg"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-text">
                {isEditing ? "Edit Invoice" : "Create New Invoice"}
              </h1>
              <p className="text-text-light text-sm">
                {isEditing
                  ? `Editing ${invoiceNumber}`
                  : "Generate a professional invoice"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-text-light">Total</div>
            <div className="text-2xl font-bold text-emerald-600">
              GHS {total.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div className="bg-card shadow-sm border border-border overflow-hidden">
          <div className="p-6 space-y-6">
            {/* Customer & Invoice Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customer Selection */}
              <div className="bg-background p-4 border border-border">
                <h4 className="font-semibold text-text mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Customer Information
                </h4>
                <div className="space-y-3">
                  <div className="relative">
                    <Input
                      type="search"
                      label="Search customer"
                      placeholder="Search customer by name, email, or phone..."
                      value={customerSearch}
                      onChange={(value: string) => {
                        setCustomerSearch(value);
                        setShowCustomerDropdown(true);
                      }}
                      onFocus={() => setShowCustomerDropdown(true)}
                      prefixIcon={<Search size={15} />}
                    />
                    {showCustomerDropdown && customerSearch && (
                      <div className="absolute z-10 w-full bg-background border border-border shadow-lg mt-1 max-h-48 overflow-y-auto rounded-lg">
                        {filteredCustomers.length > 0 ? (
                          filteredCustomers.map((c) => (
                            <div
                              key={c.id}
                              className={`${isDark ? "hover:bg-slate-800" : "hover:bg-slate-50"} p-3 cursor-pointer border-b border-border last:border-0 transition-colors`}
                              onClick={() => {
                                setSelectedCustomer(c.id);
                                setCustomerSearch(c.name);
                                setShowCustomerDropdown(false);
                              }}
                            >
                              <div className="font-medium text-text">
                                {c.name}
                              </div>
                              {c.email && (
                                <div className="text-xs text-text-light">
                                  {c.email}
                                </div>
                              )}
                              {c.phone && (
                                <div className="text-xs text-text-light">
                                  {c.phone}
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-sm text-text-light">
                            No customers found
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {selectedCustomerData && (
                    <div className="bg-primary-5 p-3 border border-primary-20 rounded-lg flex items-start gap-3">
                      <div className="bg-emerald-100 p-2 rounded-full">
                        <Check className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-text">
                          {selectedCustomerData.name}
                        </div>
                        {selectedCustomerData.email && (
                          <div className="text-sm text-text-light flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {selectedCustomerData.email}
                          </div>
                        )}
                        {selectedCustomerData.phone && (
                          <div className="text-sm text-text-light flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {selectedCustomerData.phone}
                          </div>
                        )}
                        {selectedCustomerData.address && (
                          <div className="text-sm text-text-light flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {selectedCustomerData.address}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setSelectedCustomer("");
                          setCustomerSearch("");
                        }}
                        className="text-text-light hover:text-danger transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Invoice Details */}
              <div className="bg-background p-4 border border-border">
                <h4 className="font-semibold text-text mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Invoice Details
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Input
                      type="text"
                      label="Invoice Number"
                      labelType="default"
                      value={invoiceNumber}
                      disabled
                      prefixIcon={<Hash size={14} />}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="date"
                      label="Invoice Date"
                      labelType="default"
                      value={invoiceDate}
                      onChange={(value: string) => setInvoiceDate(value)}
                      prefixIcon={<Calendar size={14} />}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Items Section */}
            <div className="bg-background p-4 border border-border">
              <h4 className="font-semibold text-text mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Add Items
              </h4>
              <div className="flex flex-wrap gap-3">
                <div className="flex-1 min-w-[200px] relative">
                  <Input
                    type="search"
                    placeholder="Search items by name, part number, or type..."
                    value={itemSearch}
                    onChange={(value: string) => {
                      setItemSearch(value);
                      setShowItemDropdown(true);
                      // Clear selected item if search changes
                      if (selectedItemId && value !== selectedItemData?.name) {
                        setSelectedItemId("");
                      }
                    }}
                    onFocus={() => setShowItemDropdown(true)}
                    prefixIcon={<Search size={15} />}
                  />
                  {showItemDropdown && itemSearch && (
                    <div className="absolute z-10 w-full bg-background border border-border shadow-lg mt-1 max-h-48 overflow-y-auto rounded-lg">
                      {filteredItems.length > 0 ? (
                        filteredItems.map((item) => (
                          <div
                            key={item.uuid}
                            className={`${isDark ? "hover:bg-slate-800" : "hover:bg-slate-50"} p-3 cursor-pointer border-b border-border last:border-0 transition-colors`}
                            onClick={() => {
                              setSelectedItemId(item.uuid);
                              setItemSearch(
                                item.part_number
                                  ? `${item.name} (${item.part_number})`
                                  : item.name,
                              );
                              setShowItemDropdown(false);
                            }}
                          >
                            <div className="font-medium text-text">
                              {item.name}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-text-light">
                              {item.part_number && (
                                <span>Part #: {item.part_number}</span>
                              )}
                              <span>Type: {item.type}</span>
                              <span>{item.quantity} available</span>
                              <span className="font-medium text-emerald-600">
                                GHS {item.price.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-sm text-text-light">
                          No items found
                        </div>
                      )}
                    </div>
                  )}
                  {selectedItemData && !showItemDropdown && (
                    <div className="mt-1 p-2 bg-primary-5 border border-primary-20 rounded-lg flex items-center justify-between">
                      <div>
                        <span className="font-medium text-text">
                          {selectedItemData.name}
                        </span>
                        {selectedItemData.part_number && (
                          <span className="text-xs text-text-light ml-2">
                            #{selectedItemData.part_number}
                          </span>
                        )}
                        <span className="text-xs text-text-light ml-2">
                          {selectedItemData.quantity} available
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedItemId("");
                          setItemSearch("");
                        }}
                        className="text-text-light hover:text-danger transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="w-24">
                  <Input
                    type="number"
                    label="Qty"
                    labelType="floating"
                    value={itemQuantity}
                    onChange={(value: number) =>
                      setItemQuantity(Math.max(1, value || 1))
                    }
                    min={1}
                    step={1}
                  />
                </div>
                <Button
                  onClick={addItem}
                  disabled={!selectedItemId || LoadingInventory}
                >
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              </div>

              {/* Items Table */}
              <div className="mt-4 border border-border overflow-hidden rounded-lg">
                <table className="w-full">
                  <thead className="bg-background border-b border-border">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-text-light">
                        Item
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-text-light">
                        Part #
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-text-light">
                        Type
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-text-light">
                        Qty
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-text-light">
                        Price
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-text-light">
                        Total
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-text-light">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-8 text-center text-text-light"
                        >
                          No items added yet
                        </td>
                      </tr>
                    ) : (
                      items.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-background transition-colors"
                        >
                          <td className="px-4 py-3 text-text">{item.name}</td>
                          <td className="px-4 py-3 text-text-light text-sm">
                            {item.part_number || "—"}
                          </td>
                          <td className="px-4 py-3 text-text-light text-sm">
                            {item.type}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                updateItemQuantity(
                                  item.id,
                                  parseInt(e.target.value) || 1,
                                )
                              }
                              className="w-16 p-1.5 border border-border text-right rounded focus:ring-2 focus:ring-primary transition-all"
                              min="1"
                            />
                          </td>
                          <td className="px-4 py-3 text-right text-text-light">
                            GHS {item.price.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-text">
                            GHS {item.total.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => removeItem(item.id)}
                              className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Discount & Tax */}
            <div className="bg-background p-4 border border-border">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Input
                    type="select"
                    label="Discount Type"
                    labelType="default"
                    value={discountType}
                    onChange={(value: any) => setDiscountType(value)}
                    selectOptions={discountTypeOptions}
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    label={
                      discountType === "percentage"
                        ? "Discount %"
                        : "Discount Amount (GHS)"
                    }
                    labelType="default"
                    value={
                      isDiscountFocused && discountRate === 0
                        ? ""
                        : discountRate
                    }
                    onChange={(value: number) => {
                      const numValue =
                        value === null || value === undefined
                          ? 0
                          : Number(value);
                      setDiscountRate(Math.max(0, numValue));
                    }}
                    onFocus={() => setIsDiscountFocused(true)}
                    onBlur={() => setIsDiscountFocused(false)}
                    min={0}
                    max={discountType === "percentage" ? 100 : undefined}
                    step={discountType === "percentage" ? 1 : 0.01}
                  />
                </div>
              </div>
            </div>

            {/* Totals */}
            <div className="bg-background p-4 border border-border">
              <div className="max-w-sm ml-auto space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-light">Subtotal:</span>
                  <span className="text-text">GHS {subtotal.toFixed(2)}</span>
                </div>
                {discountTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-text-light">Discount:</span>
                    <span className="text-red-600">
                      -GHS {discountTotal.toFixed(2)}
                    </span>
                  </div>
                )}
                {taxRates.vat_enabled && taxRates.tax_rate > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-text-light">
                      {`VAT (${taxRates.tax_rate}%)`}
                    </span>
                    <span className="text-text">GHS {vat.toFixed(2)}</span>
                  </div>
                )}
                {taxRates.nhil_enabled && taxRates.nhil_rate > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-text-light">
                      {`NHIL (${taxRates.nhil_rate}%)`}
                    </span>
                    <span className="text-text">GHS {nhil.toFixed(2)}</span>
                  </div>
                )}
                {taxRates.getfund_enabled && taxRates.getfund_rate > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-text-light">
                      {`GETFund (${taxRates.getfund_rate}%):`}
                    </span>
                    <span className="text-text">GHS {getfund.toFixed(2)}</span>
                  </div>
                )}
                {taxRates.covid_levy_enabled &&
                  taxRates.covid_levy_rate > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-text-light">
                        {`COVID-19 Levy (${taxRates.covid_levy_rate}%):`}
                      </span>
                      <span className="text-text">
                        GHS {covidLevy.toFixed(2)}
                      </span>
                    </div>
                  )}
                <div className="border-t border-border pt-2 flex justify-between font-bold">
                  <span className="text-text">Total:</span>
                  <span className="text-emerald-600 text-lg">
                    GHS {total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Section */}
            <div className="bg-background p-4 border border-border">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-text flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Payment
                </h4>
                <button
                  type="button"
                  onClick={() => setShowPaymentSection(!showPaymentSection)}
                  className="text-sm text-primary hover:underline"
                >
                  {showPaymentSection ? "Hide" : "Add Payment"}
                </button>
              </div>

              {showPaymentSection && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Input
                        type="select"
                        label="Payment Method"
                        labelType="default"
                        value={paymentMethod}
                        onChange={(value: any) => setPaymentMethod(value)}
                        selectOptions={paymentMethodOptions}
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        label="Amount Paid (GHS)"
                        labelType="default"
                        value={
                          isPaymentFocused && paymentAmount === 0
                            ? ""
                            : paymentAmount
                        }
                        onChange={(value: number) => {
                          const numValue =
                            value === null || value === undefined
                              ? 0
                              : Number(value);
                          setPaymentAmount(Math.max(0, numValue));
                        }}
                        onFocus={() => setIsPaymentFocused(true)}
                        onBlur={() => setIsPaymentFocused(false)}
                        min={0}
                        max={total}
                        step={0.01}
                      />
                    </div>

                    {paymentMethod === "Bank" && (
                      <div>
                        <Input
                          type="text"
                          label="Branch"
                          labelType="default"
                          placeholder="Bank Branch..."
                          value={bankBranch}
                          onChange={(value: string) => setbankBranch(value)}
                        />
                      </div>
                    )}
                    {(paymentMethod === "Bank" || paymentMethod === "MoMo") && (
                        <div>
                          <Input
                            type="text"
                            label="Transaction ID"
                            labelType="default"
                            placeholder="Transaction Id"
                            value={paymentReference}
                            onChange={(value: string) =>
                              setPaymentReference(value)
                            }
                          />
                        </div>
                      )}
                  </div>

                  {/* Credit Payment Details - Only shown when Credit is selected */}
                  {paymentMethod === "Credit" && (
                    <div className="bg-primary-5 p-4 border border-primary-20 rounded-lg">
                      <div className="flex items-center gap-2 text-primary mb-3">
                        <CreditCard className="w-4 h-4" />
                        <span className="font-semibold">
                          Credit Payment Details
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-text-light mb-1">
                            Due Date
                          </label>
                          <Input
                            type="date"
                            value={dueDate}
                            onChange={(value: string) => setDueDate(value)}
                            prefixIcon={<Calendar size={14} />}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text-light mb-1">
                            Payment Terms
                          </label>
                          <Input
                            type="select"
                            value={terms}
                            onChange={(value: string) => setTerms(value)}
                            selectOptions={termsOptions}
                            prefixIcon={<Clock size={14} />}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <div className="bg-background p-3 rounded-lg border border-border">
                            <div className="flex justify-between items-center">
                              <span className="text-text-light">
                                Total Amount Due:
                              </span>
                              <span className="text-lg font-bold text-primary">
                                GHS {total.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div
                    className={`p-3 border rounded-lg ${
                      remainingBalance < 0
                        ? "bg-success-5 border-success-20 text-success"
                        : "bg-danger-5 border-danger-20 text-danger"
                    }`}
                  >
                    <p className="text-sm">
                      <span className="font-semibold">{balanceLabel}:</span>{" "}
                      {entity?.currency || "GHC"}{" "}
                      {Math.abs(remainingBalance).toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <Input
                type="textarea"
                label="Notes (Optional)"
                labelType="default"
                placeholder="Add any additional notes or instructions..."
                value={notes}
                onChange={(value: string) => setNotes(value)}
                rows={3}
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-border bg-background flex flex-wrap justify-between items-center gap-4">
            <Button onClick={() => navigate("/invoices")} variant="danger">
              Cancel
            </Button>
            <div className="flex gap-3 flex-wrap">
              <Button
                onClick={() => handleSubmit("draft")}
                variant="ghost"
                disabled={loading}
              >
                Save Draft
              </Button>
              <Button
                onClick={() => handleSubmit("invoiced")}
                disabled={loading || items.length === 0}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-border border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    {isEditing ? "Update Invoice" : "Create Invoice"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateInvoice;
