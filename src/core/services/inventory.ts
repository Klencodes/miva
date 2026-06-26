// services/inventoryService.ts
import { IResponse, InventoryItem, InventoryFilterParams } from '../types';
import api from './api';

type StockAdjustment = { quantity: number; type?: 'add' | 'subtract' | 'set'; reason?: string };

const inventoryService = {
  getItems:          (params: InventoryFilterParams = {}): Promise<IResponse> => api.get('/inventory', { params }),
  getByUuid:         (uuid: string): Promise<IResponse> => api.get(`/inventory/${uuid}`),
  getByPartNumber:   (partNumber: string): Promise<IResponse> => api.get(`/inventory/part-number/${encodeURIComponent(partNumber)}`),
  getLowStock:       (page = 1, limit = 10): Promise<IResponse> => api.get('/inventory/low-stock', { params: { page, limit } }),
  getStats:          (): Promise<IResponse> => api.get('/inventory/stats'),
  create:            (data: Partial<InventoryItem>): Promise<IResponse> => api.post('/inventory', data),
  bulkCreate:        (items: Partial<InventoryItem>[]): Promise<IResponse> => api.post('/inventory/bulk', { items }),
  update:            (uuid: string, data: Partial<InventoryItem>): Promise<IResponse> => api.put(`/inventory/${uuid}`, data),
  adjustStock:       (uuid: string, adjustment: StockAdjustment): Promise<IResponse> => api.patch(`/inventory/${uuid}/stock`, adjustment),
  addStock:          (uuid: string, quantity: number, reason = 'Stock added'): Promise<IResponse> =>
                       inventoryService.adjustStock(uuid, { quantity, type: 'add', reason }),
  subtractStock:     (uuid: string, quantity: number, reason = 'Stock removed'): Promise<IResponse> =>
                       inventoryService.adjustStock(uuid, { quantity, type: 'subtract', reason }),
  setStock:          (uuid: string, quantity: number, reason = 'Stock manually set'): Promise<IResponse> =>
                       inventoryService.adjustStock(uuid, { quantity, type: 'set', reason }),
  delete:            (uuid: string): Promise<IResponse> => api.del(`/inventory/${uuid}`),
  search:            (search: string): Promise<IResponse> => api.get('/inventory', { params: { search, limit: 20 } }),
  getByType:         (type: string, page = 1, limit = 10): Promise<IResponse> => api.get('/inventory', { params: { type, page, limit } }),
  getBySupplier:     (supplier: string, page = 1, limit = 10): Promise<IResponse> => api.get('/inventory', { params: { supplier, page, limit } }),
  checkPartNumber:   async (partNumber: string): Promise<boolean> => {
    try { const r = await inventoryService.getByPartNumber(partNumber); return r.success && !!r.results; }
    catch { return false; }
  },
  getValue: async (): Promise<{ total_value: number; total_price: number; total_items: number; total_quantity: number }> => {
    const empty = { total_value: 0, total_price: 0, total_items: 0, total_quantity: 0 };
    try {
      const r = await inventoryService.getStats();
      return r.success && r.results?.totals ? { ...empty, ...r.results.totals } : empty;
    } catch { return empty; }
  },
  export: (): Promise<Blob> => api.get('/inventory/export', { responseType: 'blob' }),
  download: async (filename = 'inventory-export.csv'): Promise<void> => {
    const blob = await inventoryService.export();
    const url = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'), { href: url, download: filename }).click();
    URL.revokeObjectURL(url);
  },
};

export default inventoryService;