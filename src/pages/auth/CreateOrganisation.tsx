import React, { useState, useCallback } from "react";
import { useModal } from "../../core/hooks/useModal";
import { ReadAgreementModalContent } from "./ReadAgreement";
import { Button, Input } from "../../components/common";
import { usePageTitle } from "../../core/hooks/usePageTitle";
import { toast } from "sonner";
import { Building, Mail, Phone, Globe, MapPin, Hash, FileText, CreditCard } from "lucide-react";
import entity from "../../core/services/entity";
import { useNavigate } from "react-router-dom";
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

const initialFormState: OrganisationProfileForm = {
  name: "MIVA-CRIMP JV",
  email: "info@mivacrimp.com",
  phone: "+233 20 123 4567",
  website: "www.mivacrimp.com",
  address: "123 Industrial Area",
  city: "Accra",
  state: "Greater Accra",
  country: "Ghana",
  zip_code: "GA-123-4567",
  registration_number: "RC-2024-001",
  tax_id: "TIN-123456789",
  branch: "Main Shop",
};

const URL_PATTERN = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i;
const PHONE_PATTERN = /^[0-9+\-\s()]+$/;

const CreateOrganisation: React.FC = () => {
  const { openModal } = useModal();
  const [form, setForm] = useState<OrganisationProfileForm>(initialFormState);
  const [errors, setErrors] = useState<Partial<OrganisationProfileForm>>({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setEntity } = useStore()
  usePageTitle("Create Organisation");

  const validate = useCallback(
    (data: OrganisationProfileForm): Partial<OrganisationProfileForm> => {
      const newErrors: Partial<OrganisationProfileForm> = {};
      
      if (!data.name) newErrors.name = "Organisation Name is required.";
      if (!data.email) {
        newErrors.email = "Email is required.";
      } else if (!/^\S+@\S+$/i.test(data.email)) {
        newErrors.email = "Invalid email format.";
      }
      if (!data.phone) {
        newErrors.phone = "Phone number is required.";
      } else if (!PHONE_PATTERN.test(data.phone)) {
        newErrors.phone = "Invalid phone number format.";
      }
      if (data.website && !URL_PATTERN.test(data.website)) {
        newErrors.website = "Invalid URL format.";
      }
      if (!data.address) newErrors.address = "Address is required.";
      if (!data.city) newErrors.city = "City is required.";
      if (!data.state) newErrors.state = "State/Region is required.";
      if (!data.country) newErrors.country = "Country is required.";
      if (!data.zip_code) newErrors.zip_code = "ZIP/Postal code is required.";
      if (!data.registration_number) newErrors.registration_number = "Registration number is required.";
      if (!data.tax_id) newErrors.tax_id = "Tax ID is required.";
      if (!data.branch) newErrors.branch = "branch is required.";
      
      return newErrors;
    },
    [],
  );

  const handleChange = (name: keyof OrganisationProfileForm) => (value: any) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
const saveOrganisationProfile = async (organisationData: any): Promise<void> => {
  try {
    const response = await entity.create(organisationData);
    
    if (!response.success) {
      throw new Error(response.message || "Failed to create organisation profile.");
    }
    setEntity(response.results)
    toast.success("Success", {
      description: response.message || "Organisation profile created successfully!",
    });

    navigate("/dashboard");
    
  } catch (error: any) {
    toast.error("Error", {
      description: error.message || "Failed to create organisation profile.",
    });
    throw error;
  }
};

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = validate(form);
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error("Validation Error", {
        description: "Please correct the highlighted fields.",
      });
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
        toast.error("Error", {
          description: "You must accept the terms and conditions to continue.",
        });
        setLoading(false);
        return;
      }

      if (!agreementResult || agreementResult.agreedToTerms !== true) {
        toast.error("Error", {
          description: "You must accept the terms and conditions to continue.",
        });
        setLoading(false);
        return;
      }

      const finalFormData = {
        ...form,
        agreed_to_terms: agreementResult.agreedToTerms,
        marketing_consent: agreementResult.marketingConsent,
      };

      await saveOrganisationProfile(finalFormData);
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = Object.keys(validate(form)).length === 0;

  return (
    <div className="w-full max-w-[900px] mx-auto">
      <div
        className={[
          "relative overflow-hidden",
          "bg-card border border-border",
          "px-6 py-10",
        ].join(" ")}
      >
        {/* Top gradient bar */}
        <div
          className="absolute inset-x-0 top-0 h-[3px]"
          style={{
            background: "linear-gradient(90deg, var(--primary-color) 0%, #818CF8 100%)",
          }}
          aria-hidden="true"
        />

        {/* Header */}
        <div className="flex flex-col items-center gap-2.5 mb-8">
          <img src="/logo.png" width={250} height={90} alt="MIVA Prestige Ent" />
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-card backdrop-blur-sm border border-border">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-text-light">Business Profile Setup</span>
          </div>
        </div>

        <form onSubmit={onSubmit} noValidate>
          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-5">
              <Input
                label="Organisation Name"
                placeholder="Enter your organisation name"
                required
                name="name"
                id="name"
                value={form.name}
                onChange={handleChange("name")}
                error={errors.name}
                prefixIcon={<Building size={16} />}
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="organisation@example.com"
                required
                name="email"
                id="email"
                value={form.email}
                onChange={handleChange("email")}
                error={errors.email}
                prefixIcon={<Mail size={16} />}
              />

              <Input
                label="Phone Number"
                type="tel"
                placeholder="+233 20 123 4567"
                required
                name="phone"
                id="phone"
                value={form.phone}
                onChange={handleChange("phone")}
                error={errors.phone}
                prefixIcon={<Phone size={16} />}
              />

              <Input
                label="Website"
                type="url"
                placeholder="www.your-organisation.com"
                name="website"
                id="website"
                value={form.website}
                onChange={handleChange("website")}
                error={errors.website}
                prefixIcon={<Globe size={16} />}
              />

              <Input
                label="Registration Number"
                placeholder="RC-2024-001"
                required
                name="registration_number"
                id="registration_number"
                value={form.registration_number}
                onChange={handleChange("registration_number")}
                error={errors.registration_number}
                prefixIcon={<Hash size={16} />}
              />
            </div>

            {/* Right Column */}
            <div className="space-y-5">
               <Input
                label="Branch"
                placeholder="GHS"
                required
                name="branch"
                id="branch"
                value={form.branch}
                onChange={handleChange("branch")}
                error={errors.branch}
                prefixIcon={<CreditCard size={16} />}
              />
              <Input
                label="Tax ID"
                placeholder="TIN-123456789"
                required
                name="taxId"
                id="taxId"
                value={form.tax_id}
                onChange={handleChange("tax_id")}
                error={errors.tax_id}
                prefixIcon={<FileText size={16} />}
              />

              <Input
                label="Address"
                placeholder="123 Industrial Area"
                required
                name="address"
                id="address"
                value={form.address}
                onChange={handleChange("address")}
                error={errors.address}
                prefixIcon={<MapPin size={16} />}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="City"
                  placeholder="Accra"
                  required
                  name="city"
                  id="city"
                  value={form.city}
                  onChange={handleChange("city")}
                  error={errors.city}
                />

                <Input
                  label="State/Region"
                  placeholder="Greater Accra"
                  required
                  name="state"
                  id="state"
                  value={form.state}
                  onChange={handleChange("state")}
                  error={errors.state}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Country"
                  placeholder="Ghana"
                  required
                  name="country"
                  id="country"
                  value={form.country}
                  onChange={handleChange("country")}
                  error={errors.country}
                />

                <Input
                  label="ZIP/Postal Code"
                  placeholder="GA-123-4567"
                  required
                  name="zip_code"
                  id="zip_code"
                  value={form.zip_code}
                  onChange={handleChange("zip_code")}
                  error={errors.zip_code}
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8 pt-6 border-t border-border">
            <Button
              type="submit"
              disabled={!isFormValid || loading}
              loading={loading}
              fullWidth
              className={loading ? "opacity-60 cursor-not-allowed" : "hover:opacity-90"}
            >
            
            </Button>
          </div>
        </form>

        <p className="mt-5 text-center text-[11.5px] text-text-light leading-relaxed">
          MIVA Prestige Ent - Hydraulic Management System
        </p>
      </div>
    </div>
  );
};

export default CreateOrganisation;