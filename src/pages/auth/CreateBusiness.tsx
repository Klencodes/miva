import React, { useState, useRef, useCallback, useEffect } from "react";
import { useModal } from "../../core/hooks/useModal";
import { ReadAgreementModalContent } from "./ReadAgreement";
import { Button, Input } from "../../components/common";
import { usePageTitle } from "../../core/hooks/usePageTitle";
import { toast } from "sonner";

interface BusinessProfileForm {
  country: string;
  name: string;
  email: string;
  address: string;
  phone_number: string;
  website: string;
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

const CreateBusiness: React.FC = () => { 
  const { openModal } = useModal();
  const [form, setForm] = useState<BusinessProfileForm>(initialFormState);
  const [errors, setErrors] = useState<Partial<BusinessProfileForm>>({});
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  usePageTitle("Create Business Account");

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
      // try {
      //   const res = await appService.getSupportedCountries();
      //   if (res.success) {
      //       const formattedCountries = [{ value: "", label: "Select Country" }, ...res.results.map((country: SelectOption) => country)];
      //     setSupportedCountries(formattedCountries);
      //   }
      // } catch (error) {
      //   console.error("Failed to fetch countries:", error);
      // }
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
    clearFileInput();
    setLogoError(null);
  };

  const uploadLogo = useCallback(async (): Promise<string | null> => {
    if (!selectedFile) return null;

    setUploading(true);
    setLogoError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("file_type", "image");
      formData.append("file_purpose", "ev3-station-pictures");

      const uploadResponse: any = {};
      // const uploadResponse: any = await appService.uploadAsset(formData);
      
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
  }, [selectedFile]);


  const saveBusinessProfile = async (businessData: any): Promise<void> => {
    try {
      const response: any = {}
      // const response: any = await appService.createBusiness(businessData);
      if (!response.success) {
        throw new Error(response.message || "Failed to create business profile.");
      }
      toast.success("Success", {description: response.message || "Business profile created successfully!"});
      window.location.replace("/store");

    } catch (error: any) {
      toast.error("Error", {description: error.message || "Failed to create business profile."});
      throw error; // Re-throw to handle in calling function
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors = validate(form);
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error("Validation Error", {description: "Please correct the highlighted fields."});
      return;
    }

    setLoading(true);

    try {
      let agreementResult: any = null;
      try {
        agreementResult = await openModal(ReadAgreementModalContent, {
          data: {
            title: "EV Merchant Agreement",
            subtitle: "Terms and Conditions for Electric Vehicle Charging Station Operation",
          },
          size: "3xl",
          backdropClose: false,
        });
      } catch (error) {
        // User closed the modal without agreeing
        toast.error("Error", {description: "You must accept the terms and conditions to continue."});
        setLoading(false);
        return;
      }

      if (!agreementResult || agreementResult.agreedToTerms !== true) {
        toast.error("Error", {description: "You must accept the terms and conditions to continue."});
        setLoading(false);
        return;
      }

      let logoUrl: string | null = null;

      if (selectedFile) {
        logoUrl = (await uploadLogo()) || null;
        if (!logoUrl) {
          // uploadLogo already shows error message
          setLoading(false);
          return;
        }
      }

      const finalFormData = {
        ...form,
        logo: logoUrl,
        agreed_to_terms: agreementResult.agreedToTerms,
        marketing_consent: agreementResult.marketingConsent,
      };

      await saveBusinessProfile(finalFormData);
      
    } catch (error) {
      // Error already handled in saveBusinessProfile
      console.error("Form submission error:", error);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = Object.keys(validate(form)).length === 0;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="w-full max-w-5xl card">
        <div className="mb-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card backdrop-blur-sm border border-border mb-6">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-text-light">
              Business Profile
            </span>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                
                <Input
                  label="Business Name"
                  placeholder="Enter your business name"
                  required
                  name="name"
                  id="name"
                  value={form.name}
                  onChange={handleChange("name")}
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
                  error={errors.email}
                />

                <Input
                  label="Phone Number"
                  type="tel"
                  placeholder="(+XX) XXX-XXX-XXXX"
                  required
                  name="phone_number"
                  id="phone_number"
                  value={form.phone_number}
                  onChange={handleChange("phone_number")}
                  error={errors.phone_number}
                />

                <Input
                  label="Website URL"
                  type="url"
                  placeholder="https://www.your-business.com"
                  name="website"
                  id="website"
                  value={form.website}
                  onChange={handleChange("website")}
                  error={errors.website}
                />
              </div>

              <div className="space-y-4">
                <Input
                  label="Business Address"
                  type="textarea"
                  placeholder="Enter full street address"
                  required
                  name="address"
                  id="address"
                  value={form.address}
                  onChange={handleChange("address")}
                  error={errors.address}
                />

                <div className="space-y-2">
                  {logoPreview && (
                    <div className="">
                      <div className="relative inline-block">
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="w-full h-40 object-cover border border-border"
                        />
                        <button
                          type="button"
                          onClick={removeLogo}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-danger text-white rounded-full flex items-center justify-center text-xs hover:bg-danger-80 transition-colors"
                        >
                          &times;
                        </button>
                      </div>
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

            <div className="mt-10">
              <Button
                type="submit"
                disabled={!isFormValid || loading || uploading}
                loading={loading}
              >
                {uploading
                  ? "Uploading..."
                  : loading
                  ? "Processing..."
                  : "Complete Setup"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateBusiness;