import { useModal } from "../../core/hooks/useModal";
import Button from "./Button";


const ConfirmModal = () => {
  const { modalData, modalRef } = useModal();
  return (
    <div className="flex flex-col h-full">
       <div className="flex flex-row justify-between items-start border-b border-border pb-4 sticky top-0 z-10 bg-card">
        <div className="flex flex-col">
          <h2 className="text-2xl text-text font-bold">
            {modalData?.title}
          </h2>
         
        </div>
        <button
          onClick={() => modalRef!.dismiss()}
          className="w-8 h-8 rounded-full text-text-light hover:bg-background-50 transition-colors flex items-center justify-center"
          aria-label="Close modal"
        >
          <i className="ri-close-line text-xl"></i>
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 space-y-6 overflow-y-auto p-6">
        <p className="text-text-light leading-relaxed">
          {modalData?.description || "Are you sure to proceed with this?"}
        </p>
    </div>

      {/* Footer */}
      <div className="flex justify-between items-center pt-4 border-t border-border">
        {modalData?.actions?.confirm && (
          <Button
            onClick={() => modalRef!.close({ action: "confirmed" })}
          >
            {modalData?.actions?.confirm || "Confirm"}
          </Button>
        )}
        {modalData?.actions?.cancel && (
          <Button
            variant="danger"
            onClick={() => modalRef!.close({ action: "canceled" })}
            className="ml-5"
          >
            {modalData?.actions?.cancel}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ConfirmModal;