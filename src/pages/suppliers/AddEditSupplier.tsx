import { useMemo, useState, useEffect } from 'react';
import { useModal } from "../../core/hooks/useModal";
import { Button, Input } from "../../components/common";
import { countries } from '../auth/countries';
import { toast } from 'sonner';
import { 
  X, 
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  Globe,
  Save,
  Users
} from 'lucide-react';
// import { authService } from '../../core/services/auth';

// Define the Supplier interface
interface Supplier {
  id?: string;
  name: string;
  address: string;
  email: string;
  phone_number: string;
  secondary_number: string;
  phone_code: string;
  secondary_code: string;
}

// FormData matches Supplier but with all fields required for the form
interface FormData {
  name: string;
  address: string;
  email: string;
  phone_number: string;
  secondary_number: string;
  phone_code: string;
  secondary_code: string;
}

// Define modal data type
interface ModalData {
  id?: string;
  name?: string;
  address?: string;
  email?: string;
  phone_number?: string;
  secondary_number?: string;
  phone_code?: string;
  secondary_code?: string;
}

// Type for country from countries array
interface Country {
  flag: string;
  code: string;
  phone_code: string;
}

const AddEditSupplier = () => {
  const { modalRef, modalData } = useModal();
  const [isLoading, setIsLoading] = useState(false);
        const data = modalData?.supplier as ModalData;
        console.log(modalData)

  // Safely check if we're in add mode
  const isAdd = !modalData || !('id' in modalData) || !modalData.id;

  // Initialize form data with proper structure
  const [formData, setFormData] = useState<FormData>({
    name: '',
    address: '',
    email: '',
    phone_number: '',
    phone_code: '+233',    
    secondary_number: '',
    secondary_code: '+233', 
  });

  const [touched, setTouched] = useState<Record<keyof FormData, boolean>>({
    name: false,
    address: false,
    email: false,
    phone_number: false,
    secondary_number: false,
    phone_code: false,
    secondary_code: false,
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  // Initialize form data when modalData changes
  useEffect(() => {
    if (modalData && !isAdd) {
      
      setFormData({
        name: data.name || '',
        address: data.address || '',
        email: data.email || '',
        phone_number: data.phone_number || '',
        secondary_number: data.secondary_number || '',
        phone_code: data.phone_code || '+233',
        secondary_code: data.secondary_code || '+233',
      });
    } else {
      // Reset form for add mode
      setFormData({
        name: '',
        address: '',
        email: '',
        phone_number: '',
        phone_code: '+233',
        secondary_number: '',
        secondary_code: '+233',
      });
      // Reset touched and errors
      setTouched({
        name: false,
        address: false,
        email: false,
        phone_number: false,
        secondary_number: false,
        phone_code: false,
        secondary_code: false,
      });
      setErrors({});
    }
  }, [modalData, isAdd]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleBlur = (field: keyof FormData) => {
    setTouched(prev => ({
      ...prev,
      [field]: true
    }));

    validateField(field);
  };

  const validateField = (field: keyof FormData) => {
    const value = formData[field];
    const newErrors = { ...errors };

    switch (field) {
      case 'name':
        if (!value.trim()) {
          newErrors.name = 'Company name is required';
        } else {
          delete newErrors.name;
        }
        break;
      
      case 'address':
        if (!value.trim()) {
          newErrors.address = 'Company address is required';
        } else {
          delete newErrors.address;
        }
        break;
      
      case 'email':
        if (!value.trim()) {
          newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(value)) {
          newErrors.email = 'Email is invalid';
        } else {
          delete newErrors.email;
        }
        break;     
      
      case 'phone_code':
        if (!value) {
          newErrors.phone_code = 'Phone code is required';
        } else {
          delete newErrors.phone_code;
        }
        break;
      
      case 'phone_number':
        if (!value.trim()) {
          newErrors.phone_number = 'Phone number is required';
        } else if (!/^\d+$/.test(value.replace(/\s/g, ''))) {
          newErrors.phone_number = 'Phone number must contain only digits';
        } else {
          delete newErrors.phone_number;
        }
        break;
      
      case 'secondary_code':
        if (!value) {
          newErrors.secondary_code = 'Secondary phone code is required';
        } else {
          delete newErrors.secondary_code;
        }
        break;
      
      case 'secondary_number':
        if (value.trim() && !/^\d+$/.test(value.replace(/\s/g, ''))) {
          newErrors.secondary_number = 'Secondary phone number must contain only digits';
        } else {
          delete newErrors.secondary_number;
        }
        break;
    
      default:
        break;
    }

    setErrors(newErrors);
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    
    // Validate all required fields
    if (!formData.name.trim()) newErrors.name = 'Company name is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.phone_code) newErrors.phone_code = 'Phone code is required';
    
    if (!formData.phone_number.trim()) {
      newErrors.phone_number = 'Phone number is required';
    } else if (!/^\d+$/.test(formData.phone_number.replace(/\s/g, ''))) {
      newErrors.phone_number = 'Phone number must contain only digits';
    }

    // Validate secondary phone if provided
    if (formData.secondary_number.trim() && 
        !/^\d+$/.test(formData.secondary_number.replace(/\s/g, ''))) {
      newErrors.secondary_number = 'Secondary phone number must contain only digits';
    }

    if (!formData.secondary_code) {
      newErrors.secondary_code = 'Secondary phone code is required';
    }

    setErrors(newErrors);
    setTouched({
      name: true,
      address: true,
      email: true,
      phone_code: true,
      phone_number: true,
      secondary_code: true,
      secondary_number: true,
    });
    
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Validation Error", {
        description: "Please fix the errors in the form."
      });
      return;
    }

    setIsLoading(true);
    try {
      const submitData: Partial<Supplier> = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        email: formData.email.trim(),
        phone_number: formData.phone_number.trim(),
        phone_code: formData.phone_code,
        secondary_number: formData.secondary_number.trim(),
        secondary_code: formData.secondary_code,
      };

      if (modalData && 'id' in modalData && modalData.id) {
        submitData.id = modalData.id;
      }

      // TODO: Uncomment when API service is ready
      // let response;
      // if (isAdd) {
      //   response = await authService.addNewSupplier(submitData);
      // } else {
      //   response = await authService.updateSupplier(submitData);
      // }

      // if (response.success) {
      //   toast.success("Success", {
      //     description: isAdd ? "Supplier created successfully!" : "Supplier updated successfully!"
      //   });
      //   modalRef?.close({ success: true });
      // } else {
      //   throw new Error(response.message || 'Operation failed');
      // }

      // Temporary success for demo
      toast.success("Success", {
        description: isAdd ? "Supplier created successfully!" : "Supplier updated successfully!"
      });
      modalRef?.close({ success: true });

    } catch (error: any) {
      const errorMessage = error.message || 
                          error.response?.data?.message || 
                          "Failed to save supplier details.";
      toast.error("Error", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const phoneCodes = useMemo(() => 
    countries.map((country: Country) => ({
      label: `${country.flag} ${country.code} | ${country.phone_code}`,
      value: country.phone_code
    })),
    []
  );

  return (
    <div className="flex flex-col h-full w-full mx-auto px-2">
      {/* Header */}
      <div className="flex flex-row justify-between items-start mb-6 border-b border-border pb-4 sticky top-0 z-10 bg-card">
        <div className="flex flex-col">
          <h2 className="text-2xl text-text font-bold">
            {isAdd ? 'Add New Supplier' : 'Edit Supplier Details'}
          </h2>
          <h4 className="text-md text-text-light mt-1">
            {isAdd 
              ? 'Create a new supplier in the system' 
              : `Update details for ${modalData && 'name' in modalData ? modalData.name : 'Supplier'}`
            }
          </h4>
        </div>
        <button
          onClick={() => modalRef?.dismiss()}
          className="w-8 h-8 rounded-full text-text-light hover:bg-background-50 transition-colors flex items-center justify-center"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pb-4">
        {/* Company Information Section */}
        <div className="border border-border rounded-sm p-4">
          <div className="flex items-center mb-4">
            <Building className="w-5 h-5 text-primary mr-2" />
            <h3 className="font-semibold text-text">Company Information</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Company Name"
              value={formData.name}
              onChange={(value: string) => handleInputChange("name", value)}
              onBlur={() => handleBlur("name")}
              error={touched.name ? errors.name || "" : ""}
              placeholder="Enter company name"
              required={true}
              prefixIcon={<Building className="w-4 h-4" />}
            />
            
            <Input
              label="Physical Address"
              value={formData.address}
              onChange={(value: string) => handleInputChange("address", value)}
              onBlur={() => handleBlur("address")}
              error={touched.address ? errors.address || "" : ""}
              placeholder="Enter address"
              required={true}
              prefixIcon={<MapPin className="w-4 h-4" />}
            />
          </div>
        </div>

        {/* Contact Information */}
        <div className="border border-border rounded-sm p-4">
          <div className="flex items-center mb-4">
            <Users className="w-5 h-5 text-primary mr-2" />
            <h3 className="font-semibold text-text">Contact Information</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(value: string) => handleInputChange("email", value)}
              onBlur={() => handleBlur("email")}
              error={touched.email ? errors.email || "" : ""}
              placeholder="Email Address"
              required={true}
              prefixIcon={<Mail className="w-4 h-4" />}
            />

            <div className="flex w-full gap-2">
              <div className="w-32">
                <Input
                  label="Code"
                  type="select"
                  value={formData.phone_code}
                  onChange={(value) => handleInputChange('phone_code', value as string)}
                  selectOptions={phoneCodes}
                  error={touched.phone_code ? errors.phone_code || "" : ""}
                  required={true}
                />
              </div>
              <div className="flex-1"> 
                <Input
                  label="Phone Number"
                  type="tel"
                  value={formData.phone_number}
                  onChange={(value) => handleInputChange('phone_number', value)}
                  onBlur={() => handleBlur('phone_number')}
                  error={touched.phone_number ? errors.phone_number || "" : ""}
                  placeholder="987654321"
                  required={true}
                />
              </div>
            </div>

            <div className="flex w-full gap-2">
              <div className="w-32">
                <Input
                  label="Code"
                  type="select"
                  value={formData.secondary_code}
                  onChange={(value) => handleInputChange('secondary_code', value as string)}
                  selectOptions={phoneCodes}
                  error={touched.secondary_code ? errors.secondary_code || "" : ""}
                  required={true}
                />
              </div>
              <div className="flex-1"> 
                <Input
                  label="Secondary Phone Number"
                  type="tel"
                  value={formData.secondary_number}
                  onChange={(value) => handleInputChange('secondary_number', value)}
                  onBlur={() => handleBlur('secondary_number')}
                  error={touched.secondary_number ? errors.secondary_number || "" : ""}
                  placeholder="987654321"
                  prefixIcon={<Phone className="w-4 h-4" />}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex gap-x-3 justify-end items-center pt-4 h-14 border-t border-border mt-auto sticky bottom-0 z-10 bg-card">
        <Button
          onClick={() => modalRef?.dismiss()}
          disabled={isLoading}
          variant="ghost"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          variant="primary"
          loading={isLoading}
          className="flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {isAdd ? 'Create Supplier' : 'Update Supplier'}
        </Button>
      </div>
    </div>
  );
};

export default AddEditSupplier;