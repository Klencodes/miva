import React, { useState, useEffect } from "react";
import { Button, Input } from "../../../ui";
import { appService } from "../../../core/services/app";
import { toast } from "sonner";
import { useModal } from "../../../core/hooks/useModal";
import useNetworkStatus from "../../../core/hooks/useNetworkStatus";
import { indexedDBService } from "../../../core/services/indexdb";
import { ICustomer } from "../../../core/interfaces/ICustomer";

interface Customer {
  id: string;
  full_name: string;
  phone_number: string;
  address: string;
  email?: string;
}

interface AddCustomerModalProps {
  onClose: (newCustomer?: Customer) => void;
  name?: string;
}

const AddCustomerModal: React.FC<AddCustomerModalProps> = ({ onClose, name }) => {
  const [fullName, setFullName] = useState(name || "");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const isOnline = useNetworkStatus();

 const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const newCustomerData = {
        full_name: fullName,
        phone_number: phoneNumber,
        address: address,
        email: email, // If you uncomment this field later
    };

    if (isOnline) {
      try {
        const response = await appService.createCustomer(newCustomerData);
        if (response.success) {
          toast.success("Customer added successfully!");
          onClose(response.results);
          // Save the synced customer to IndexedDB
          await indexedDBService.saveCustomer({...response.results, status: 'synced', id: response.results.id});
        } else {
          toast.error(response.message || "Failed to add customer.");
        }
      } catch (error) {
        toast.error("An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    } else {
      // OFFLINE: Save to IndexDB
      try {
        // Save the customer with 'pending' status
        const savedCustomer = await indexedDBService.saveCustomer({
          ...newCustomerData,
          id: "",
          status: 'pending',
          server_id: "",
          updated_at: ""
        });
        
        // Map the saved DBCustomer back to the expected Customer interface for onClose
        const customerResult: Customer = {
             id: savedCustomer.id, // Use local ID
             full_name: savedCustomer.full_name,
             phone_number: savedCustomer.phone_number,
             address: savedCustomer.address,
             email: savedCustomer.email,
        };

        toast.warning("Customer saved locally and will sync when online.");
        onClose(customerResult); 
      } catch (error) {
        toast.error("Failed to save customer locally.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold text-text mb-4">Add New Customer</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            value={fullName}
            onChange={setFullName}
            required
          />
          <Input
            label="Phone Number"
            value={phoneNumber}
            onChange={setPhoneNumber}
            required
          />
           <Input
            label="Email(Optinal)"
            value={email}
            onChange={setEmail}
          />
          <Input label="Address" value={address} onChange={setAddress} required />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onClose()}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>Add Customer</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CustomerModal: React.FC = () => {
const { modalRef } = useModal();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [openAddCustomerModal, setOpenAddCustomerModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const isOnline = useNetworkStatus();

  // Fetch customers on modal open
  useEffect(() => {
      fetchCustomers();
  // eslint-disable-next-line
  }, []);

  // Filter customers based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(
        (customer) =>
          customer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.phone_number.includes(searchTerm) ||
          customer.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCustomers(filtered);
    }
  }, [searchTerm, customers]);

const fetchCustomers = async () => {
    setLoading(true);
    try {
      let response;
      if (isOnline) {
        // ONLINE: Fetch from API
        response = await appService.getCustomers();
        if (response.success && response.results) {
           const dbCustomers = response.results.map((c: ICustomer) => ({...c, status: 'synced', id: c.id}));
           await indexedDBService.bulkSaveCustomers(dbCustomers);
        }
      } else {
        // OFFLINE: Fetch from IndexedDB
        response = await indexedDBService.getCustomers(); 
      }

      if (response.success) {
        setCustomers(response.results || []);
      } 
    } catch (error: any) {
      toast.error("An error occurred while fetching customers.");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    modalRef!.close(customer)
  };

  const handleSearch = (value: any) => {
    setSearchTerm(value);
  };

  const handleAddCustomer = () => {
    setOpenAddCustomerModal(true);
  };

  const handleCloseAddCustomerModal = (newCustomer?: Customer) => {
    setOpenAddCustomerModal(false);
    if (newCustomer) fetchCustomers();
  };


  return (
    <>
      {openAddCustomerModal && (
        <AddCustomerModal onClose={handleCloseAddCustomerModal} name={searchTerm}/>
      )}
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="mb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-text">
              Select Customer
            </h2>
            <button
              onClick={()=>modalRef!.close()}
              className="text-text-light transition-colors duration-200"
            >
              {/* Close Icon: ri-close-line */}
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {/* Search Icon: ri-search-line */}
              <i className="ri-search-line h-5 w-5 text-gray-400"></i>
            </div>
            <Input
              type="text"
              placeholder="Search by name, phone, or address..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
        </div>

        {/* Customer List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredCustomers.length > 0 ? (
            <div className="space-y-3">
              {filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  onClick={() => handleCustomerSelect(customer)}
                  className="p-4 border border-border rounded-sm cursor-pointer transition-colors duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-text text-lg">
                        {customer.full_name}
                      </h3>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-2 text-sm text-text-light">
                          {/* Phone Icon: ri-phone-line */}
                          <i className="ri-phone-line w-4 h-4"></i>
                          <span>{customer.phone_number}</span>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-text-light">
                          {/* Map Pin Icon: ri-map-pin-line */}
                          <i className="ri-map-pin-line w-4 h-4 mt-0.5 flex-shrink-0"></i>
                          <span className="flex-1">{customer.address}</span>
                        </div>
                        {customer.email && (
                          <div className="flex items-center gap-2 text-sm text-text-light">
                            {/* Mail Icon: ri-mail-line */}
                            <i className="ri-mail-line w-4 h-4"></i>
                            <span>{customer.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <Button size="sm" variant="outline">
                        Select
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : searchTerm ? (
            // No results found - show add customer option
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 bg-background rounded-full flex items-center justify-center">
                {/* User Search Icon (Placeholder): ri-user-search-line */}
                <i className="ri-user-search-line text-5xl text-gray-400"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No customers found
              </h3>
              <p className="text-text-light mb-6 max-w-sm mx-auto">
                No customers found matching "{searchTerm}". Would you like to add a new customer?
              </p>
              <Button onClick={() => handleAddCustomer()} size="sm">
                {/* Add Icon: ri-add-line */}
                <i className="ri-add-line w-5 h-5 mr-2"></i>
                Add New Customer
              </Button>
            </div>
          ) : (
            // No customers at all
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 bg-background rounded-full flex items-center justify-center">
                {/* User Add Icon (Placeholder): ri-user-add-line */}
                <i className="ri-user-add-line text-5xl text-gray-400"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No customers available
              </h3>
              <p className="text-text-light mb-6">
                Get started by adding your first customer.
              </p>
              <Button onClick={handleAddCustomer}>
                {/* Add Icon: ri-add-line */}
                <i className="ri-add-line w-5 h-5 mr-2"></i>
                Add First Customer
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-border">
          <div className="flex justify-between items-center">
            <span className="text-sm text-text-light">
              {filteredCustomers.length} {filteredCustomers.length === 1 ? 'customer' : 'customers'} found
            </span>
            <Button variant="ghost" onClick={()=>modalRef!.close()}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default CustomerModal;
