import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Plus, Trash2, Search, User, FileText, CreditCard, Phone, Mail, Check, ArrowLeft, Hash, MapPin, X } from 'lucide-react';
import Input, { SelectOption } from '../../components/common/Input';
import { Button } from '../../components/common';
import { useTheme } from '../../core/contexts/ThemeProvider';
import InvoiceService from '../../core/services/invoice';
import { toast } from 'sonner';
import { InvItemType, InvItemUnitType, InvoicePayment } from '../../core/types';
import { defaultSystemSettings } from '../../data/sampleData';

interface FormInvoiceItem {
  id: string;
  name: string;
  type: string;
  unit: string;
  quantity: number;
  price: number;
  cost: number;
  total: number;
  specs?: any;
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
  const [isEditing, setIsEditing] = useState(false);
  const [invoiceUuid, setInvoiceUuid] = useState<string>('');
  
  // Customer state
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  // Invoice details
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('Net 30');
  
  // Items
  const [items, setItems] = useState<FormInvoiceItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  
  // Payment
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'MoMo' | 'Bank' | 'Credit'>('Cash');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [showPaymentSection, setShowPaymentSection] = useState(false);
  
  // Discount & Tax
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountRate, setDiscountRate] = useState(0);
  const [vatRate, setVatRate] = useState(12.5);

  const { isDark } = useTheme();
  const systemSettings = {
    taxRate: 12.5,
    nhilRate: 2.5,
    getfundRate: 2.5,
    covidLevyRate: 1,
  };

  // Load customers from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("CUSTOMERS");
      if (stored) {
        const parsed = JSON.parse(stored);
        setCustomers(parsed);
      }
    } catch (error) {
      console.error("Error loading customers:", error);
    }
  }, []);

  // Load inventory items
  useEffect(() => {
    try {
      const stored = localStorage.getItem("INVENTORY");
      if (stored) {
        const parsed = JSON.parse(stored);
        setInventoryItems(parsed);
      }
    } catch (error) {
      console.error("Error loading inventory:", error);
    }
  }, []);

  // Load invoice for editing
  useEffect(() => {
    const loadInvoice = async () => {
      const stateInvoice = location.state?.invoice;
      
      if (stateInvoice) {
        setIsEditing(true);
        setInvoiceUuid(stateInvoice.uuid || stateInvoice.id);
        setInvoiceNumber(stateInvoice.number);
        setInvoiceDate(stateInvoice.date?.split('T')[0] || new Date().toISOString().split('T')[0]);
        setDueDate(stateInvoice.due_date?.split('T')[0] || '');
        setNotes(stateInvoice.notes || '');
        setTerms(stateInvoice.terms || 'Net 30');
        
        // Set customer
        const customer = customers.find(c => c.name === stateInvoice.customer?.name);
        if (customer) {
          setSelectedCustomer(customer.id);
          setCustomerSearch(customer.name);
        }
        
        // Set items
        if (stateInvoice.items) {
          setItems(stateInvoice.items.map((item: any) => ({
            ...item,
            total: item.price * item.quantity,
          })));
        }
        
        // Set payment info
        setPaymentMethod(stateInvoice.paymentMethod || 'Cash');
        setPaymentAmount(stateInvoice.amount_paid || 0);
        
        // Set discount and tax
        setDiscountType(stateInvoice.discount_type || 'percentage');
        setDiscountRate(stateInvoice.discount_rate || 0);
        setVatRate(stateInvoice.vat_rate || 12.5);
        
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
            setInvoiceDate(invoice.date?.split('T')[0] || new Date().toISOString().split('T')[0]);
            setDueDate(invoice.due_date?.split('T')[0] || '');
            setNotes(invoice.notes || '');
            setTerms(invoice.terms || 'Net 30');
            
            // Set customer
            const customer = customers.find(c => c.name === invoice.customer?.name);
            if (customer) {
              setSelectedCustomer(customer.id);
              setCustomerSearch(customer.name);
            }
            
            // Set items
            if (invoice.items) {
              setItems(invoice.items.map((item: any) => ({
                ...item,
                total: item.price * item.quantity,
              })));
            }
            
            // Set payment info
            setPaymentMethod(invoice.paymentMethod || 'Cash');
            setPaymentAmount(invoice.amount_paid || 0);
            
            // Set discount and tax
            setDiscountType(invoice.discount_type || 'percentage');
            setDiscountRate(invoice.discount_rate || 0);
            setVatRate(invoice.vat_rate || 12.5);
          }
        } catch (error) {
          console.error('Error loading invoice:', error);
          toast.error('Error', { description: 'Failed to load invoice data' });
        } finally {
          setLoading(false);
        }
      }
    };

    loadInvoice();
  }, [id, location.state, customers]);

  // Calculations
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [items]);

  const discountTotal = useMemo(() => {
    if (discountType === 'percentage') {
      return (subtotal * discountRate) / 100;
    }
    return discountRate;
  }, [subtotal, discountType, discountRate]);

  const netSubtotal = subtotal - discountTotal;
  const vat = netSubtotal * (vatRate / 100);
  const nhil = netSubtotal * (systemSettings.nhilRate / 100);
  const getfund = netSubtotal * (systemSettings.getfundRate / 100);
  const covidLevy = netSubtotal * (systemSettings.covidLevyRate / 100);
  const total = netSubtotal + vat + nhil + getfund + covidLevy;
  const remainingBalance = total - paymentAmount;

  // Payment method options
  const paymentMethodOptions: SelectOption[] = [
    { value: 'Cash', label: '💵 Cash' },
    { value: 'MoMo', label: '📱 Mobile Money' },
    { value: 'Bank', label: '🏦 Bank Transfer' },
    { value: 'Credit', label: '📋 Credit' },
  ];

  const discountTypeOptions: SelectOption[] = [
    { value: 'percentage', label: 'Percentage (%)' },
    { value: 'fixed', label: 'Fixed Amount (GHS)' },
  ];

  const termsOptions: SelectOption[] = [
    { value: 'Due on Receipt', label: 'Due on Receipt' },
    { value: 'Net 15', label: 'Net 15' },
    { value: 'Net 30', label: 'Net 30' },
    { value: 'Net 45', label: 'Net 45' },
    { value: 'Net 60', label: 'Net 60' },
  ];

  // Customer filtering
  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers;
    const search = customerSearch.toLowerCase();
    return customers.filter(
      c =>
        c.name.toLowerCase().includes(search) ||
        c.email?.toLowerCase().includes(search) ||
        c.phone?.toLowerCase().includes(search)
    );
  }, [customers, customerSearch]);

  const selectedCustomerData = useMemo(() => {
    return customers.find(c => c.id === selectedCustomer);
  }, [customers, selectedCustomer]);

  // Item options
  const itemOptions: SelectOption[] = useMemo(() => {
    return inventoryItems
      .filter(item => item.quantity > 0)
      .map(item => ({
        value: item.id,
        label: `${item.name} - ${item.quantity} available (GHS ${item.price})`,
      }));
  }, [inventoryItems]);

  // Add item
  const addItem = () => {
    if (!selectedItemId) return;
    const inventoryItem = inventoryItems.find(i => i.id === selectedItemId);
    if (!inventoryItem) return;

    const existingItem = items.find(i => i.id === selectedItemId);
    if (existingItem) {
      setItems(prev =>
        prev.map(i =>
          i.id === selectedItemId
            ? {
                ...i,
                quantity: i.quantity + itemQuantity,
                total: (i.quantity + itemQuantity) * i.price,
              }
            : i
        )
      );
    } else {
      setItems(prev => [
        ...prev,
        {
          id: inventoryItem.id,
          name: inventoryItem.name,
          type: inventoryItem.type || 'other',
          unit: inventoryItem.unit || 'pieces',
          quantity: itemQuantity,
          price: inventoryItem.price,
          cost: inventoryItem.cost || 0,
          total: itemQuantity * inventoryItem.price,
          specs: inventoryItem.specs || {},
        },
      ]);
    }
    setSelectedItemId('');
    setItemQuantity(1);
  };

  // Remove item
  const removeItem = (itemId: string) => {
    setItems(prev => prev.filter(i => i.id !== itemId));
  };

  // Update item quantity
  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setItems(prev =>
      prev.map(i =>
        i.id === itemId
          ? { ...i, quantity: newQuantity, total: newQuantity * i.price }
          : i
      )
    );
  };

  // Generate invoice number
  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `${defaultSystemSettings.invoicePrefix}${year}${month}${day}-${random}`;
  };

  // Submit invoice
  const handleSubmit = async (status: 'draft' | 'invoiced' = 'invoiced') => {
    if (!selectedCustomer) {
      toast.error('Validation Error', { description: 'Please select a customer' });
      return;
    }
    if (items.length === 0) {
      toast.error('Validation Error', { description: 'Please add at least one item' });
      return;
    }

    setLoading(true);
    try {
      const customer = customers.find(c => c.id === selectedCustomer);
      
      // Prepare payments
      const payments: InvoicePayment[] = [];
      if (paymentAmount > 0) {
        payments.push({
          amount: paymentAmount,
          method: paymentMethod,
          reference: paymentReference || undefined,
          date: new Date().toISOString(),
          notes: paymentNotes || undefined,
        });
      }

      const invoiceData = {
        number: isEditing ? invoiceNumber : generateInvoiceNumber(),
        date: invoiceDate,
        due_date: dueDate || undefined,
        customer: {
          name: customer?.name || '',
          email: customer?.email || '',
          phone: customer?.phone || '',
          address: customer?.address || '',
          tax_id: customer?.tax_id || '',
        },
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          type: item.type as InvItemType,
          unit: item.unit as InvItemUnitType,
          quantity: item.quantity,
          price: item.price,
          cost: item.cost || 0,
          specs: item.specs || {},
        })),
        discount_type: discountType,
        discount_rate: discountRate,
        vat_rate: vatRate,
        notes: notes || undefined,
        terms: terms || 'Due on Receipt',
        currency: 'GHS',
        status: status,
        payments: payments,
        amount_paid: paymentAmount || 0,
      };

      let response;
      if (isEditing && invoiceUuid) {
        response = await InvoiceService.updateInvoice(invoiceUuid, invoiceData);
      } else {
        response = await InvoiceService.createInvoice(invoiceData);
      }

      if (response.success) {
        const invoice = response.results.invoice;
        toast.success('Success', {
          description: status === 'draft' 
            ? `Draft invoice ${invoice.number} saved!` 
            : `Invoice ${invoice.number} ${isEditing ? 'updated' : 'created'} successfully!`
        });
        
        navigate(`/invoices/${invoice.uuid}`, { 
          state: { invoice, success: true }
        });
      }
    } catch (error: any) {
      console.error('Error saving invoice:', error);
      toast.error('Error', {
        description: error.message || 'Failed to save invoice. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-card shadow-sm p-6 mb-6 border border-border flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/invoices')}
              className="p-2 hover:bg-slate-100 transition-colors rounded-lg"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-text">
                {isEditing ? 'Edit Invoice' : 'Create New Invoice'}
              </h1>
              <p className="text-text-light text-sm">
                {isEditing ? `Editing ${invoiceNumber}` : 'Generate a professional invoice'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-text-light">Total</div>
            <div className="text-2xl font-bold text-emerald-600">GHS {total.toFixed(2)}</div>
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
                          filteredCustomers.map(c => (
                            <div
                              key={c.id}
                              className={`${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'} p-3 cursor-pointer border-b border-border last:border-0 transition-colors`}
                              onClick={() => {
                                setSelectedCustomer(c.id);
                                setCustomerSearch(c.name);
                                setShowCustomerDropdown(false);
                              }}
                            >
                              <div className="font-medium text-text">{c.name}</div>
                              {c.email && <div className="text-xs text-text-light">{c.email}</div>}
                              {c.phone && <div className="text-xs text-text-light">{c.phone}</div>}
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-sm text-text-light">No customers found</div>
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
                        <div className="font-medium text-text">{selectedCustomerData.name}</div>
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
                          setSelectedCustomer('');
                          setCustomerSearch('');
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
                  <div>
                    <Input
                      type="text"
                      label="Invoice Number"
                      labelType="default"
                      value={invoiceNumber}
                      disabled
                      prefixIcon={<Hash size={14} />}
                    />
                  </div>
                  <div>
                    <Input
                      type="date"
                      label="Invoice Date"
                      labelType="default"
                      value={invoiceDate}
                      onChange={(value: string) => setInvoiceDate(value)}
                    />
                  </div>
                  <div>
                    <Input
                      type="date"
                      label="Due Date"
                      labelType="default"
                      value={dueDate}
                      onChange={(value: string) => setDueDate(value)}
                    />
                  </div>
                  <div>
                    <Input
                      type="select"
                      label="Payment Terms"
                      labelType="default"
                      value={terms}
                      onChange={(value: string) => setTerms(value)}
                      selectOptions={termsOptions}
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
                <div className="flex-1 min-w-[200px]">
                  <Input
                    type="select"
                    value={selectedItemId}
                    onChange={(value: string) => setSelectedItemId(value)}
                    selectOptions={itemOptions}
                    selectPlaceholder="Select an item..."
                  />
                </div>
                <div className="w-24">
                  <Input
                    type="number"
                    label="Qty"
                    labelType="default"
                    value={itemQuantity}
                    onChange={(value: number) => setItemQuantity(Math.max(1, value || 1))}
                    min={1}
                  />
                </div>
                <Button onClick={addItem} disabled={!selectedItemId}>
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              </div>

              {/* Items Table */}
              <div className="mt-4 border border-border overflow-hidden rounded-lg">
                <table className="w-full">
                  <thead className="bg-background border-b border-border">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-text-light">Item</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-text-light">Type</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-text-light">Qty</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-text-light">Price</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-text-light">Total</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-text-light">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-text-light">
                          No items added yet
                        </td>
                      </tr>
                    ) : (
                      items.map(item => (
                        <tr key={item.id} className="hover:bg-background transition-colors">
                          <td className="px-4 py-3 text-text">{item.name}</td>
                          <td className="px-4 py-3 text-text-light text-sm">{item.type}</td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                              className="w-16 p-1.5 border border-border text-right rounded focus:ring-2 focus:ring-primary transition-all"
                              min="1"
                            />
                          </td>
                          <td className="px-4 py-3 text-right text-text-light">GHS {item.price.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right font-medium text-text">GHS {item.total.toFixed(2)}</td>
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
                    label={discountType === 'percentage' ? 'Discount %' : 'Discount Amount (GHS)'}
                    labelType="default"
                    value={discountRate}
                    onChange={(value: number) => setDiscountRate(Math.max(0, value || 0))}
                    min={0}
                    max={discountType === 'percentage' ? 100 : undefined}
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    label="VAT Rate (%)"
                    labelType="default"
                    value={vatRate}
                    onChange={(value: number) => setVatRate(Math.max(0, value || 0))}
                    min={0}
                    max={100}
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
                    <span className="text-red-600">-GHS {discountTotal.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-text-light">VAT ({vatRate}%):</span>
                  <span className="text-text">GHS {vat.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-light">NHIL (2.5%):</span>
                  <span className="text-text">GHS {nhil.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-light">GETFund (2.5%):</span>
                  <span className="text-text">GHS {getfund.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-light">COVID-19 Levy (1%):</span>
                  <span className="text-text">GHS {covidLevy.toFixed(2)}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between font-bold">
                  <span className="text-text">Total:</span>
                  <span className="text-emerald-600 text-lg">GHS {total.toFixed(2)}</span>
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
                  {showPaymentSection ? 'Hide' : 'Add Payment'}
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
                        value={paymentAmount}
                        onChange={(value: number) => setPaymentAmount(Math.max(0, value || 0))}
                        min={0}
                        max={total}
                      />
                    </div>
                    <div>
                      <Input
                        type="text"
                        label="Reference"
                        labelType="default"
                        placeholder="Transaction reference..."
                        value={paymentReference}
                        onChange={(value: string) => setPaymentReference(value)}
                      />
                    </div>
                    <div>
                      <Input
                        type="text"
                        label="Notes"
                        labelType="default"
                        placeholder="Payment notes..."
                        value={paymentNotes}
                        onChange={(value: string) => setPaymentNotes(value)}
                      />
                    </div>
                  </div>
                  
                  <div className="bg-amber-50 p-3 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-700">
                      <span className="font-semibold">ℹ️ Remaining Balance:</span>{' '}
                      GHS {remainingBalance.toFixed(2)}
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
            <Button
              onClick={() => navigate('/invoices')}
              variant="danger"
            >
              Cancel
            </Button>
            <div className="flex gap-3 flex-wrap">
              <Button
                onClick={() => handleSubmit('draft')}
                variant="ghost"
                disabled={loading}
              >
                Save Draft
              </Button>
              <Button
                onClick={() => handleSubmit('invoiced')}
                disabled={loading || items.length === 0 || !selectedCustomer}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-border border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    {isEditing ? 'Update Invoice' : 'Create Invoice'}
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