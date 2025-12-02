
import { useModal } from "../../../core/hooks/useModal";
import { Button } from "../../../ui";
import { DateFormatEnums, dateUtils } from "../../../core/utils/date-format";
import { IUser } from "../../../core/interfaces/IUser";
export const StaffDetailsModal = () => {
  const { modalRef, modalData } = useModal();
  const userData: IUser = modalData;


  const formatUserType = (userType: string) => {
    return userType.charAt(0).toUpperCase() + userType.slice(1);
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'text-success' : 'text-danger';
  };

  const getVerificationColor = (verified: boolean) => {
    return verified ? 'text-success' : 'text-danger';
  };

  return (
    <div className="flex flex-col h-full w-full mx-auto px-2">
      {/* Header */}
      <div className="flex flex-row justify-between items-start mb-6 border-b border-border pb-4 sticky top-0 bh-16 z-10">
        <div className="flex flex-col">
          <h2 className="text-2xl text-text font-bold">User Account Details</h2>
          <h4 className="text-md text-text-light mt-1">
            Complete information about user account and profile
          </h4>
        </div>
        <button
          onClick={() => modalRef!.dismiss()}
          className="w-8 h-8 rounded-full text-text-light transition-colors flex items-center justify-center"
          aria-label="Close modal"
        >
          <i className="ri-close-line text-xl"></i>
        </button>
      </div>

      {/* User Overview */}
      <div className="bg-primary-5 border border-primary-20 rounded-sm p-4 mb-6">
        <div className="flex items-start">
          <i className="ri-user-line text-primary text-lg mr-3 mt-0.5"></i>
          <div>
            <p className="font-medium text-primary mb-1">Account Overview</p>
            <ul className="text-sm text-primary list-disc list-inside space-y-1">
              <li>View personal information and account status</li>
              <li>Check verification status and user permissions</li>
              <li>Monitor account activity and security settings</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pb-4">
        {/* User Profile Section */}
        <div className="border border-border rounded-sm p-4">
          <div className="flex items-center mb-4">
            <i className="ri-profile-line text-primary text-lg mr-2"></i>
            <h3 className="font-semibold text-text">Personal Information</h3>
          </div>
          
          <div className="flex items-start gap-4 mb-4">
            <img 
              src={userData?.image_url || ''} 
              alt={`${userData.first_name} ${userData.last_name}`}
              className="w-16 h-16 rounded-full object-cover border border-border"
            />
            <div>
              <h4 className="font-bold text-lg text-text">
                {userData.first_name} {userData.last_name}
              </h4>
              <p className="text-text-light">{userData.email}</p>
             
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-text-light mb-1">Phone Number</p>
              <p className="font-medium text-text">{`${'+233'}${userData.phone_number}` || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm text-text-light mb-1">Gender</p>
              <p className="font-medium text-text capitalize">
                {userData.gender || 'Not specified'}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-light mb-1">Username</p>
              <p className="font-medium text-text">{userData?.username || 'Not set'}</p>
            </div>
            {/* <div>
              <p className="text-sm text-text-light mb-1">Referral Code</p>
              <p className="font-medium text-text">{userData.referral_code || 'None'}</p>
            </div> */}
          </div>
        </div>

        {/* Account Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-background rounded-sm p-4">
            <div className="flex items-center mb-2">
              <i className="ri-shield-check-line text-text-light mr-2"></i>
              <h3 className="font-semibold text-text">Account Status</h3>
            </div>
            <p className={`text-lg font-bold ${getStatusColor(!userData.deactivated)}`}>
              {!userData.deactivated ? 'Active' : 'Inactive'}
            </p>
            <p className="text-sm text-text-light mt-1">
              {!userData.deactivated ? 'Account is active and accessible' : 'Account is deactivated'}
            </p>
          </div>

          <div className="bg-background rounded-sm p-4">
            <div className="flex items-center mb-2">
              <i className="ri-verified-badge-line text-text-light mr-2"></i>
              <h3 className="font-semibold text-text">Verification</h3>
            </div>
            <p className={`text-lg font-bold ${getVerificationColor(userData.verified)}`}>
              {userData.verified ? 'Verified' : 'Pending'}
            </p>
            <p className="text-sm text-text-light mt-1">
              {userData.verified ? 'Email verification completed' : 'Awaiting email verification'}
            </p>
          </div>
        </div>

        {/* Account Details */}
        <div className="border border-border rounded-sm p-4">
          <div className="flex items-center mb-4">
            <i className="ri-settings-line text-primary text-lg mr-2"></i>
            <h3 className="font-semibold text-text">Account Details</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-text-light mb-1">Role</p>
              <p className="font-medium text-text">{formatUserType(userData.role || '')}</p>
            </div>
           
            <div>
              <p className="text-sm text-text-light mb-1">User Since</p>
              <p className="font-medium text-text">{dateUtils.formatDate(userData.created_at, DateFormatEnums.DATE_TIME_SHORT)}</p>
            </div>
          </div>
        </div>

    
      </div>

      {/* Footer */}
      <div className="flex justify-end items-center pt-4 h-14 border-t border-border mt-auto sticky bottom-0 z-10 bg-card">
        <Button
          onClick={() => modalRef!.dismiss()}
          variant="ghost"
        >
          Close
        </Button>
      </div>
    </div>
  );
};