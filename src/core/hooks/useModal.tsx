import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useMemo,
  ComponentType,
} from 'react';
import ReactDOM from 'react-dom';

export type ModalOptions<TData = any> = {
  data?: TData;
  backdropClose?: boolean;
  size?: string;
  side?: 'center' | 'right' | 'left';
};

type ModalState<TProps = any> = {
  component: ComponentType<TProps>;
  options?: ModalOptions;
  modalRef: ModalRef;
  data?: any;
};

const ModalInternalContext = createContext<ModalState | null>(null);

const ModalServiceContext = createContext<
  ((component: ComponentType<any>, options?: ModalOptions) => Promise<any>) | null
>(null);

export class ModalRef {
  private _resolver!: (result: any) => void;
  constructor(private _onClose: () => void) {}

  close = (result?: any) => {
    this._resolver(result);
    this._onClose();
  };

  dismiss = () => {
    this._resolver(undefined);
    this._onClose();
  };

  get result(): Promise<any> {
    return new Promise((res) => (this._resolver = res));
  }
}

interface ModalServiceOutput {
  openModal: <TProps = any>(component: ComponentType<TProps>, options?: ModalOptions) => Promise<any>;
}

export interface ModalInternalOutput<TData = any> {
  modalRef: ModalRef;
  modalData: TData;
}

export function useModal(): ModalServiceOutput & Partial<ModalInternalOutput> {
  const openModal = useContext(ModalServiceContext);

  const internalCtx = useContext(ModalInternalContext);

  if (internalCtx) {
    return {
      openModal: () => {
        throw new Error("Cannot call openModal from within a modal component. Use the outer context.");
      },
      modalRef: internalCtx.modalRef,
      modalData: internalCtx.data,
    };
  }
  
  if (!openModal) {
    throw new Error('useModal must be used within a ModalProvider.');
  }

  return {
    openModal,
  };
}

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [modal, setModal] = useState<ModalState | null>(null);

  const lockScroll = () => {
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollBarWidth}px`;
  };

  const unlockScroll = () => {
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  };

  const openModal = useMemo(() => async (Component: ComponentType<any>, options?: ModalOptions): Promise<any> => {
    lockScroll();

    const modalRef = new ModalRef(() => {
      setModal(null);
      unlockScroll();
    });

    setModal({ component: Component, options, modalRef, data: options?.data });

    return modalRef.result;
  }, []);

  return (
    <ModalServiceContext.Provider value={openModal}>
      {children}
      {modal && <ModalRenderer {...modal} />}
    </ModalServiceContext.Provider>
  );
};

const ModalRenderer: React.FC<ModalState> = ({ component: Component, options, modalRef, data }) => {
  
  const getModalStyles = () => {
    switch (options?.side) {
      case 'right':
        return {
          container: 'justify-end items-stretch',
          modal: 'animate-slide-in-right rounded-l-xl ml-auto', 
          padding: 'p-0'
        };
      case 'left':
        return {
          container: 'justify-start items-stretch', 
          modal: 'animate-slide-in-left rounded-r-xl mr-auto',
          padding: 'p-0'
        };
      case 'center':
        return {
          container: 'justify-center items-center',
          modal: 'animate-scale-in rounded-lg',
          padding: 'p-4'
        };
      default:
        return {
          container: 'justify-center items-start pt-20',
          modal: 'animate-scale-in rounded-lg',
          padding: 'p-4'
        };
    }
  };

  const modalStyles = getModalStyles();

  const overlay = (
    <div
      className={`modal-overlay fixed inset-0 bg-black bg-opacity-60 z-[1002] flex ${modalStyles.container} ${modalStyles.padding}`}
      onClick={(e) => {
        if (e.target === e.currentTarget && options?.backdropClose !== false) {
          modalRef.dismiss();
        }
      }}
    >
      <div 
        className={`${getSizeClass(options?.size, options?.side)} ${modalStyles.modal} card shadow-xl isolate-parts`}
        onClick={(e) => e.stopPropagation()}
      >
        <ModalInternalContext.Provider value={{ modalRef, data, component: Component, options }}>
          <Component /> 
        </ModalInternalContext.Provider>
      </div>
    </div>
  );

  return ReactDOM.createPortal(overlay, document.body);
};

const getSizeClass = (size?: string, side?: 'center' | 'right' | 'left') => {
  if (side === 'right' || side === 'left') {
    switch (size) {
       case 'xs':
      return 'w-full max-w-xs';
    case 'sm':
      return 'w-full max-w-sm';
    case 'md':
      return 'w-full max-w-md';
    case 'lg':
      return 'w-full max-w-lg';
    case 'xl':
      return 'w-full max-w-xl';
    case '2xl':
      return 'w-full max-w-2xl';
    case '3xl':
      return 'w-full max-w-3xl';
    case '4xl':
      return 'w-full max-w-4xl';
    case '5xl':
      return 'w-full max-w-5xl';
    case '6xl':
      return 'w-full max-w-6xl';
    case '7xl':
      return 'w-full max-w-7xl';
    case 'full':
      return 'w-full max-w-full mx-4';
    default:
      return 'w-full max-w-md';
    }
  }

  switch (size) {
    case 'xs':
      return 'w-full max-w-xs';
    case 'sm':
      return 'w-full max-w-sm';
    case 'md':
      return 'w-full max-w-md';
    case 'lg':
      return 'w-full max-w-lg';
    case 'xl':
      return 'w-full max-w-xl';
    case '2xl':
      return 'w-full max-w-2xl';
    case '3xl':
      return 'w-full max-w-3xl';
    case '4xl':
      return 'w-full max-w-4xl';
    case '5xl':
      return 'w-full max-w-5xl';
    case '6xl':
      return 'w-full max-w-6xl';
    case '7xl':
      return 'w-full max-w-7xl';
    case 'full':
      return 'w-full max-w-full mx-4';
    default:
      return 'w-full max-w-md';
  }
};