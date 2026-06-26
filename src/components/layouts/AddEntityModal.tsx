import React, { useState, useCallback, useEffect } from "react";
import { useModal } from "../../core/hooks/useModal";
import { Button, Input } from "../common";
import { toast } from "sonner";
import EntityService from "../../core/services/entity"
import { useStore } from "../../core/contexts/StoreProvider";
interface OrganisationProfileForm {
  name: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zip_code: string;
  registration_number: string;
  tax_id: string;
  branch: string;
}

interface AddEntityModalProps {
  data?: any; // Add props to receive edit data
}

const initialFormState: OrganisationProfileForm = {
  name: "",
  email: "",
  phone: "",
  website: "",
  address: "",
  city: "",
  state: "",
  country: "",
  zip_code: "",
  registration_number: "",
  tax_id: "",
  branch: "",
};

const URL_PATTERN = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i;
const PHONE_PATTERN = /^[0-9]+$/;
const ZIP_PATTERN = /^[0-9]{5,10}$/;

const AddEntityModal: React.FC<AddEntityModalProps> = () => { 
  const { modalRef, modalData } = useModal(); 

  const [form, setForm] = useState<OrganisationProfileForm>(initialFormState);
  const [errors, setErrors] = useState<Partial<OrganisationProfileForm>>({});
  const [loading, setLoading] = useState(false);
  const supportedCountries =[{value: "", label: "Choose Country"}, {value: "Ghana", label: "Ghana"}, {value: "Nigeria", label: "Nigeria"}];
  const { entity } = useStore();
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);

  // Initialize form with edit data if provided
  useEffect(() => {
    if(entity){
      setForm({
        email: "",
        phone: "",
        website: "",
        address: "",
        city: "",
        state: "",
        branch: "",
        name: entity.name || "",
        country: entity.country || "",
        zip_code: entity.zip_code || "",
        registration_number: entity.registration_number || "",
        tax_id: entity.tax_id || "",
      });
    }
    if (modalData) {
      setIsEditMode(true);
      setForm({
        name: modalData.name || "",
        email: modalData.email || "",
        phone: modalData.phone || "",
        website: modalData.website || "",
        address: modalData.address || "",
        city: modalData.city || "",
        state: modalData.state || "",
        country: modalData.country || "",
        zip_code: modalData.zip_code || "",
        registration_number: modalData.registration_number || "",
        tax_id: modalData.tax_id || "",
        branch: modalData.branch || "",
      });
    }
    // eslint-disable-next-line
  }, []);

  const validate = useCallback(
    (data: OrganisationProfileForm): Partial<OrganisationProfileForm> => {
      const newErrors: Partial<OrganisationProfileForm> = {};
      
      if (!data.name) newErrors.name = "Business Name is required.";
      if (!data.branch) newErrors.branch = "Business branch is required.";
      if (!data.country) newErrors.country = "Country is required.";
      if (!data.city) newErrors.city = "City is required.";
      if (!data.state) newErrors.state = "State is required.";
      if (!data.address) newErrors.address = "Business Address is required.";
      if (!data.zip_code) {
        newErrors.zip_code = "ZIP Code is required.";
      } else if (!ZIP_PATTERN.test(data.zip_code)) {
        newErrors.zip_code = "Invalid ZIP code format (5-10 digits).";
      }
      
      if (!data.email) {
        newErrors.email = "Contact Email is required.";
      } else if (!/^\S+@\S+$/i.test(data.email)) {
        newErrors.email = "Invalid email format.";
      }
      
      if (!data.phone) {
        newErrors.phone = "Phone Number is required.";
      } else if (!PHONE_PATTERN.test(data.phone)) {
        newErrors.phone = "Only digits are allowed.";
      }
      
      if (data.website && !URL_PATTERN.test(data.website)) {
        newErrors.website = "Invalid URL format.";
      }
      
      // Optional validations for registration and tax ID
      if (data.registration_number && data.registration_number.length < 3) {
        newErrors.registration_number = "Registration number is too short.";
      }
      
      if (data.tax_id && data.tax_id.length < 3) {
        newErrors.tax_id = "Tax ID is too short.";
      }
      
      return newErrors;
    },
    []
  );

  useEffect(() => {
    const getCountries = async () => {
      // try {
      //   const res = await appService.getSupportedCountries();
      //   if (res.success) {
      //       const formattedCountries = [{ value: "", label: "Select Country" }, ...res.results.map((country: SelectOption) => ({
      //       value: country.value,
      //       label: country.label,
      //     }))];
      //     setSupportedCountries(formattedCountries);
      //   }
      // } catch (error) {
      //   console.error("Failed to fetch countries:", error);
      // }
    };

    getCountries();
  }, []);

  const handleChange = (name: keyof OrganisationProfileForm) => (value: any) => {
    setForm(prev => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const handleBlur = (field: keyof OrganisationProfileForm) => {
    setErrors(validate(form));
  };

  const saveBusinessProfile = async (businessData: any): Promise<void> => {
    try {
      let response: any;
      
      if (isEditMode && modalData?.id) {
        // Update existing entity
        response = await EntityService.update(modalData?.uuid, businessData );
      } else {
        // Create new entity
        response = await EntityService.create(businessData);
      }
      
      if (!response.success) {
        throw new Error(response.message || `Failed to ${isEditMode ? 'update' : 'create'} business profile.`);
      }
      
      toast.success(
        "Success", 
        {description: response.message || `Business profile ${isEditMode ? 'updated' : 'created'} successfully!`}
      );
      
      // Close the modal upon success
      modalRef!.close({ success: true }); 
    } catch (error: any) {
      toast.error(
        "Error", 
        {description: error.message || `Failed to ${isEditMode ? 'update' : 'create'} business profile.`}
      );
      throw error;
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors = validate(form);
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error("Validation Error", { description:"Please correct the highlighted fields."});
      return;
    }

    setLoading(true);

    try {
      await saveBusinessProfile(form);
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = Object.keys(validate(form)).length === 0;

  return (
    <div className="flex flex-col h-full w-full mx-auto px-2">
      {/* Header (Modal Style) */}
      <div className="flex flex-row justify-between items-start mb-6 border-b border-border p-4 sticky top-0 z-10 bg-card">
        <div className="flex flex-col">
          <h2 className="text-2xl text-text font-bold">
            {isEditMode ? 'Edit Entity' : 'Add New Entity'}
          </h2>
          <h4 className="text-md text-text-light mt-1">
            {isEditMode 
              ? 'Update your business entity information.' 
              : 'This will add new business entity to existing ones.'
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

      {/* Scrollable Form Body */}
      <div className="flex-1 overflow-y-auto space-y-6 pb-4">
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Column 1: Core Details */}
            <div className="space-y-4 border-r border-border rounded-sm p-4">
              <div className="flex items-center mb-4">
                <i className="ri-information-line text-primary text-lg mr-2"></i>
                <h3 className="font-semibold text-text">Core Information</h3>
              </div>
              
              {!form.name && <Input
                label="Business Name"
                placeholder="Enter your business name"
                required
                name="name"
                id="name"
                value={form.name}
                onChange={handleChange("name")}
                onBlur={() => handleBlur("name")}
                error={errors.name}
              />}

              <Input
                label="Business Branch"
                placeholder="Enter your business branch"
                required
                name="branch"
                id="branch"
                value={form.branch}
                onChange={handleChange("branch")}
                onBlur={() => handleBlur("branch")}
                error={errors.branch}
              />

              {!form.registration_number && 
              <Input
                label="Registration Number (Optional)"
                placeholder="e.g., RC1234567"
                name="registration_number"
                id="registration_number"
                value={form.registration_number}
                onChange={handleChange("registration_number")}
                onBlur={() => handleBlur("registration_number")}
                error={errors.registration_number}
              />}
              {!form.tax_id && 

              <Input
                label="Tax ID (Optional)"
                placeholder="e.g., 1234567890"
                name="tax_id"
                id="tax_id"
                value={form.tax_id}
                onChange={handleChange("tax_id")}
                onBlur={() => handleBlur("tax_id")}
                error={errors.tax_id}
              />
              }

              <Input
                label="Contact Email"
                type="email"
                placeholder="business@example.com"
                required
                name="email"
                id="email"
                value={form.email}
                onChange={handleChange("email")}
                onBlur={() => handleBlur("email")}
                error={errors.email}
              />

              <Input
                label="Phone Number"
                type="tel"
                placeholder="e.g., 9876543210"
                required
                name="phone"
                id="phone"
                value={form.phone}
                onChange={handleChange("phone")}
                onBlur={() => handleBlur("phone")}
                error={errors.phone}
              />

              <Input
                label="Website URL (Optional)"
                type="url"
                placeholder="https://www.your-business.com"
                name="website"
                id="website"
                value={form.website}
                onChange={handleChange("website")}
                onBlur={() => handleBlur("website")}
                error={errors.website}
              />
            </div>

            {/* Column 2: Address */}
            <div className="space-y-4   p-4">
              <div className="flex items-center mb-4">
                <i className="ri-map-pin-line text-primary text-lg mr-2"></i>
                <h3 className="font-semibold text-text">Address</h3>
              </div>
              
              {!form.country && <Input
                type="select"
                label="Country"
                placeholder="Select Country"
                required
                name="country"
                id="country"
                selectOptions={supportedCountries}
                value={form.country}
                onChange={handleChange("country")}
                onBlur={() => handleBlur("country")}
                error={errors.country}
              />}

              <Input
                label="State/Province"
                placeholder="Enter state or province"
                required
                name="state"
                id="state"
                value={form.state}
                onChange={handleChange("state")}
                onBlur={() => handleBlur("state")}
                error={errors.state}
              />

              <Input
                label="City"
                placeholder="Enter city"
                required
                name="city"
                id="city"
                value={form.city}
                onChange={handleChange("city")}
                onBlur={() => handleBlur("city")}
                error={errors.city}
              />

              <Input
                label="Business Address"
                type="textarea"
                placeholder="Enter full street address"
                required
                name="address"
                id="address"
                value={form.address}
                onChange={handleChange("address")}
                onBlur={() => handleBlur("address")}
                error={errors.address}
              />
            {!form.zip_code &&
            <Input
                label="ZIP Code"
                placeholder="Enter postal/ZIP code"
                required
                name="zip_code"
                id="zip_code"
                value={form.zip_code}
                onChange={handleChange("zip_code")}
                onBlur={() => handleBlur("zip_code")}
                error={errors.zip_code}
              />}
            </div>
          </div>
        </form>
      </div>

      {/* Footer (Modal Style) */}
      <div className="flex justify-end items-center p-4 h-14 border-t border-border mt-auto sticky bottom-0 z-10 bg-card">
        <Button
          type="submit"
          onClick={onSubmit}
          disabled={!isFormValid || loading}
          loading={loading}
          variant="primary"
        >
          {loading
            ? "Processing..."
            : isEditMode
            ? "Update Entity"
            : "Add Entity"}
        </Button>
      </div>
    </div>
  );
};

export default AddEntityModal;