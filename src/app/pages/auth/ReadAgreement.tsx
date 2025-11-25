import React, { useState, FC } from "react";
import { useModal } from "../../../core/hooks/useModal";
import { Button } from "../../../ui";
import { toast } from "sonner";

interface AgreementForm {
  agreeTerms: boolean;
  marketingConsent: boolean;
  dataConsent: boolean;
}

export const ReadAgreementModalContent: FC = () => {
  const { modalRef, modalData } = useModal();
  const [agreementForm, setAgreementForm] = useState<AgreementForm>({
    agreeTerms: false,
    marketingConsent: false,
    dataConsent: false,
  });

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAgreementForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.checked,
    }));
  };

  const saveAgreement = () => {
    if (!agreementForm.agreeTerms) {
      toast.error(
        "Action Required",
        { description: "Please accept the EV Merchant Agreement to proceed"});
      return;
    }

    const agreementData = {
      agreedToTerms: agreementForm.agreeTerms,
      marketingConsent: agreementForm.marketingConsent,
      dataConsent: agreementForm.dataConsent,
      agreedAt: new Date().toISOString(),
    };

    modalRef!.close(agreementData);
  };

  const cancel = () => {
    modalRef!.close(false);
  };

  return (
    <div className="p-6 max-h-[90vh] overflow-y-auto">
      <div className="flex flex-row justify-between items-center mb-4">
        {modalData && (
          <div className="flex flex-col">
            {modalData.title && (
              <h2 className="text-xl text-text font-bold">{modalData.title}</h2>
            )}
            {modalData.subtitle && (
              <h4 className="text-base text-text-light">
                {modalData.subtitle}
              </h4>
            )}
          </div>
        )}
        <button
          onClick={() => modalRef!.dismiss()}
          className="w-8 h-8 rounded-full text-text-light bg-background"
          aria-label="Close modal"
        >
          <i className="ri-close-line text-2xl"></i>
        </button>
      </div>
      <div className="bg-background rounded-lg p-6 mb-4 max-h-96 overflow-y-auto">
        <div className="space-y-6 text-sm">
          {/* Service Agreement */}
          <div>
            <h4 className="font-semibold text-text mb-3">1. Service Provision Agreement</h4>
            <ul className="space-y-2 text-text-light">
              <li>• I authorize the setup and operation of EV charging stations at my business location</li>
              <li>• I understand that charging station availability may be affected by maintenance, power outages, or technical issues</li>
              <li>• I agree to provide adequate space, power supply, and accessibility for charging equipment</li>
              <li>• I commit to maintaining safe and accessible charging facilities for EV users</li>
              <li>• I acknowledge that service levels may vary based on network conditions and equipment performance</li>
            </ul>
          </div>

          {/* Financial Terms */}
          <div>
            <h4 className="font-semibold text-text mb-3">2. Financial Terms & Revenue Sharing</h4>
            <ul className="space-y-2 text-text-light">
              <li>• I agree to the revenue sharing model as outlined in the pricing schedule</li>
              <li>• I understand that payment processing fees and transaction costs will be deducted from gross revenue</li>
              <li>• I authorize direct deposit payments to my registered business account on a monthly basis</li>
              <li>• I acknowledge that tax obligations related to charging services are my responsibility</li>
              <li>• I agree to provide valid tax identification information for reporting purposes</li>
            </ul>
          </div>

          {/* Technical Requirements */}
          <div>
            <h4 className="font-semibold text-text mb-3">3. Technical Requirements & Maintenance</h4>
            <ul className="space-y-2 text-text-light">
              <li>• I agree to maintain reliable internet connectivity for station operation and monitoring</li>
              <li>• I understand that regular software updates and maintenance may require temporary station unavailability</li>
              <li>• I commit to reporting any technical issues or equipment malfunctions promptly</li>
              <li>• I agree to provide access for scheduled maintenance and emergency repairs</li>
              <li>• I understand that vandalism or damage to equipment may result in service interruptions</li>
            </ul>
          </div>

          {/* Legal & Compliance */}
          <div>
            <h4 className="font-semibold text-text mb-3">4. Legal & Compliance Obligations</h4>
            <ul className="space-y-2 text-text-light">
              <li>• I confirm I have the legal authority to enter into this agreement on behalf of the business</li>
              <li>• I agree to comply with all local, state, and federal regulations regarding EV charging operations</li>
              <li>• I understand that insurance requirements for the charging equipment are my responsibility</li>
              <li>• I agree to maintain proper liability insurance coverage as specified in the agreement</li>
              <li>• I acknowledge that violation of terms may result in service termination</li>
            </ul>
          </div>

          {/* Data & Privacy */}
          <div>
            <h4 className="font-semibold text-text mb-3">5. Data Collection & Privacy</h4>
            <ul className="space-y-2 text-text-light">
              <li>• I understand that usage data, including charging sessions and energy consumption, will be collected</li>
              <li>• I agree to the processing of business information for service optimization and reporting</li>
              <li>• I acknowledge that anonymized usage data may be used for network planning and improvement</li>
              <li>• I understand that customer payment information is handled securely and in compliance with PCI standards</li>
            </ul>
          </div>

          {/* Term & Termination */}
          <div>
            <h4 className="font-semibold text-text mb-3">6. Term & Termination</h4>
            <ul className="space-y-2 text-text-light">
              <li>• I understand this agreement has an initial term of 36 months with automatic renewal</li>
              <li>• I acknowledge that early termination may incur equipment removal and cancellation fees</li>
              <li>• I understand that breach of agreement terms may result in immediate service suspension</li>
              <li>• I agree to provide 60 days written notice for non-renewal of agreement</li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-semibold text-text mb-3">7. Customer Service & Support</h4>
            <ul className="space-y-2 text-text-light">
              <li>• I understand that 24/7 customer support is provided for EV drivers through the network operator</li>
              <li>• I agree to display required signage and contact information at charging locations</li>
              <li>• I commit to maintaining clean and well-lit charging areas for customer safety</li>
              <li>• I understand that customer billing and payment disputes are handled by the network operator</li>
            </ul>
          </div>

          <div className="pt-4 border-t border-border">
            <div className="text-text-light text-xs">
              By accepting this agreement, you also acknowledge that you have read and agree to our
              <a href="/privacy" className="text-primary hover:underline"> Privacy Policy</a>,
              <a href="/terms" className="text-primary hover:underline"> Terms of Service</a>, and
              <a href="/agreement" className="text-primary hover:underline"> Service Level Agreement</a>.
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="bg-primary-5 border border-primary rounded-sm p-3 mb-4">
          <div className="flex items-start gap-3">
            <div className="flex items-center h-5 mt-0.5">
              <input
                type="checkbox"
                id="agreeTerms"
                name="agreeTerms"
                checked={agreementForm.agreeTerms}
                onChange={handleCheckboxChange}
                className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary-5"
              />
            </div>
            <div>
              <label
                htmlFor="agreeTerms"
                className="text-sm font-medium text-text cursor-pointer"
              >
                I have read, understood, and agree to all terms and conditions of the EV Merchant Agreement
              </label>
              <p className="text-xs text-text-light mt-1">
                By checking this box, you electronically sign and accept all provisions of this agreement.
              </p>
            </div>
          </div>
          {!agreementForm.agreeTerms && (
            <p className="text-danger text-xs mt-2">This is required.</p>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="marketingConsent"
              name="marketingConsent"
              checked={agreementForm.marketingConsent}
              onChange={handleCheckboxChange}
              className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary-5"
            />
            <label
              htmlFor="marketingConsent"
              className="text-sm text-text cursor-pointer"
            >
              I agree to receive marketing communications and updates about EV charging services
            </label>
          </div>

          {/* <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="dataConsent"
              name="dataConsent"
              checked={agreementForm.dataConsent}
              onChange={handleCheckboxChange}
              className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary-5"
            />
            <label
              htmlFor="dataConsent"
              className="text-sm text-text cursor-pointer"
            >
              I consent to the collection and processing of my business data for service optimization
            </label>
          </div> */}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button onClick={cancel} variant="ghost">
          Cancel
        </Button>
        <Button onClick={saveAgreement} disabled={!agreementForm.agreeTerms}>
          Accept & Continue
        </Button>
      </div>

      {/* Footer Note */}
      <div className="mt-4 text-center">
        <p className="text-xs text-text-light">
          Need legal advice? Consult with your attorney before accepting this agreement.{" "}
          <a href="/ev-merchant-agreement.pdf" className="text-primary hover:underline">
            Download PDF Version
          </a>
        </p>
      </div>
    </div>
  );
};