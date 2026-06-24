import { Button } from "../../components/common";
import { useStore } from "../../core/contexts/StoreProvider";
import { usePageTitle } from "../../core/hooks/usePageTitle";

export default function AccessDenied() {
    usePageTitle("Access Denied");
    const { logout } = useStore()
   return (
    <div className="w-full max-w-[500px] mx-auto">
      <div className="relative overflow-hidden bg-card border border-border px-5 py-9">
        {/* Top gradient bar */}
        <div
          className="absolute inset-x-0 top-0 h-[3px]"
          style={{
            background: "linear-gradient(90deg, var(--primary-color) 0%, #818CF8 100%)",
          }}
          aria-hidden="true"
        />

        {/* Header */}
        <div className="flex flex-col items-center gap-2.5 mb-7">
          <img src="/logo.png" width={250} height={90} alt="" />
        </div>
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text">Access Denied</h1>
          <p className="text-text-light text-sm mt-2">
            You have not yet been assigned an entity, please contact your administrator.
          </p>
        </div>

        {/* Card */}
          <div className="p-6 flex justify-center items-center">
            <Button onClick={()=>logout()} variant="danger" fullWidth>
                Logout
            </Button>
          </div>

        <p className="mt-5 text-center text-[11.5px] text-text-light leading-relaxed">
          MIVA Prestige Ent - Hydraulic Management System
        </p>
      </div>
    </div>
  );
}
