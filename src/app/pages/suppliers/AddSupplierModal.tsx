import { useMemo, useState, useEffect } from 'react';
import { useModal } from "../../../core/hooks/useModal";
import { Button, Input } from "../../../ui";
import { countries } from '../auth/countries';
import { toast } from 'sonner';
import { authService } from '../../../core/services/auth';

// 1. Updated FormData to include password
interface FormData {
  name: string;
  address: string;
  email: string;
  phone_number: string;
  secondary_number: string;
  phone_code: string;
  secondary_code: string;
}


const AddSupplierModal = () => {
  const { modalRef, modalData } = useModal();
  const [isLoading, setIsLoading] = useState(false);
  const isAdd = modalData === null || modalData === undefined || !modalData.id; // Check for modalData.id to determine edit mode

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

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when modalData changes
  useEffect(() => {
    if (modalData) {
      // Use the structure of modalData (can be flat or nested under 'Supplier')
      const data = modalData;
      
      setFormData({
        name: data.name || '',
        address: data.address || '',
        email: data.email || '',
        phone_number: data.phone_number || '',
        secondary_number: data.secondary_number || '',
        phone_code: data.phone_code || '+233',
        secondary_code: data.secondary_code || '+233',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalData, isAdd]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({
      ...prev,
      [field]: true
    }));

    // Cast to keyof FormData for type safety
    validateField(field as keyof FormData, formData[field as keyof FormData]);
  };

  const validateField = (field: keyof FormData, value?: string) => {
    const newErrors = { ...errors };
    const val = value ?? '';

    switch (field) {
      case 'name':
        if (!val.trim()) {
          newErrors.name = 'Company name is required';
        } else {
          delete newErrors.name;
        }
        break;
      
      case 'address':
        if (!val.trim()) {
          newErrors.address = 'Company address is required';
        } else {
          delete newErrors.address;
        }
        break;
      
      case 'email':
        if (!val.trim()) {
          newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(val)) {
          newErrors.email = 'Email is invalid';
        } else {
          delete newErrors.email;
        }
        break;     
      
      case 'phone_code':
        if (!val) {
          newErrors.phone_code = 'Phone code is required';
        } else {
          delete newErrors.phone_code;
        }
        break;
      
      case 'phone_number':
        if (!val.trim()) {
          newErrors.phone_number = 'Phone number is required';
        } else if (!/^\d+$/.test(val.replace(/\s/g, ''))) {
          newErrors.phone_number = 'Phone number must contain only digits';
        } else {
          delete newErrors.phone_number;
        }
        break;
    
      default:
        break;
    }

    setErrors(newErrors);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const fieldsToValidate: (keyof FormData)[] = ['name', 'address', 'email', 'phone_code', 'phone_number',];
    
    fieldsToValidate.forEach(field => {
        validateField(field, formData[field]);
        // Re-run validation logic to correctly populate newErrors synchronously
        // A simpler way: manually check key fields that affect submission
    });

    // Synchronous validation check for required fields:
    if (!formData.name.trim()) newErrors.name = 'Company name is required';
    if (!formData.address.trim()) newErrors.addres = 'Address is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.phone_code) newErrors.phone_code = 'Phone code is required';
    if (!formData.phone_number.trim()) newErrors.phone_number = 'Phone number is required';
    else if (!/^\d+$/.test(formData.phone_number.replace(/\s/g, ''))) newErrors.phone_number = 'Phone number must contain only digits';

   
    setErrors(newErrors);
    setTouched({
      name: true,
      address: true,
      email: true,
      phone_code: true,
      phone_number: true,
    });
    
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Validation Error", {description: "Please fix the errors in the form."});
      return;
    }

    setIsLoading(true);
    try {
      const submitData: Partial<FormData & { id: string }> = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        email: formData.email.trim(),
        phone_number: formData.phone_number.trim(),
        phone_code: formData.phone_code,
        secondary_number: formData.secondary_number.trim(),
        secondary_code: formData.secondary_code,
        ...(modalData?.id ? { id: supplierId } : {}),
      };

      let response;
      if (isAdd) {
        response = await authService.addNewSupplier(submitData);
      } else {
        response = await authService.updateSupplier(submitData);
      }


      if (response.success) {
        toast.success( "Success",  {description: isAdd ? "Supplier created successfully!" : "Supplier updated successfully!",});
        modalRef!.close({ success: true });
      } else {
        // Use response.data.message if available from the server
        throw new Error(response.message || 'Operation failed');
      }
    } catch (error: any) {
      const errorMessage = error.message || error.response?.data?.message || "Failed to save supplier details.";
      toast.error("Error", {description: errorMessage,});
    } finally {
      setIsLoading(false);
    }
  };

  const phoneCodes = useMemo(() => 
    countries.map((country: { flag: string; code: string; phone_code: string }) => ({
      label: `${country.flag} ${country.code} | ${country.phone_code}`,
      value: country.phone_code
    })
    //eslint-disable-next-line
  ), [countries]);

  // Determine the ID field for the header title (might be nested or flat)
  const supplierId = modalData?.id;

  return (
    <div className="flex flex-col h-full w-full mx-auto px-2">
      {/* Header */}
      <div className="flex flex-row justify-between items-start mb-6 border-b border-border pb-4 sticky top-0 z-10 bg-card"> {/* Added bg-card */}
        <div className="flex flex-col">
          <h2 className="text-2xl text-text font-bold">
            {isAdd ? 'Add New Supplier' : 'Edit Supplier Details'}
          </h2>
          <h4 className="text-md text-text-light mt-1">
            {isAdd 
              ? 'Create a new supplier in the system' 
              : `Update details for ${modalData?.name}`
            }
          </h4>
        </div>
        <button
          onClick={() => modalRef!.dismiss()}
          className="w-8 h-8 rounded-full text-text-light hover:bg-background-50 transition-colors flex items-center justify-center"
          aria-label="Close modal"
        >
          <i className="ri-close-line text-xl"></i>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pb-4">
        {/* Personal Information Section */}
        <div className="border border-border rounded-sm p-4">
          <div className="flex items-center mb-4">
            <i className="ri-profile-line text-primary text-lg mr-2"></i>
            <h3 className="font-semibold text-text">Company Information</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Company Name"
              value={formData.name}
              onChange={(value: string) => handleInputChange("name", value)}
              onBlur={() => handleBlur("name")}
              error={touched.name ? errors.name : ""}
              placeholder="Enter company name"
              required={true}
            />
            
           
          <Input
              label="Physical Address"
              value={formData.address}
              onChange={(value: string) => handleInputChange("address", value)}
              onBlur={() => handleBlur("address")}
              error={touched.address ? errors.address : ""}
              placeholder="Enter address"
              required={true}
            />

          </div>
        </div>

        {/* Contact Information */}
        <div className="border border-border rounded-sm p-4">
          <div className="flex items-center mb-4">
            <i className="ri-contacts-line text-primary text-lg mr-2"></i>
            <h3 className="font-semibold text-text">Contact Information</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(value: string) => handleInputChange("email", value)}
              onBlur={() => handleBlur("email")}
              error={touched.email ? errors.email : ""}
              placeholder="Email Address"
              required={true}
            />

            <div className="flex w-full gap-2">
              <div className="w-32">
                <Input
                  label="Code"
                  type="select"
                  value={formData.phone_code}
                  onChange={(value) => handleInputChange('phone_code', value)}
                  selectOptions={phoneCodes}
                  error={touched.phone_code ? errors.phone_code : ""}
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
                  error={touched.phone_number ? errors.phone_number : ""}
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
                  onChange={(value) => handleInputChange('secondary_code', value)}
                  selectOptions={phoneCodes}
                  error={touched.secondary_code ? errors.secondary_code : ""}
                  required={true}
                />
              </div>
              <div className="flex-1"> 
                <Input
                  label="Secondary Phone Number"
                  type="tel"
                  value={formData.secondary_number}
                  onChange={(value) => handleInputChange('secondary_number', value)}
                  onBlur={() => handleBlur('phone_number')}
                  error={touched.secondary_number ? errors.secondary_number : ""}
                  placeholder="987654321"
                  required={true}
                />
              </div>
            </div>
          </div>
        </div>
      
      </div>

      {/* Footer */}
      <div className="flex gap-x-3 justify-end items-center pt-4 h-14 border-t border-border mt-auto sticky bottom-0 z-10 bg-card">
        <Button
          onClick={() => modalRef!.dismiss()}
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
        >
          {isAdd ? 'Create Supplier' : 'Update Supplier'}
        </Button>
      </div>
    </div>
  );
};

export default AddSupplierModal;