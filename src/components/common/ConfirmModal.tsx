import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useModal } from '../../core/hooks/useModal';
import Button from './Button';

const ConfirmModal: React.FC = () => {
  const { modalData, modalRef } = useModal();
  const { title, message, confirmText = 'Confirm', cancelText = 'Cancel',variant = 'danger',  } = modalData || {};

  const variantConfig = {
    danger: {
      icon: AlertTriangle,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      buttonVariant: 'danger',
    },
    warning: {
      icon: AlertTriangle,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      buttonVariant: 'info',
    },
    info: {
      icon: AlertTriangle,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      buttonVariant: 'primary',
    },
  } as const;

  const config = variantConfig[variant as keyof typeof variantConfig];
  const Icon = config.icon;

  const handleConfirm = () => {
    modalRef?.close({ confirmed: true });
  };

  const handleCancel = () => {
    modalRef?.close({ confirmed: false });
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <div className="flex justify-center mb-4">
        <div className={`p-4 rounded-full ${config.bg}`}>
          <Icon className={`w-8 h-8 ${config.color}`} />
        </div>
      </div>

      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-text">{title}</h2>
        <p className="text-text-light mt-2">{message}</p>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          onClick={handleCancel}
          variant="ghost"
          className="flex-1"
        >
          {cancelText}
        </Button>
        <Button
          type="button"
          onClick={handleConfirm}
          variant={config.buttonVariant}
          className="flex-1"
        >
          {confirmText}
        </Button>
      </div>
    </div>
  );
};

export default ConfirmModal;