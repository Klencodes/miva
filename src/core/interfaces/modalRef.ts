import React from 'react';

export interface ModalConfig<D = any> {
  data?: D;
  afterClose?: (result?: any) => void;
}

export interface ModalOptions<TData = any> {
  data?: TData;
  backdropClose?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
  centered?: boolean;
}

export type ModalComponentType<TData = any> = React.FC<{
  modalRef: ModalRef;
  data: TData;
}>;

export interface ActiveModal {
  id: number;
  Component: ModalComponentType<any>;
  options: ModalOptions;
  modalRef: ModalRef;
  resolve: (result?: any) => void;
}

export class ModalRef {
  private _isClosed = false;
  private _onCloseCallbacks: ((result?: any) => void)[] = [];
  
  private _closeModalHandler: (id: number, result?: any) => void = () => {};
  private _id: number;

  constructor(id: number) {
    this._id = id;
  }
  
  _setCloseHandler(handler: (id: number, result?: any) => void) {
      this._closeModalHandler = handler;
  }

  close(result?: any): void {
    if (this._isClosed) return;
    this._isClosed = true;
    this._closeModalHandler(this._id, result);
    this._onCloseCallbacks.forEach(cb => cb(result));
  }

  dismiss(): void {
    if (this._isClosed) return;
    this._isClosed = true;
    this._closeModalHandler(this._id, undefined);
    this._onCloseCallbacks.forEach(cb => cb(undefined));
  }
  
  afterClosed(callback: (result?: any) => void): void {
    if (this._isClosed) {
        callback(undefined);
    } else {
        this._onCloseCallbacks.push(callback);
    }
  }
}

export interface IModalServiceContext {
  open: <TComponent extends ModalComponentType>(
    Component: TComponent,
    options?: ModalOptions<React.ComponentProps<TComponent>['data']>
  ) => Promise<React.ComponentProps<TComponent>['data'] | undefined>;
  closeAll: () => void;
}

export const ModalServiceContext = React.createContext<IModalServiceContext | undefined>(undefined);