import React, {useState} from "react";
import { Button } from "../../../ui";
import {
  ENTITY_KEY,
  NO_ENTITY_KEY,
  removeStoredItem,
  setStoredItem,
  useStore,
} from "../../../core/hooks/useStore";
import { IEntityItem } from "../../../core/interfaces/IEntity";
import { appService } from "../../../core/services/app";

interface AccessDeniedProps {
  title?: string;
  message?: string;
}

const AccessDenied: React.FC<AccessDeniedProps> = ({
  title = "Access Restricted",
  message = "You don't have permission to access this section yet. Please contact your administrator to request access.",
}) => {
  const { setStoreEntities } = useStore();
  const [loading, setLoading] = useState<boolean>(false)
  const handleRetry = async () => {
    try {
      setLoading(true);
      const entitiesRes = await appService.getEntities();
      let entitiesToSet: IEntityItem[] = [];
      entitiesToSet = entitiesRes.results;
      const hasEntities = entitiesRes?.results?.length > 0;

      if (hasEntities) {
        // FIXED: Ensure setStoreEntities is available and call it
        await removeStoredItem(NO_ENTITY_KEY);
        setStoredItem(ENTITY_KEY, entitiesToSet[0]);
        setStoreEntities(entitiesToSet);
        window.location.replace("/store");
      }
      return;
    } catch (error) {
      console.error("Error fetching entities:", error);
      return false;
    } finally{
      setLoading(false)
    }
  };

  return (
    <div className="w-full h-full">
      <div className="flex flex-row gap-6 h-full">
        {/* Main Content Section */}
        <div className="flex-1 h-full bg-background min-w-0">
          {/* Main Access Denied Content */}
          <div className="flex-1 overflow-y-auto px-2">
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-8">
              {/* Title and Message */}
              <div className="max-w-2xl mx-auto">
                <h2 className="text-3xl font-bold text-text mb-4">{title}</h2>

                <div className="bg-card rounded-lg p-6 mb-8 border border-border shadow-sm">
                  <p className="text-lg text-text-light mb-6">{message}</p>
                  <Button size="sm" className={'mb-3'} loading={loading} onClick={handleRetry}>Retry again</Button>

                  {/* Additional Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-background p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <i className="ri-user-shared-line text-primary text-xl mr-3"></i>
                        <h3 className="font-semibold text-text">
                          Request Process
                        </h3>
                      </div>
                      <p className="text-sm text-text-light">
                        Contact your system administrator or manager to request
                        access to this section.
                      </p>
                    </div>

                    <div className="bg-background p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <i className="ri-time-line text-info text-xl mr-3"></i>
                        <h3 className="font-semibold text-text">
                          Typical Wait Time
                        </h3>
                      </div>
                      <p className="text-sm text-text-light">
                        Access requests are usually processed within 24-48
                        business hours.
                      </p>
                    </div>
                  </div>

                  {/* Steps to Get Access */}
                  <div className="mb-8">
                    <h3 className="font-semibold text-text mb-4 text-left">
                      Steps to Get Access:
                    </h3>
                    <div className="space-y-4">
                      {[
                        {
                          icon: "ri-message-3-line",
                          text: "Contact your administrator or supervisor",
                        },
                        {
                          icon: "ri-file-text-line",
                          text: "Submit an access request form if required",
                        },
                        {
                          icon: "ri-user-settings-line",
                          text: "Provide justification for needing access",
                        },
                        {
                          icon: "ri-shield-check-line",
                          text: "Wait for approval and security review",
                        },
                      ].map((step, index) => (
                        <div
                          key={index}
                          className="flex items-center p-3 bg-background rounded-lg"
                        >
                          <div className="w-8 h-8 rounded-full bg-primary-10 text-primary flex items-center justify-center mr-3 flex-shrink-0">
                            <i className={step.icon}></i>
                          </div>
                          <span className="text-text">{step.text}</span>
                          <div className="ml-auto w-6 h-6 rounded-full bg-border flex items-center justify-center text-xs font-semibold text-text-light">
                            {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="mt-8 p-6 bg-card rounded-lg border border-border">
                  <h3 className="font-semibold text-text mb-4">
                    Need Immediate Help?
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-background rounded-lg">
                      <i className="ri-phone-line text-2xl text-primary mb-2"></i>
                      <p className="font-medium text-text">IT Support</p>
                      <p className="text-sm text-text-light">0247740704</p>
                    </div>
                    <div className="text-center p-4 bg-background rounded-lg">
                      <i className="ri-mail-line text-2xl text-info mb-2"></i>
                      <p className="font-medium text-text">Email</p>
                      <p className="text-sm text-text-light">
                        klencodes@gmail.com
                      </p>
                    </div>
                    <div className="text-center p-4 bg-background rounded-lg">
                      <i className="ri-slack-line text-2xl text-success mb-2"></i>
                      <p className="font-medium text-text">Slack Channel</p>
                      <p className="text-sm text-text-light">#it-support</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessDenied;
