import { useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "../../components/common";
import { useModal } from "../../core/hooks/useModal";
import { toast } from "sonner";

const DeleteExpenseModal = () => {
  const { modalData, modalRef } = useModal();
  const { expense } = modalData?.data || { expense: null };
  const [isDeleting, setIsDeleting] = useState(false);

  if (!expense) {
    return (
      <div className="p-6 text-center">
        <p className="text-text-light">No expense data found</p>
      </div>
    );
  }

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      modalRef?.close({ success: true });
      toast.success("Success", { description: "Expense deleted successfully" });
    } catch (error: any) {
      toast.error("Error", { description: error.message || "Failed to delete expense" });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    modalRef?.close({ success: false });
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      {/* Icon */}
      <div className="flex justify-center mb-4">
        <div className="p-4 bg-rose-50 rounded-full">
          <AlertTriangle className="w-8 h-8 text-rose-600" />
        </div>
      </div>

      {/* Content */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-text">Delete Expense</h2>
        <p className="text-text-light mt-2">
          Are you sure you want to delete <strong className="text-text">"{expense.title}"</strong>?
        </p>
        <p className="text-sm text-text-light mt-1">
          Amount: <strong>{`GHC ${expense.amount.toFixed(2)}`}</strong>
        </p>
        <p className="text-xs text-text-light mt-3">
          This action cannot be undone. This will permanently delete the expense
          and all associated data.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          type="button"
          onClick={handleClose}
          variant="ghost"
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleDelete}
          variant="danger"
          disabled={isDeleting}
          className="flex-1"
        >
          {isDeleting ? (
            <div className="w-5 h-5 border-2 border-border border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Trash2 className="w-4 h-4" />
              Delete
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default DeleteExpenseModal;