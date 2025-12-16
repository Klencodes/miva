import React, { useState, useRef, useEffect } from "react";
import { useStore } from "../../../core/hooks/useStore";
import { Button } from "../../../ui";
import { toast } from "sonner";

const TermsConditionsScreen: React.FC = () => {
  const { user } = useStore();
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showFullTerms, setShowFullTerms] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Check if user has already accepted terms
  useEffect(() => {
    const checkTermsAcceptance = async () => {
      try {
        // Check local storage for acceptance
        const acceptedTerms = localStorage.getItem(
          "god-did-mart-terms-accepted"
        );
        const version = localStorage.getItem("god-did-mart-terms-version");
        const currentVersion = "1.0.0"; // Update when terms change

        if (acceptedTerms === "true" && version === currentVersion) {
          setAccepted(true);
        }
      } catch (error) {
        console.error("Error checking terms acceptance:", error);
      }
    };

    checkTermsAcceptance();
  }, []);

  const handleAcceptTerms = async () => {
    if (!accepted) {
      setLoading(true);
      try {
        // Save acceptance to localStorage
        localStorage.setItem("god-did-mart-terms-accepted", "true");
        localStorage.setItem("god-did-mart-terms-version", "1.0.0");
        localStorage.setItem(
          "god-did-mart-terms-accepted-date",
          new Date().toISOString()
        );

        // If user is logged in, you might want to sync with server
        if (user) {
          // API call to update user terms acceptance
          // await updateUserTermsAcceptance(user.id);
        }

        setAccepted(true);
        toast.success("Terms & Conditions accepted successfully");

        // Optional: Redirect to main screen after acceptance
        // setTimeout(() => navigation.navigate('Home'), 1000);
      } catch (error) {
        toast.error("Failed to save acceptance. Please try again.");
        console.error("Error accepting terms:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDecline = () => {
    toast.error("You must accept the Terms & Conditions to use God-Did Mart");
    // Optionally: Force logout or restrict access
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Quick navigation sections
  const quickNavSections = [
    { id: "acceptance", label: "Acceptance" },
    { id: "offline", label: "Offline Mode" },
    { id: "transactions", label: "Transactions" },
    { id: "privacy", label: "Privacy" },
    { id: "liability", label: "Liability" },
    { id: "contact", label: "Contact" },
  ];

  const termsContent = [
    {
      id: "acceptance",
      title: "1. ACCEPTANCE OF TERMS",
      content: `By accessing, downloading, installing, or using the God-Did Mart application ("the App"), you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, you must not use the App.`,
    },
    {
      id: "definitions",
      title: "2. DEFINITIONS",
      content: `
• "App" refers to the God-Did Mart mobile application and associated services.
• "User" refers to any individual or entity using the App.
• "Customer" refers to retail customers whose purchases are processed through the App.
• "Merchant" refers to business owners or employees using the App for sales transactions.
• "Offline Mode" refers to the App's functionality when no internet connection is available.
• "Data" includes all information stored, processed, or transmitted through the App.`,
    },
    {
      id: "license",
      title: "3. LICENSE AND USE",
      content: `### 3.1 License Grant
Subject to these Terms, God-Did Mart grants you a limited, non-exclusive, non-transferable, revocable license to:
• Download and install the App on compatible devices
• Use the App for legitimate retail business operations
• Process customer transactions

### 3.2 Restrictions
You may not:
• Reverse engineer, decompile, or disassemble the App
• Modify, adapt, or create derivative works
• Remove any proprietary notices or labels
• Use the App for illegal activities
• Share your account credentials`,
    },
    {
      id: "account",
      title: "4. ACCOUNT REGISTRATION AND SECURITY",
      content: `### 4.1 Account Creation
• You must provide accurate information during registration
• You must be at least 18 years old to create an account
• You are responsible for maintaining account confidentiality

### 4.2 Security Obligations
• Keep login credentials secure
• Notify us immediately of any unauthorized access
• Log out after each session on shared devices`,
    },
    {
      id: "offline",
      title: "5. OFFLINE FUNCTIONALITY",
      content: `### 5.1 Local Data Storage
The App stores data locally on your device when offline:
• Transaction data is saved to device storage
• Product information is cached locally
• Receipts are generated and stored locally

### 5.2 Data Synchronization
• When internet connection is restored, data syncs automatically
• You are responsible for maintaining regular sync
• We are not liable for data loss due to prolonged offline use

### 5.3 Storage Responsibility
• You are responsible for adequate device storage
• Regular backups are recommended
• Clear cache only when necessary to avoid data loss`,
    },
    {
      id: "transactions",
      title: "6. TRANSACTION PROCESSING",
      content: `### 6.1 Sales Transactions
• The App processes retail transactions
• All sales are final unless otherwise stated
• Receipts are generated for each transaction

### 6.2 Payment Processing
• Supports cash and mobile money payments
• Payment reconciliation is your responsibility
• Refund processing must comply with local laws

### 6.3 Inventory Management
• Real-time stock updates
• Low stock alerts
• Manual stock adjustments available`,
    },
    {
      id: "privacy",
      title: "7. DATA PRIVACY AND SECURITY",
      content: `### 7.1 Data Collection
We collect:
• Business information
• Transaction data
• Customer purchase history (for receipts)
• Device information for troubleshooting

### 7.2 Data Storage
• Data is stored on your device and our secure servers
• Encrypted transmission during sync
• Local data remains on your device

### 7.3 GDPR/Privacy Compliance
• You are responsible for customer data compliance
• Customer consent for receipts is your responsibility
• We provide tools for data management`,
    },
    {
      id: "intellectual",
      title: "8. INTELLECTUAL PROPERTY",
      content: `### 8.1 Ownership
• The App and all content are owned by God-Did Mart
• Trademarks, logos, and branding are protected
• You retain ownership of your business data

### 8.2 User Content
You grant us a license to:
• Store and process your business data
• Generate reports and analytics
• Improve App functionality`,
    },
    {
      id: "fees",
      title: "9. FEES AND PAYMENTS",
      content: `### 9.1 Subscription
[If applicable]:
• Monthly/annual subscription fees
• Automatic renewal unless cancelled
• Price changes with 30-day notice

### 9.2 Free Version
• Basic features available at no cost
• Premium features may require payment
• Transaction fees may apply for certain features`,
    },
    {
      id: "liability",
      title: "10. LIMITATION OF LIABILITY",
      content: `### 10.1 No Warranty
The App is provided "as is" without warranties:
• We don't guarantee uninterrupted service
• Offline functionality depends on your device
• We're not liable for business losses

### 10.2 Limitation
To the maximum extent permitted by law:
• We're not liable for indirect damages
• Maximum liability limited to subscription fees paid
• Not liable for third-party service issues`,
    },
    {
      id: "termination",
      title: "11. TERMINATION",
      content: `### 11.1 By You
You may stop using the App at any time.

### 11.2 By Us
We may terminate access if:
• You violate these Terms
• Non-payment of fees
• Legal requirements demand it

### 11.3 Effect of Termination
• Access to App services ends
• Data export available for 30 days
• Local data remains on your device`,
    },
    {
      id: "updates",
      title: "12. UPDATES AND MODIFICATIONS",
      content: `### 12.1 App Updates
• Automatic or manual updates
• New features may be added
• Older versions may become unsupported

### 12.2 Terms Updates
We may update these Terms:
• Changes will be notified
• Continued use means acceptance
• Major changes with 30-day notice`,
    },
    {
      id: "third-party",
      title: "13. THIRD-PARTY SERVICES",
      content: `### 13.1 Integration
The App may integrate with:
• Payment processors
• Accounting software
• Inventory systems

### 13.2 Third-Party Terms
• You must comply with third-party terms
• We're not responsible for third-party services
• Integration failures are not our liability`,
    },
    {
      id: "governing",
      title: "14. GOVERNING LAW AND DISPUTES",
      content: `### 14.1 Governing Law
These Terms are governed by the laws of [Your Country/State].

### 14.2 Dispute Resolution
• Attempt amicable resolution first
• Mediation before legal action
• Legal proceedings in [Specified Jurisdiction]`,
    },
    {
      id: "misc",
      title: "15. MISCELLANEOUS",
      content: `### 15.1 Entire Agreement
These Terms constitute the entire agreement.

### 15.2 Severability
If any provision is invalid, others remain effective.

### 15.3 Force Majeure
Not liable for events beyond our control.

### 15.4 Assignment
You may not transfer your rights without our consent.`,
    },
    {
      id: "contact",
      title: "16. CONTACT INFORMATION",
      content: `For questions or concerns:
**Email:** support@goddidmart.com
**Phone:** [Your Phone Number]
**Address:** [Your Business Address]

**Last Updated:** ${new Date().toLocaleDateString()}`,
    },
  ];

  // If user has already accepted, show simplified view
  if (accepted && !showFullTerms) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-1 bg-background min-w-0 h-[calc(100%-120px)]">
          {/* Header */}
          <div className="rounded-sm shadow-sm mb-4 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-text">
                  Terms & Conditions
                </h1>
                <p className="text-text-light mt-1">
                  Accepted on{" "}
                  {localStorage.getItem("god-did-mart-terms-accepted-date")
                    ? new Date(
                        localStorage.getItem(
                          "god-did-mart-terms-accepted-date"
                        )!
                      ).toLocaleDateString()
                    : "Previously"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="bg-success text-white px-3 py-1 rounded-full text-sm">
                  Accepted ✓
                </span>
                <Button
                  onClick={() => setShowFullTerms(true)}
                  variant="outline"
                >
                  View Full Terms
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Summary */}
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-card p-6 rounded-sm border border-border">
                <h3 className="font-bold text-text mb-3 flex items-center gap-2">
                  <i className="ri-shield-check-line text-primary"></i>
                  Your Acceptance
                </h3>
                <ul className="space-y-2 text-sm text-text-light">
                  <li className="flex items-start gap-2">
                    <i className="ri-check-line text-success mt-0.5"></i>
                    <span>Accepted Terms Version 1.0.0</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <i className="ri-check-line text-success mt-0.5"></i>
                    <span>Understood offline functionality</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <i className="ri-check-line text-success mt-0.5"></i>
                    <span>Acknowledged data storage practices</span>
                  </li>
                </ul>
              </div>

              <div className="bg-card p-6 rounded-sm border border-border">
                <h3 className="font-bold text-text mb-3 flex items-center gap-2">
                  <i className="ri-information-line text-info"></i>
                  Key Points
                </h3>
                <ul className="space-y-2 text-sm text-text-light">
                  <li className="flex items-start gap-2">
                    <i className="ri-alert-line text-warning mt-0.5"></i>
                    <span>Regular data backup recommended</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <i className="ri-alert-line text-warning mt-0.5"></i>
                    <span>You control customer data consent</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <i className="ri-alert-line text-warning mt-0.5"></i>
                    <span>Terms may update with notification</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-card p-6 rounded-sm border border-border">
              <h3 className="font-bold text-text mb-4">Recent Updates</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 text-primary px-2 py-1 rounded text-xs">
                    v1.0.0
                  </div>
                  <div>
                    <p className="text-sm text-text-light">
                      Initial Terms & Conditions published. Includes
                      comprehensive coverage of offline functionality, data
                      management, and user responsibilities.
                    </p>
                    <p className="text-xs text-text-lighter mt-1">
                      Effective: {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 bg-background min-w-0 h-[calc(100%-120px)]">
        {/* Header */}
        <div className="rounded-sm shadow-sm mb-4 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-text">
                Terms & Conditions
              </h1>
              <p className="text-text-light mt-1">
                Please read and accept the terms to use God-Did Mart
              </p>
            </div>

            {showFullTerms && (
              <div className="flex items-center gap-3">
                <Button onClick={() => setShowFullTerms(false)} variant="ghost">
                  Back to Summary
                </Button>
              </div>
            )}
          </div>

          {/* Quick Navigation - Only show when viewing full terms */}
          {showFullTerms && (
            <div className="mt-6">
              <div className="flex flex-wrap gap-2">
                {quickNavSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className="px-3 py-1.5 text-xs bg-card border border-border rounded-full hover:bg-primary/10 hover:border-primary transition-colors"
                  >
                    {section.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-6 p-6">
          {/* Terms Content */}
          <div
            ref={contentRef}
            className={`flex-1 ${showFullTerms ? "lg:w-2/3" : "w-full"}`}
          >
            <div className="bg-card rounded-sm border border-border overflow-hidden">
              {/* Terms Header */}
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-text">
                      God-Did Mart Terms & Conditions
                    </h2>
                    <p className="text-text-light text-sm mt-1">
                      Version 1.0.0 • Effective{" "}
                      {new Date().toLocaleDateString()}
                    </p>
                  </div>
                  <div className="hidden md:block">
                    <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                      Offline-First POS System
                    </div>
                  </div>
                </div>
              </div>

              {/* Terms Content */}
              <div className="p-6 max-h-[60vh] overflow-y-auto scrollbar-thin">
                {showFullTerms ? (
                  // Full Terms View
                  <div className="space-y-8">
                    {termsContent.map((section) => (
                      <div
                        key={section.id}
                        id={section.id}
                        className="pb-6 border-b border-border last:border-b-0 last:pb-0"
                      >
                        <h3 className="text-lg font-bold text-text mb-3">
                          {section.title}
                        </h3>
                        <div className="prose prose-sm max-w-none text-text-light">
                          {section.content.split("\n").map((line, index) => {
                            if (line.startsWith("### ")) {
                              return (
                                <h4
                                  key={index}
                                  className="font-bold text-text mt-4 mb-2"
                                >
                                  {line.replace("### ", "")}
                                </h4>
                              );
                            } else if (line.startsWith("• ")) {
                              return (
                                <div
                                  key={index}
                                  className="flex items-start gap-2 ml-4 my-1"
                                >
                                  <span className="text-primary mt-1">•</span>
                                  <span>{line.substring(2)}</span>
                                </div>
                              );
                            } else {
                              return (
                                <p key={index} className="my-2">
                                  {line}
                                </p>
                              );
                            }
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Summary View (First-time acceptance)
                  <div className="space-y-6">
                    <div className="bg-primary/5 border-l-4 border-primary p-4">
                      <h3 className="font-bold text-text mb-2">
                        Important Notice
                      </h3>
                      <p className="text-sm text-text-light">
                        Before using God-Did Mart, you must accept our Terms &
                        Conditions. These terms govern your use of our
                        offline-first POS system, including data storage,
                        transaction processing, and your responsibilities.
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-card border border-border p-4 rounded-sm">
                        <h4 className="font-bold text-text mb-2 flex items-center gap-2">
                          <i className="ri-database-2-line text-info"></i>
                          Offline Data Management
                        </h4>
                        <ul className="text-sm text-text-light space-y-1">
                          <li>• Data stored locally on your device</li>
                          <li>• Automatic sync when online</li>
                          <li>• Your responsibility to maintain backups</li>
                        </ul>
                      </div>

                      <div className="bg-card border border-border p-4 rounded-sm">
                        <h4 className="font-bold text-text mb-2 flex items-center gap-2">
                          <i className="ri-shield-keyhole-line text-success"></i>
                          Your Responsibilities
                        </h4>
                        <ul className="text-sm text-text-light space-y-1">
                          <li>• Secure your account credentials</li>
                          <li>• Comply with local business laws</li>
                          <li>• Obtain customer consent for data</li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-warning/10 border border-warning/20 p-4 rounded-sm">
                      <h4 className="font-bold text-text mb-2 flex items-center gap-2">
                        <i className="ri-alert-line text-warning"></i>
                        Critical Points to Understand
                      </h4>
                      <div className="text-sm text-text-light space-y-2">
                        <p>
                          <strong>Data Loss Risk:</strong> We are not liable for
                          data loss due to device failure, theft, or prolonged
                          offline use.
                        </p>
                        <p>
                          <strong>Business Compliance:</strong> You are
                          responsible for following all local business, tax, and
                          privacy regulations.
                        </p>
                        <p>
                          <strong>Updates:</strong> Terms may be updated with
                          30-day notice. Continued use constitutes acceptance.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-sm">
                      <i className="ri-eye-line text-2xl text-primary"></i>
                      <div>
                        <p className="text-sm text-text-light">
                          For the complete Terms & Conditions including all
                          legal details and specific provisions,{" "}
                          <button
                            onClick={() => setShowFullTerms(true)}
                            className="text-primary hover:underline font-medium"
                          >
                            view the full document
                          </button>
                          .
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Acceptance Section */}
              <div className="p-6 border-t border-border bg-card">
                <div className="flex items-start gap-3 mb-4">
                  <div
                    className={`mt-0.5 w-5 h-5 rounded border ${
                      accepted ? "bg-primary border-primary" : "border-border"
                    }`}
                  >
                    {accepted && (
                      <i className="ri-check-line text-white text-xs flex items-center justify-center"></i>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="block text-text font-medium">
                      I have read and agree to the God-Did Mart Terms &
                      Conditions
                    </label>
                    <p className="text-sm text-text-light mt-1">
                      By checking this box, you acknowledge that you understand
                      and accept all terms, including offline data management
                      and your responsibilities.
                    </p>
                  </div>
                </div>

                <div className="flex justify-between">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={handleAcceptTerms}
                      disabled={loading || (accepted && !showFullTerms)}
                      className="flex-1"
                      variant={accepted ? "primary" : "ghost"}
                    >
                      {loading ? (
                        <>
                          <i className="ri-loader-4-line animate-spin mr-2"></i>
                          Processing...
                        </>
                      ) : accepted ? (
                        <>
                          <i className="ri-check-double-line mr-2"></i>
                          Terms Accepted
                        </>
                      ) : (
                        "Accept Terms & Continue"
                      )}
                    </Button>

                    <Button
                      onClick={handleDecline}
                      variant="outline"
                      className="flex-1"
                    >
                      Decline & Exit
                    </Button>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => {
                        // Print terms
                        window.print();
                      }}
                      className="text-sm text-primary hover:underline"
                    >
                      <i className="ri-printer-line mr-1"></i>
                      Print Terms
                    </button>
                    <button
                      onClick={() => {
                        // Export terms as PDF
                        toast.info("Export feature coming soon");
                      }}
                      className="text-sm text-primary hover:underline"
                    >
                      <i className="ri-download-line mr-1"></i>
                      Save Copy
                    </button>
                  </div>
                </div>

                {accepted && (
                  <div className="mt-4 p-3 bg-success/10 border border-success/20 rounded-sm">
                    <div className="flex items-center gap-2 text-success">
                      <i className="ri-checkbox-circle-line"></i>
                      <span className="text-sm">
                        Terms accepted on {new Date().toLocaleDateString()} at{" "}
                        {new Date().toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Side Panel - Only show in full terms view */}
          {showFullTerms && (
            <div className="lg:w-1/3">
              <div className="bg-card rounded-sm border border-border p-6 sticky top-6">
                <h3 className="font-bold text-text mb-4">Quick Links</h3>
                <div className="space-y-2">
                  {quickNavSections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-primary/10 rounded-sm transition-colors flex items-center justify-between group"
                    >
                      <span>{section.label}</span>
                      <i className="ri-arrow-right-s-line opacity-0 group-hover:opacity-100 transition-opacity"></i>
                    </button>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-border">
                  <h4 className="font-bold text-text mb-3">Document Info</h4>
                  <div className="space-y-2 text-sm text-text-light">
                    <div className="flex justify-between">
                      <span>Version:</span>
                      <span className="font-medium">1.0.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Effective Date:</span>
                      <span className="font-medium">
                        {new Date().toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Updated:</span>
                      <span className="font-medium">
                        {new Date().toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-border">
                  <h4 className="font-bold text-text mb-3">Need Help?</h4>
                  <p className="text-sm text-text-light mb-3">
                    Questions about these terms?
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      // Open contact/support
                      toast.info("Contact support@goddidmart.com");
                    }}
                  >
                    <i className="ri-customer-service-line mr-2"></i>
                    Contact Support
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TermsConditionsScreen;
