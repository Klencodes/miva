import { useMemo, useState, useEffect } from 'react';
import { useModal } from "../../../core/hooks/useModal";
import { Button, Input } from "../../../ui";
import { useToast } from "../../../core/hooks/useToast";
import { countries } from '../auth/countries';
import { appService } from '../../../core/services/app';

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  phone_code: string;
  gender: string;
  role?: string;
}

const AddEditStaff = () => {
  const { modalRef, modalData } = useModal();
  const { show } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const isAdd = modalData === null || modalData === undefined;

  // Initialize form data with proper structure
  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    phone_code: '+233', 
    gender: '',
    role: ''
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when modalData changes
  useEffect(() => {
    if (modalData && modalData?.user) {
      setFormData({
        first_name: modalData.user.first_name || '',
        last_name: modalData.user.last_name || '',
        email: modalData.user.email || '',
        phone_number: modalData.user.phone_number || '',
        phone_code: modalData.user.phone_code || '+233',
        gender: modalData.user.gender || '',
        role: modalData?.role || ''
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    validateField(field, formData[field as keyof FormData]);
  };

  const validateField = (field: string, value?: string) => {
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
    
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }
    
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    
    if (!formData.phone_code) {
      newErrors.phone_code = 'Phone code is required';
    }
    
    if (!formData.phone_number.trim()) {
      newErrors.phone_number = 'Phone number is required';
    } else if (!/^\d+$/.test(formData.phone_number.replace(/\s/g, ''))) {
      newErrors.phone_number = 'Phone number must contain only digits';
    }
    
    setErrors(newErrors);
    setTouched({
      first_name: true,
      last_name: true,
      email: true,
      role: true,
      phone_code: true,
      phone_number: true,
      gender: true
    });
    
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      show("Validation Error", "Please fix the errors in the form.", 'error');
      return;
    }

    setIsLoading(true);
    try {
      const submitData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        phone_number: formData.phone_number.trim(),
        phone_code: formData.phone_code,
        gender: formData.gender,
        role: formData.role ,
        id: modalData?.user?.id, 
      };

      let response;
      if (isAdd) {
        response = await appService.addNewUser(submitData);
      } else {
        response = await appService.updateUser(submitData);
      }


      if (response.success) {
        show( "Success",  isAdd ? "User created successfully!" : "User updated successfully!", 'success');
        modalRef!.close({ success: true });
      } else {
        throw new Error(response.message || 'Operation failed');
      }
    } catch (error: any) {
      console.error("Error saving user:", error);
      show("Error", error.message || "Failed to save user details.", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const phoneCodes = useMemo(() => 
    countries.map((country: { flag: string; code: string; phone_code: string }) => ({
      label: `${country.flag} ${country.code} | ${country.phone_code}`,
      value: country.phone_code
    })), []);

  const roleOptions = useMemo(() => [
    { value: 'admin', label: 'Administrator' },
    { value: 'manager', label: 'Manager' },
    { value: 'operator', label: 'Operator' },
    { value: 'finance', label: 'Finance' },
  ], []);

  return (
    <div className="flex flex-col h-[80vh] w-full mx-auto p-3">
      {/* Header */}
      <div className="flex flex-row justify-between items-start mb-6 border-b border-border pb-4 sticky top-0 z-10">
        <div className="flex flex-col">
          <h2 className="text-2xl text-text font-bold">
            {isAdd ? 'Add New User' : 'Edit User Details'}
          </h2>
          <h4 className="text-md text-text-light mt-1">
            {isAdd 
              ? 'Create a new user account in the system' 
              : `Update details for ${modalData?.user?.first_name} ${modalData?.user?.last_name}`
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

      {/* Form Guidance */}
      <div className="bg-primary-5 border border-primary-20 rounded-sm p-4 mb-6">
        <div className="flex items-start">
          <i className="ri-user-add-line text-primary text-lg mr-3 mt-0.5"></i>
          <div>
            <p className="font-medium text-primary mb-1">
              {isAdd ? 'Creating New User' : 'Updating User Information'}
            </p>
            <ul className="text-sm text-primary list-disc list-inside space-y-1">
              <li>Fill in all required personal information</li>
              <li>Set appropriate Role and permissions</li>
              <li>Verify contact information for communication</li>
              {isAdd && <li>User will receive activation instructions via email</li>}
            </ul>
          </div>
        </div>
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
          </div>
        </div>

        {/* Form Validation & Requirements */}
        <div className="bg-info-5 border border-info-20 rounded-sm p-4">
          <div className="flex items-start">
            <i className="ri-information-line text-info text-lg mr-3 mt-0.5"></i>
            <div>
              <p className="font-medium text-info mb-1">Form Requirements</p>
              <ul className="text-sm text-info list-disc list-inside space-y-1">
                <li>Fields marked with * are required</li>
                <li>Email address must be unique and valid</li>
                <li>Role determines system permissions</li>
                <li>Phone number should contain only digits</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center pt-4 h-14 border-t border-border mt-auto">
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

export default AddEditStaff;