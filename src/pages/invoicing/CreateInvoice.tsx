import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Plus, Trash2, Search, User, FileText, CreditCard, Phone, Mail, Check, ArrowLeft } from 'lucide-react';
import Input, { SelectOption } from '../../components/common/Input';
import { InvoiceItem } from '../../core/types';
import { defaultSystemSettings, generateInitialInventory, initialUsers } from '../../data/sampleData';
import { Button } from '../../components/common';
import { useTheme } from '../../core/contexts/ThemeProvider';

const CreateInvoice = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'MoMo' | 'Bank' | 'Credit'>('Cash');
  const [momoTransactionId, setMomoTransactionId] = useState('');
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');

  // Payment method specific fields
  const [cashTendered, setCashTendered] = useState('');
  const [momoProvider, setMomoProvider] = useState('');
  const [momoPhone, setMomoPhone] = useState('');
  const [bankReference, setBankReference] = useState('');
  const [bankName, setBankName] = useState('');
  const [creditTerms, setCreditTerms] = useState('Net 30');
  
  const inventoryItems = generateInitialInventory();
  const systemSettings = defaultSystemSettings;
  const customers = initialUsers;
  const { isDark } = useTheme();

  // Get invoice from navigation state or fetch by ID
  useEffect(() => {
    const loadInvoice = () => {
      // Check if we have invoice in navigation state
      const stateInvoice = location.state?.invoice;
      
      if (stateInvoice) {
        // Pre-populate form with invoice data
        setIsEditing(true);
        setInvoiceNumber(stateInvoice.number);
        setSelectedCustomer(customers.find(c => c.name === stateInvoice.customer)?.id || '');
        setCustomerSearch(stateInvoice.customer);
        setPaymentMethod(stateInvoice.paymentMethod);
        setMomoTransactionId(stateInvoice.momoTransactionId || '');
        setInvoiceItems(stateInvoice.items);
        setNotes(stateInvoice.notes || '');
        setCreditTerms(stateInvoice.terms || 'Net 30');
        return;
      }

      // If we have an ID in the URL, try to fetch from localStorage
      if (id) {
        try {
          const storedInvoices = localStorage.getItem('INVOICES');
          if (storedInvoices) {
            const invoices = JSON.parse(storedInvoices);
            const foundInvoice = invoices.find((inv: any) => inv.id === id);
            if (foundInvoice) {
              setIsEditing(true);
              setInvoiceNumber(foundInvoice.number);
              setSelectedCustomer(customers.find(c => c.name === foundInvoice.customer)?.id || '');
              setCustomerSearch(foundInvoice.customer);
              setPaymentMethod(foundInvoice.paymentMethod);
              setMomoTransactionId(foundInvoice.momoTransactionId || '');
              setInvoiceItems(foundInvoice.items);
              setNotes(foundInvoice.notes || '');
              setCreditTerms(foundInvoice.terms || 'Net 30');
            }
          }
        } catch (error) {
          console.error('Error loading invoice:', error);
        }
      }
    };

    loadInvoice();
  }, [id, location.state, customers]);

  // Convert customers to SelectOption format
  const customerOptions: SelectOption[] = useMemo(() => {
    return customers.map(c => ({
      value: c.id,
      label: c.name,
    }));
  }, [customers]);

  // Convert inventory items to SelectOption format
  const itemOptions: SelectOption[] = useMemo(() => {
    return inventoryItems
      .filter(item => item.quantity > 0)
      .map(item => ({
        value: item.id,
        label: `${item.name} - ${item.quantity} available (GHS ${item.price})`,
      }));
  }, [inventoryItems]);

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

  const addItemToInvoice = () => {
    if (!selectedItemId) return;
    const inventoryItem = inventoryItems.find(i => i.id === selectedItemId);
    if (!inventoryItem) return;

    const existingItem = invoiceItems.find(i => i.id === selectedItemId);
    if (existingItem) {
      setInvoiceItems(prev =>
        prev.map(i =>
          i.id === selectedItemId
            ? {
                ...i,
                quantity: i.quantity + itemQuantity,
                total: (i.quantity + itemQuantity) * i.unitPrice,
              }
            : i
        )
      );
    } else {
      setInvoiceItems(prev => [
        ...prev,
        {
          id: selectedItemId,
          description: inventoryItem.name,
          quantity: itemQuantity,
          unitPrice: inventoryItem.price,
          total: itemQuantity * inventoryItem.price,
        },
      ]);
    }
    setSelectedItemId('');
    setItemQuantity(1);
  };

  const removeItemFromInvoice = (itemId: string) => {
    setInvoiceItems(prev => prev.filter(i => i.id !== itemId));
  };

  const updateItemQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setInvoiceItems(prev =>
      prev.map(i =>
        i.id === itemId
          ? { ...i, quantity: newQuantity, total: newQuantity * i.unitPrice }
          : i
      )
    );
  };

  const subtotal = useMemo(() => {
    return invoiceItems.reduce((sum, item) => sum + item.total, 0);
  }, [invoiceItems]);

  const discountTotal = useMemo(() => {
    return invoiceItems.reduce((sum, item) => sum + (item.discount || 0), 0);
  }, [invoiceItems]);

  const netSubtotal = subtotal - discountTotal;
  const vat = netSubtotal * (systemSettings.taxRate / 100);
  const nhil = netSubtotal * (systemSettings.nhilRate / 100);
  const getfund = netSubtotal * (systemSettings.getfundRate / 100);
  const covidLevy = netSubtotal * (systemSettings.covidLevyRate / 100);
  const total = netSubtotal + vat + nhil + getfund + covidLevy;

  // Payment method options
  const paymentMethodOptions: SelectOption[] = [
    { value: 'Cash', label: '💵 Cash' },
    { value: 'MoMo', label: '📱 Mobile Money' },
    { value: 'Bank', label: '🏦 Bank Transfer' },
    { value: 'Credit', label: '📋 Credit / Invoice' },
  ];

  const creditTermsOptions: SelectOption[] = [
    { value: 'Due on Receipt', label: 'Due on Receipt' },
    { value: 'Net 15', label: 'Net 15' },
    { value: 'Net 30', label: 'Net 30' },
    { value: 'Net 45', label: 'Net 45' },
    { value: 'Net 60', label: 'Net 60' },
  ];

  // Generate invoice number
  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `INV-${year}${month}${day}-${random}`;
  };

  const handleSubmit = async () => {
    if (!selectedCustomer) {
      alert('Please select a customer');
      return;
    }
    if (invoiceItems.length === 0) {
      alert('Please add at least one item');
      return;
    }

    setLoading(true);
    try {
      const customer = customers.find(c => c.id === selectedCustomer);
      
      // Create new invoice object
      const newInvoice = {
        id: isEditing ? id || `inv-${Date.now()}` : `inv-${Date.now()}`,
        number: isEditing ? invoiceNumber : generateInvoiceNumber(),
        date: new Date(),
        dueDate: paymentMethod === 'Credit' 
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          : undefined,
        customer: customer?.name || 'Walk-in Customer',
        customerEmail: customer?.email || '',
        customerPhone: customer?.phone || '',
        customerAddress: customer?.address || '',
        items: invoiceItems.map(item => ({
          ...item,
          id: `item-${Date.now()}-${Math.random()}`,
        })),
        subtotal,
        discountTotal,
        vat,
        nhil,
        getfund,
        covidLevy,
        total,
        paymentMethod,
        momoTransactionId: paymentMethod === 'MoMo' ? momoTransactionId : undefined,
        paymentStatus: paymentMethod === 'Credit' ? 'Unpaid' : 'Paid',
        amountPaid: paymentMethod === 'Credit' ? 0 : total,
        status: 'invoiced' as const,
        notes: notes || undefined,
        terms: paymentMethod === 'Credit' ? creditTerms : 'Due on Receipt',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      console.log(isEditing ? 'Invoice updated:' : 'Invoice created:', newInvoice);
      
      // Save to localStorage
      try {
        const storedInvoices = localStorage.getItem('INVOICES');
        let invoices = [];
        if (storedInvoices) {
          invoices = JSON.parse(storedInvoices);
        }
        
        if (isEditing) {
          // Update existing invoice
          const index = invoices.findIndex((inv: any) => inv.id === newInvoice.id);
          if (index !== -1) {
            invoices[index] = newInvoice;
          } else {
            invoices.push(newInvoice);
          }
        } else {
          invoices.push(newInvoice);
        }
        
        localStorage.setItem('INVOICES', JSON.stringify(invoices));
      } catch (error) {
        console.error('Error saving invoice to localStorage:', error);
      }
      
      navigate(`/invoices/${newInvoice.id}`, { 
        state: { 
          invoice: newInvoice,
          success: true,
          message: isEditing 
            ? `Invoice ${newInvoice.number} updated successfully!` 
            : `Invoice ${newInvoice.number} created successfully!`
        } 
      });
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Failed to create invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = () => {
    if (!selectedCustomer) {
      alert('Please select a customer');
      return;
    }
    if (invoiceItems.length === 0) {
      alert('Please add at least one item');
      return;
    }

    const customer = customers.find(c => c.id === selectedCustomer);
    
    const draftInvoice = {
      id: isEditing ? id || `inv-${Date.now()}` : `inv-${Date.now()}`,
      number: isEditing ? invoiceNumber : generateInvoiceNumber(),
      date: new Date(),
      dueDate: undefined,
      customer: customer?.name || 'Walk-in Customer',
      customerEmail: customer?.email || '',
      customerPhone: customer?.phone || '',
      customerAddress: customer?.address || '',
      items: invoiceItems.map(item => ({
        ...item,
        id: `item-${Date.now()}-${Math.random()}`,
      })),
      subtotal,
      discountTotal,
      vat,
      nhil,
      getfund,
      covidLevy,
      total,
      paymentMethod,
      momoTransactionId: paymentMethod === 'MoMo' ? momoTransactionId : undefined,
      paymentStatus: 'Unpaid' as const,
      amountPaid: 0,
      status: 'draft' as const,
      notes: notes || undefined,
      terms: paymentMethod === 'Credit' ? creditTerms : 'Due on Receipt',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    console.log('Draft invoice saved:', draftInvoice);
    
    try {
      const storedInvoices = localStorage.getItem('INVOICES');
      let invoices = [];
      if (storedInvoices) {
        invoices = JSON.parse(storedInvoices);
      }
      
      if (isEditing) {
        const index = invoices.findIndex((inv: any) => inv.id === draftInvoice.id);
        if (index !== -1) {
          invoices[index] = draftInvoice;
        } else {
          invoices.push(draftInvoice);
        }
      } else {
        invoices.push(draftInvoice);
      }
      
      localStorage.setItem('INVOICES', JSON.stringify(invoices));
    } catch (error) {
      console.error('Error saving draft invoice to localStorage:', error);
    }
    
    navigate(`/invoices/${draftInvoice.id}`, { 
      state: { 
        invoice: draftInvoice,
        success: true,
        message: `Draft invoice ${draftInvoice.number} saved successfully!`
      } 
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="bg-card shadow-sm p-6 mb-6 border border-border flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/invoices')}
              className="p-2 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-text flex items-center gap-2">
                {isEditing ? 'Edit Invoice' : 'Create New Invoice'}
              </h1>
              <p className="text-text-light text-sm">
                {isEditing 
                  ? `Editing invoice ${invoiceNumber}` 
                  : 'Generate a professional invoice for your customer'}
              </p>
            </div>
          </div>
          <div className="text-sm text-text-light">
            <span className="font-medium">Total: </span>
            <span className="text-lg font-bold text-emerald-600">GHS {total.toFixed(2)}</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-card shadow-sm border border-border overflow-hidden">
          <div className="p-6 space-y-6">
            {/* Customer Selection */}
            <div className="bg-background p-4 border border-border">
              <h4 className="font-semibold text-text mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                Customer Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Input
                    type="search"
                    placeholder="Type to search customer..."
                    value={customerSearch}
                    onChange={(value: string) => {
                      setCustomerSearch(value);
                      setShowCustomerDropdown(true);
                    }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    prefixIcon={<Search size={15}/>}
                  />
                  {showCustomerDropdown && customerSearch && (
                    <div className="absolute z-10 w-full bg-background border border-border shadow-lg mt-1 max-h-48 overflow-y-auto">
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
                  <div className="bg-background p-3 border border-border flex items-center gap-3">
                    <div className="bg-emerald-100 p-2">
                      <Check className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
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
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Items Selection */}
            <div className="bg-card p-4 border border-border">
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
                    value={itemQuantity}
                    onChange={(value: number) => setItemQuantity(Math.max(1, value || 1))}
                    min={1}
                  />
                </div>
                <Button
                  onClick={addItemToInvoice}
                  disabled={!selectedItemId}
                >
                  <Plus className="w-4 h-4" />
                  Add
                </Button>
              </div>
            </div>

            {/* Invoice Items Table */}
            <div className="border border-border overflow-hidden">
              <table className="w-full">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-text-light">Description</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-text-light">Qty</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-text-light">Unit Price</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-text-light">Total</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-text-light">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoiceItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-text-light">
                        No items added yet
                      </td>
                    </tr>
                  ) : (
                    invoiceItems.map(item => (
                      <tr key={item.id} className={`${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'} transition-colors`}>
                        <td className="px-4 py-3 text-text">{item.description}</td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                            className="w-16 p-1.5 border border-border text-right focus:ring-2 focus:ring-emerald-500 transition-all"
                            min="1"
                          />
                        </td>
                        <td className="px-4 py-3 text-right text-text-light">GHS {item.unitPrice.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-medium text-text">GHS {item.total.toFixed(2)}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => removeItemFromInvoice(item.id)}
                            className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-card border-t border-border">
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-right font-medium text-text-light">Subtotal:</td>
                    <td className="px-4 py-2 text-right font-medium text-text">GHS {subtotal.toFixed(2)}</td>
                    <td></td>
                  </tr>
                  {discountTotal > 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-right text-text-light">Discount:</td>
                      <td className="px-4 py-2 text-right text-red-600">-GHS {discountTotal.toFixed(2)}</td>
                      <td></td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-right text-sm text-text-light">VAT ({systemSettings.taxRate}%):</td>
                    <td className="px-4 py-2 text-right text-sm text-text-light">GHS {vat.toFixed(2)}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-right text-sm text-text-light">NHIL ({systemSettings.nhilRate}%):</td>
                    <td className="px-4 py-2 text-right text-sm text-text-light">GHS {nhil.toFixed(2)}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-right text-sm text-text-light">GETFund ({systemSettings.getfundRate}%):</td>
                    <td className="px-4 py-2 text-right text-sm text-text-light">GHS {getfund.toFixed(2)}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-right text-sm text-text-light">COVID-19 Levy ({systemSettings.covidLevyRate}%):</td>
                    <td className="px-4 py-2 text-right text-sm text-text-light">GHS {covidLevy.toFixed(2)}</td>
                    <td></td>
                  </tr>
                  <tr className="bg-background">
                    <td colSpan={3} className="px-4 py-3 text-right font-bold text-text">Total:</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600 text-lg">GHS {total.toFixed(2)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Payment Method */}
            <div className="bg-card p-4 border border-border">
              <h4 className="font-semibold text-text mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Payment Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                {paymentMethod === 'MoMo' && (
                  <div>
                    <Input
                      type="text"
                      label="Transaction ID"
                      labelType="default"
                      placeholder="e.g. MOMO-123456789"
                      value={momoTransactionId}
                      onChange={(value: string) => setMomoTransactionId(value)}
                    />
                  </div>
                )}

                {paymentMethod === 'Bank' && (
                  <div>
                    <Input
                      type="text"
                      label="Reference Number"
                      labelType="default"
                      placeholder="e.g. BNK-2024-001"
                      value={bankReference}
                      onChange={(value: string) => setBankReference(value)}
                    />
                  </div>
                )}

                {paymentMethod === 'Credit' && (
                  <div>
                    <Input
                      type="select"
                      label="Credit Terms"
                      labelType="default"
                      value={creditTerms}
                      onChange={(value: string) => setCreditTerms(value)}
                      selectOptions={creditTermsOptions}
                    />
                  </div>
                )}
              </div>
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
          <div className="p-6 border-t border-border bg-card flex justify-between items-center">
            <Button
              onClick={() => navigate('/invoices')}
              variant="danger"
            >
              Cancel
            </Button>
            <div className="flex gap-3">
              <Button
                onClick={handleSaveDraft}
                variant="ghost"
              >
                Save Draft
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || invoiceItems.length === 0 || !selectedCustomer}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-card border-t-transparent rounded-full animate-spin" />
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