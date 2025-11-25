import React, { useState, useRef, useCallback, useEffect } from "react";
import { useModal } from "../../../core/hooks/useModal";
import { Button, Input } from "../../../ui";
import { appService } from "../../../core/services/app";
import { SelectOption } from "../../../core/interfaces/ISelectOption";
import { toast } from "sonner";

interface BusinessProfileForm {
  country: string;
  name: string;
  email: string;
  address: string;
  phone_number: string;
  website: string;
}

interface AddEntityModalProps {
  data?: any; // Add props to receive edit data
}

const initialFormState: BusinessProfileForm = {
  country: "",
  name: "",
  email: "",
  address: "",
  phone_number: "",
  website: "",
};

const URL_PATTERN = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i;
const PHONE_PATTERN = /^[0-9]+$/;

const AddEntityModal: React.FC<AddEntityModalProps> = () => { 
  const { modalRef, modalData } = useModal(); 

  const [form, setForm] = useState<BusinessProfileForm>(initialFormState);
  const [errors, setErrors] = useState<Partial<BusinessProfileForm>>({});
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [supportedCountries, setSupportedCountries] = useState<SelectOption[]>([]);
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [existingLogoUrl, setExistingLogoUrl] = useState<string | null>(null);

  // Initialize form with edit data if provided
  useEffect(() => {
    if (modalData) {
      setIsEditMode(true);
      setForm({
        country: modalData.country || "",
        name: modalData.name || "",
        email: modalData.email || "",
        address: modalData.address || "",
        phone_number: modalData.phone_number || "",
        website: modalData.website || "",
      });
      
      if (modalData.logo) {
        setExistingLogoUrl(modalData.logo);
        setLogoPreview(modalData.logo);
      }
    }
  }, 
  //es-lint-disable-next-line
  [modalData]);

  const validate = useCallback(
    (data: BusinessProfileForm): Partial<BusinessProfileForm> => {
      const newErrors: Partial<BusinessProfileForm> = {};
      if (!data.country) newErrors.country = "Country is required.";
      if (!data.name) newErrors.name = "Business Name is required.";
      if (!data.email) {
        newErrors.email = "Contact Email is required.";
      } else if (!/^\S+@\S+$/i.test(data.email)) {
        newErrors.email = "Invalid email format.";
      }
      if (!data.address) newErrors.address = "Business Address is required.";
      if (!data.phone_number) {
        newErrors.phone_number = "Phone Number is required.";
      } else if (!PHONE_PATTERN.test(data.phone_number)) {
        newErrors.phone_number = "Only digits are allowed.";
      }
      if (data.website && !URL_PATTERN.test(data.website)) {
        newErrors.website = "Invalid URL format.";
      }
      return newErrors;
    },
    []
  );

  useEffect(() => {
    const getCountries = async () => {
      try {
        const res = await appService.getSupportedCountries();
        if (res.success) {
            const formattedCountries = [{ value: "", label: "Select Country" }, ...res.results.map((country: any) => ({
            value: country.name,
            label: country.name,
          }))];
          setSupportedCountries(formattedCountries);
        }
      } catch (error) {
        console.error("Failed to fetch countries:", error);
      }
    };

    getCountries();
  }, []);

  const handleChange = (name: keyof BusinessProfileForm) => (value: any) => {
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
  
  const handleBlur = (field: keyof BusinessProfileForm) => {
    setErrors(validate(form));
  };

  const clearFileInput = useCallback(() => {
    if (logoInputRef.current) {
      logoInputRef.current.value = "";
    }
  }, []);

  const onLogoSelected = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const maxSize = 5 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      setLogoError("Please select a valid image file (JPEG, PNG, WEBP)");
      clearFileInput();
      return;
    }

    if (file.size > maxSize) {
      setLogoError("File size must be less than 5MB");
      clearFileInput();
      return;
    }

    setLogoError(null);
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = (): void => {
    setLogoPreview(null);
    setSelectedFile(null);
    setExistingLogoUrl(null);
    clearFileInput();
    setLogoError(null);
  };

  const uploadLogo = useCallback(async (): Promise<string | null> => {
    if (!selectedFile) return existingLogoUrl; // Return existing logo if no new file

    setUploading(true);
    setLogoError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("file_type", "image");
      formData.append("file_purpose", "ev3-station-pictures");

      const uploadResponse: any = await appService.uploadAsset(formData);
      
      if (!uploadResponse.success) {
        throw new Error(uploadResponse.message || "Failed to upload logo");
      }
      
      return uploadResponse?.results?.secure_url || null;
    } catch (error: any) {
      const errorMessage = error.error?.message || error.message || "Failed to upload logo";
      setLogoError(errorMessage);
      return null;
    } finally {
      setUploading(false);
    }
  }, [selectedFile, existingLogoUrl]);

  const saveBusinessProfile = async (businessData: any): Promise<void> => {
    try {
      let response: any;
      
      if (isEditMode && modalData?.id) {
        // Update existing entity
        response = await appService.updateBusiness({id: modalData?.id, ...businessData});
      } else {
        // Create new entity
        response = await appService.createBusiness(businessData);
      }
      
      if (!response.success) {
        throw new Error(response.message || `Failed to ${isEditMode ? 'update' : 'create'} business profile.`);
      }
      
      toast.success(
        "Success", 
        {description: response.message || `Business profile ${isEditMode ? 'updated' : 'created'} successfully!`}
      );
      
      // Close the modal upon success
      modalRef!.close({ success: "success" }); 
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
      let logoUrl: string | null = null;

      // Only upload logo if a new file was selected, otherwise use existing
      if (selectedFile || existingLogoUrl) {
        logoUrl = (await uploadLogo()) || null;
        if (selectedFile && !logoUrl) {
          setLoading(false);
          return;
        }
      }

      const finalFormData = {
        ...form,
        logo: logoUrl,
      };

      await saveBusinessProfile(finalFormData);
      
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
      <div className="flex flex-row justify-between items-start mb-6 border-b border-border pb-4 sticky top-0 z-10 bg-card">
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

      {!isEditMode && (
        <div className="bg-info-5 border border-info-20 rounded-sm p-2 mb-6">
          <div className="flex items-start">
            <div className="flex flex-row items-center justify-between w-full">
              <p className="font-medium text-info mb-1">
                Please note that only verified entities will show at entities list
              </p>
              <Button 
                size="sm" 
                variant="link" 
                onClick={() => modalRef!.close({ success: "list_pending_entities" })}
              >
                View Pending Entities
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Form Guidance (Modal Style) */}
      <div className="bg-primary-5 border border-primary-20 rounded-sm p-2 mb-6">
        <div className="flex items-start">
          <i className="ri-building-line text-primary text-lg mr-3 mt-0.5"></i>
          <div>
            <p className="font-medium text-primary mb-1">
              Business Profile {isEditMode ? 'Update' : 'Requirements'}
            </p>
            <ul className="text-sm text-primary list-disc list-inside space-y-1">
              <li>All fields marked with * are required.</li>
              <li>A valid business email and contact number are mandatory.</li>
              {!isEditMode && <li>You must accept the Merchant Agreement to proceed.</li>}
            </ul>
          </div>
        </div>
      </div>

      {/* Scrollable Form Body */}
      <div className="flex-1 overflow-y-auto space-y-6 pb-4">
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Column 1: Core Details */}
            <div className="space-y-4 border border-border rounded-sm p-4">
              <div className="flex items-center mb-4">
                <i className="ri-information-line text-primary text-lg mr-2"></i>
                <h3 className="font-semibold text-text">Core Information</h3>
              </div>
              <Input
                type="select"
                label="Select Country"
                placeholder="Select Country"
                required
                name="country"
                id="country"
                selectOptions={supportedCountries}
                value={form.country}
                onChange={handleChange("country")}
                onBlur={() => handleBlur("country")}
                error={errors.country}
              />

              <Input
                label="Business Name"
                placeholder="Enter your business name"
                required
                name="name"
                id="name"
                value={form.name}
                onChange={handleChange("name")}
                onBlur={() => handleBlur("name")}
                error={errors.name}
              />

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
                name="phone_number"
                id="phone_number"
                value={form.phone_number}
                onChange={handleChange("phone_number")}
                onBlur={() => handleBlur("phone_number")}
                error={errors.phone_number}
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

            {/* Column 2: Address and Logo */}
            <div className="space-y-4 border border-border rounded-sm p-4">
              <div className="flex items-center mb-4">
                <i className="ri-image-line text-primary text-lg mr-2"></i>
                <h3 className="font-semibold text-text">Address & Logo</h3>
              </div>
              
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

              <div className="space-y-2 mt-4">
                {logoPreview && (
                  <div className="relative inline-block w-full">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-full h-40 rounded-lg object-contain border border-border p-2"
                    />
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-danger text-white rounded-full flex items-center justify-center text-xs hover:bg-danger-80 transition-colors z-20"
                    >
                      &times;
                    </button>
                  </div>
                )}

                {!logoPreview && (
                  <div className="flex items-center gap-3">
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="file"
                        ref={logoInputRef}
                        onChange={onLogoSelected}
                        accept="image/*"
                        className="hidden"
                      />
                      <div className="h-40 border-2 border-dashed border-border rounded-sm p-4 text-center hover:border-primary transition-colors">
                        <i className="ri-upload-cloud-2-line text-2xl text-text-light mb-2 block"></i>
                        <p className="text-sm text-text-light">
                          Click to upload business logo
                        </p>
                        <p className="text-xs text-text-lighter mt-1">
                          PNG, JPG, WEBP up to 5MB
                        </p>
                      </div>
                    </label>
                  </div>
                )}

                {uploading && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 text-sm text-text-light">
                      <i className="ri-loader-4-line animate-spin"></i>
                      <span>Uploading logo...</span>
                    </div>
                  </div>
                )}

                {logoError && (
                  <div className="text-danger text-sm mt-1">{logoError}</div>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Footer (Modal Style) */}
      <div className="flex justify-end items-center pt-4 h-14 border-t border-border mt-auto sticky bottom-0 z-10 bg-card">
        <Button
          type="submit"
          onClick={onSubmit}
          disabled={!isFormValid || loading || uploading}
          loading={loading || uploading}
          variant="primary"
        >
          {uploading
            ? "Uploading Logo..."
            : loading
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