import { useMemo, useState, useEffect } from 'react';
import { useModal } from "../../../core/hooks/useModal";
import { Button, Input } from "../../../ui";
import { countries } from '../auth/countries';
import { appService } from '../../../core/services/app';
import { toast } from 'sonner';

// 1. Updated FormData to include password
interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  phone_code: string;
  gender: string;
  role: string;
  password?: string; // Required for Add, optional for Edit
}


const AddUserModal = () => {
  const { modalRef, modalData } = useModal();
  const [isLoading, setIsLoading] = useState(false);
  const isAdd = modalData === null || modalData === undefined || !modalData.id; // Check for modalData.id to determine edit mode

  // Initialize form data with proper structure
  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    phone_code: '+233', 
    gender: '',
    role: '',
    password: isAdd ? '' : undefined, 
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when modalData changes
  useEffect(() => {
    if (modalData) {
      // Use the structure of modalData (can be flat or nested under 'user')
      const data = modalData.user || modalData;
      
      setFormData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        phone_number: data.phone_number || '',
        phone_code: data.phone_code || '+233',
        gender: data.gender || '',
        role: data.role || '',
        password: isAdd ? '' : undefined, 
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
      case 'first_name':
        if (!val.trim()) {
          newErrors.first_name = 'First name is required';
        } else {
          delete newErrors.first_name;
        }
        break;
      
      case 'last_name':
        if (!val.trim()) {
          newErrors.last_name = 'Last name is required';
        } else {
          delete newErrors.last_name;
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

      // 2. Added Password Validation (only required for Add mode)
      case 'password':
        if (isAdd && !val) {
            newErrors.password = 'Password is required';
        } else if (isAdd && val && val.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        } else {
            delete newErrors.password;
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
      
      case 'role':
        if (!val) {
            newErrors.role = 'Role is required';
        } else {
            delete newErrors.role;
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const fieldsToValidate: (keyof FormData)[] = ['first_name', 'last_name', 'email', 'phone_code', 'phone_number', 'role', 'gender'];

    if (isAdd) {
        fieldsToValidate.push('password'); // Password is required on add
    }
    
    fieldsToValidate.forEach(field => {
        validateField(field, formData[field]);
        // Re-run validation logic to correctly populate newErrors synchronously
        // A simpler way: manually check key fields that affect submission
    });

    // Synchronous validation check for required fields:
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.phone_code) newErrors.phone_code = 'Phone code is required';
    if (!formData.phone_number.trim()) newErrors.phone_number = 'Phone number is required';
    else if (!/^\d+$/.test(formData.phone_number.replace(/\s/g, ''))) newErrors.phone_number = 'Phone number must contain only digits';
    if (!formData.role) newErrors.role = 'Role is required';

    if (isAdd) {
        if (!formData.password) newErrors.password = 'Password is required';
        else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    setTouched({
      first_name: true,
      last_name: true,
      email: true,
      role: true,
      phone_code: true,
      phone_number: true,
      gender: true,
      password: isAdd ? true : false,
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
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        phone_number: formData.phone_number.trim(),
        phone_code: formData.phone_code,
        gender: formData.gender,
        role: formData.role,
        // 3. Add password only if adding
        ...(isAdd && formData.password ? { password: formData.password } : {}), 
        // Pass ID for update mode
        ...(modalData?.id ? { id: userId } : {}),
      };

      let response;
      if (isAdd) {
        // Ensure required fields for add are present
        if (!submitData.password) {
            throw new Error("Missing password for new user.");
        }
        response = await appService.addNewUser(submitData);
      } else {
        console.log(submitData, "submitData")
        response = await appService.updateUser(submitData);
      }


      if (response.success) {
        toast.success( "Success",  {description: isAdd ? "User created successfully!" : "User updated successfully!",});
        modalRef!.close({ success: true });
      } else {
        // Use response.data.message if available from the server
        throw new Error(response.message || response.data?.message || 'Operation failed');
      }
    } catch (error: any) {
      // Accessing error.response.data.message for Axios/API error structure
      const errorMessage = error.message || error.response?.data?.message || "Failed to save user details.";
      toast.error("Error", {description: errorMessage,});
    } finally {
      setIsLoading(false);
    }
  };

  const phoneCodes = useMemo(() => 
    countries.map((country: { flag: string; code: string; phone_code: string }) => ({
      label: `${country.flag} ${country.code} | ${country.phone_code}`,
      value: country.phone_code
    })), [countries]);

  const roleOptions = useMemo(() => [
    { value: 'admin', label: 'Administrator' },
    { value: 'manager', label: 'Manager' },
    { value: 'operator', label: 'Operator' },
    { value: 'finance', label: 'Finance' },
  ], []);

  // Determine the ID field for the header title (might be nested or flat)
  const userId = modalData?.id || modalData?.user?.id;

  return (
    <div className="flex flex-col h-full w-full mx-auto px-2">
      {/* Header */}
      <div className="flex flex-row justify-between items-start mb-6 border-b border-border pb-4 sticky top-0 z-10 bg-card"> {/* Added bg-card */}
        <div className="flex flex-col">
          <h2 className="text-2xl text-text font-bold">
            {isAdd ? 'Add New User' : 'Edit User Details'}
          </h2>
          <h4 className="text-md text-text-light mt-1">
            {isAdd 
              ? 'Create a new user account in the system' 
              : `Update details for ${modalData?.user?.first_name || modalData?.first_name} ${modalData?.user?.last_name || modalData?.last_name}`
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
            <h3 className="font-semibold text-text">Personal Information</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              type="text"
              value={formData.first_name}
              onChange={(value: string) => handleInputChange("first_name", value)}
              onBlur={() => handleBlur("first_name")}
              error={touched.first_name ? errors.first_name : ""}
              placeholder="Enter first name"
              required={true}
            />
            
            <Input
              label="Last Name"
              type="text"
              value={formData.last_name}
              onChange={(value: string) => handleInputChange("last_name", value)}
              onBlur={() => handleBlur("last_name")}
              error={touched.last_name ? errors.last_name : ""}
              placeholder="Enter last name"
              required={true}
            />

            <div className="col-span-2">
              <Input
                label="Select Gender"
                type="select"
                value={formData.gender}
                onChange={(value) => handleInputChange("gender", value)}
                selectOptions={[
                  { value: '', label: 'Select Gender' },
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'other', label: 'Other' },
                ]}
                onBlur={() => handleBlur('gender')}
                error={touched.gender ? errors.gender : ""}
                required={false}
              />
            </div>
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
              placeholder="Enter email address"
              required={true}
              // Prevent changing email in edit mode (often handled separately/restricted)
              disabled={!isAdd} 
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
          </div>
        </div>

        {/* Account Settings */}
        <div className="border border-border rounded-sm p-4">
          <div className="flex items-center mb-4">
            <i className="ri-settings-line text-primary text-lg mr-2"></i>
            <h3 className="font-semibold text-text">Account Settings</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <Input
              label="Select Role"
              type="select"
              value={formData.role}
              onChange={(value) => handleInputChange("role", value)}
              selectOptions={[
                { value: '', label: 'Select Role' },
                ...roleOptions
              ]}
              onBlur={() => handleBlur('role')}
              error={touched.role ? errors.role : ""}
              required={true}
            />
            
            {!isAdd && (
                <p className="text-sm text-text-light italic">
                    When updating, password is not require.
                </p>
            )}
            <Input
                    label="Password"
                    type="password"
                    value={formData.password}
                    onChange={(value: string) => handleInputChange("password", value)}
                    onBlur={() => handleBlur("password")}
                    error={touched.password ? errors.password : ""}
                    placeholder="Enter password (min 6 chars)"
                    required={isAdd}
                />
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
          {isAdd ? 'Create User' : 'Update User'}
        </Button>
      </div>
    </div>
  );
};

export default AddUserModal;