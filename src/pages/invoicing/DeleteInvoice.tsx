// DeleteModal.tsx
import React, { useState, useCallback } from 'react';
import { Trash2, AlertCircle, X } from 'lucide-react';
import { Button } from '../../components/common';
import { useModal } from '../../core/hooks/useModal';
import { toast } from 'sonner';

const DeleteModal: React.FC = () => {
  const { modalRef, modalData } = useModal();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get invoice data from modalData
  const invoice = modalData?.invoice || modalData?.data?.invoice;

  const handleDelete = useCallback(async () => {
    if (!invoice?.uuid) {
      setError('Invoice ID is missing');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Dynamic import to avoid circular dependencies
      const { default: InvoiceService } = await import('../../core/services/invoice');
      const response = await InvoiceService.delete(invoice.uuid);

      if (response.success) {
        toast.success('Success', {
          description: `Invoice ${invoice.number} deleted successfully`
        });
        
        // Close modal with success result
        modalRef?.close({ 
          success: true, 
          data: { invoice } 
        });
      } else {
        throw new Error(response.message || 'Failed to delete invoice');
      }
    } catch (error: any) {
      console.error('Error deleting invoice:', error);
      const errorMessage = error.message || 'Failed to delete invoice';
      setError(errorMessage);
      toast.error('Error', {
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  }, [invoice, modalRef]);

  const handleClose = useCallback(() => {
    modalRef?.dismiss();
  }, [modalRef]);

  if (!invoice) {
    return (
      <div className="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-danger mx-auto mb-3" />
          <p className="text-text-light">Invoice not found</p>
          <Button onClick={handleClose} className="mt-4">
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-danger/10 rounded-full">
            <Trash2 className="w-5 h-5 text-danger" />
          </div>
          <h3 className="text-lg font-semibold text-text">Delete Invoice</h3>
        </div>
        <button
          onClick={handleClose}
          className="p-1 hover:bg-background rounded-lg transition-colors"
          disabled={loading}
          aria-label="Close modal"
        >
          <X className="w-4 h-4 text-text-light" />
        </button>
      </div>

      {/* Content */}
      <div className="space-y-4">
        <p className="text-text-light text-sm leading-relaxed">
          Are you sure you want to delete invoice <span className="font-semibold text-text">{invoice.number}</span>?
          This action cannot be undone.
        </p>

        {/* Error Message */}
        {error && (
          <div className="bg-danger/10 border border-danger/20 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
            <p className="text-xs text-danger">{error}</p>
          </div>
        )}

        {/* Warning Box */}
        <div className="bg-danger/5 border border-danger/20 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-danger flex-shrink-0 mt-0.5" />
          <p className="text-xs text-danger">
            This will permanently remove this invoice and all associated data.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-2">
          <Button
            onClick={handleClose}
            variant="ghost"
            className="px-4 py-2 text-sm"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            variant="danger"
            className="px-4 py-2 text-sm flex items-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            {loading ? 'Deleting...' : 'Delete Invoice'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;