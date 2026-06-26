// services/entityService.ts
import { IResponse, IEntityQueryParams, ICreateEntityData, IUpdateEntityData } from '../types';
import api from './api';

const entityService = {
  getEntities:       (params: IEntityQueryParams = {}): Promise<IResponse> => api.get('/entities', { params }),
  getByUuid:         (uuid: string): Promise<IResponse> => api.get(`/entities/${uuid}`),
  getByEmail:        (email: string): Promise<IResponse> => api.get(`/entities/email/${encodeURIComponent(email)}`),
  getStats:          (): Promise<IResponse> => api.get('/entities/stats'),
  getUsers:          (uuid: string, params: { page?: number; limit?: number } = {}): Promise<IResponse> =>
                       api.get(`/entities/${uuid}/users`, { params }),
  create:            (data: ICreateEntityData): Promise<IResponse> => api.post('/entities', data),
  update:            (uuid: string, data: IUpdateEntityData): Promise<IResponse> => api.put(`/entities/${uuid}`, data),
  toggleActive:      (uuid: string, is_active: boolean): Promise<IResponse> => api.patch(`/entities/${uuid}/active`, { is_active }),
  delete:            (uuid: string): Promise<IResponse> => api.delete(`/entities/${uuid}`),
  permanentDelete:   (uuid: string): Promise<IResponse> => api.delete(`/entities/${uuid}/permanent`),
  bulkCreate:        (entities: ICreateEntityData[]): Promise<IResponse[]> =>
                       Promise.all(entities.map(data => entityService.create(data))),
  bulkUpdate:        (updates: { uuid: string; data: IUpdateEntityData }[]): Promise<IResponse[]> =>
                       Promise.all(updates.map(({ uuid, data }) => entityService.update(uuid, data))),
  search:            (search: string): Promise<IResponse> => api.get('/entities', { params: { search, limit: 20 } }),

  // Helper: returns label/value pairs for dropdowns
  getOptions: async (filterActive = true): Promise<{ label: string; value: string }[]> => {
    const res = await entityService.getEntities({ limit: 100, ...(filterActive && { is_active: true }) });
    return (res.results?.entities || []).map((e: any) => ({ label: e.name, value: e.uuid }));
  },
};

export default entityService;