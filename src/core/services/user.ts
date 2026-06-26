// services/userService.ts
import { IResponse, IUserQueryParams, ICreateUserData, IUpdateUserData, IUserEntityAssignment } from '../types';
import api from './api';

const userService = {
  getUsers:           (params: IUserQueryParams = {}): Promise<IResponse> => api.get('/users', { params }),
  getByUuid:          (uuid: string): Promise<IResponse> => api.get(`/users/${uuid}`),
  getMyEntities:      (): Promise<IResponse> => api.get('/users/me/entities'),
  getMyPermissions:   (): Promise<IResponse> => api.get('/users/me/permissions'),
  create:             (data: ICreateUserData): Promise<IResponse> => api.post('/users', data),
  update:             (uuid: string, data: IUpdateUserData): Promise<IResponse> => api.put(`/users/${uuid}`, data),
  toggleActive:       (uuid: string, is_active: boolean): Promise<IResponse> => api.patch(`/users/${uuid}/active`, { is_active }),
  delete:             (uuid: string): Promise<IResponse> => api.del(`/users/${uuid}`),
  permanentDelete:    (uuid: string): Promise<IResponse> => api.del(`/users/${uuid}/permanent`),
  updatePassword:     (uuid: string, new_password: string, confirm_password: string): Promise<IResponse> =>
                        api.patch(`/users/${uuid}/password`, { new_password, confirm_password }),
  assignEntity:       (uuid: string, assignment: IUserEntityAssignment): Promise<IResponse> =>
                        api.post(`/users/${uuid}/entities`, assignment),
  removeEntity:       (uuid: string, entityId: string): Promise<IResponse> =>
                        api.del(`/users/${uuid}/entities/${entityId}`),
  setPrimaryEntity:   (uuid: string, entityId: string): Promise<IResponse> =>
                        api.patch(`/users/${uuid}/entities/${entityId}/primary`, {}),
  getUsersByEntity:   (entityId: string, params: { page?: number; limit?: number } = {}): Promise<IResponse> =>
                        api.get(`/entities/${entityId}/users`, { params }),
  bulkAssignEntities: (assignments: { userUuid: string; entityId: string; role?: string; isPrimary?: boolean }[]): Promise<IResponse[]> =>
                        Promise.all(assignments.map(({ userUuid, entityId, role, isPrimary }) =>
                          userService.assignEntity(userUuid, { entity_id: entityId, role: role as any, is_primary: isPrimary })
                        )),
};

export default userService;