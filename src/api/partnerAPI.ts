import dayjs from 'dayjs';
import { API, standardResponse } from '../utils/middleware';

// ==== Interface định nghĩa dữ liệu chung ====

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface PaginationRequest {
  quickSearch?: string;
  page?: number;
  size?: number;
}

export interface Partner {
  id: string;
  partnerName?: string;
  partnerCode?: string;
  version: number;
  [key: string]: any;
}

export interface User {
  id?: number | string;
  username?: string;
  password?: string;
  fullName?: string;
  enabled?: boolean;
  role?: string;
  [key: string]: any;
}

export interface SearchUserParams {
  userID?: string;
  fullName?: string;
  enabled?: boolean;
  role?: string;
}

// ==== Các API function ====

export async function search(dataSearch: Record<string, any>) {
  try {
    const url = 'api/partner/search';
    const response = await API.post(url, dataSearch);
    return response.data;
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export async function GetListPartnerForCate({
  quickSearch = '',
  page = 0,
  size = 10,
}: PaginationRequest): Promise<ApiResponse> {
  try {
    const url = 'api/partner/getListPartnerForCate';
    const response = await API.get(url, {
      params: { quickSearch, page, size },
    });
    return response.data;
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export async function loginToGetToken(
  username: string,
  password: string
): Promise<string | ApiResponse> {
  const url = '/api/auth/login';
  const params = { username, password };
  try {
    const response = await API.post(url, params);
    return response.data.token;
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export async function getListUser(): Promise<ApiResponse> {
  const url = '/api/user/listAll';
  try {
    const response = await API.get(url);
    return response.data;
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export async function AddUserApi(userData: User): Promise<ApiResponse> {
  const url = '/api/user/add';
  if (!userData.startDate) userData.startDate = dayjs();
  try {
    const response = await API.post(url, userData);
    return response.data;
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export async function CreatePartner(userData: Partner) {
  const url = '/api/partner/create';
  try {
    const response = await API.post(url, userData);
    return response.data;
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export async function SyncUser(): Promise<ApiResponse> {
  const url = '/api/user/sync';
  try {
    const response = await API.get(url);
    return response.data;
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export async function EditPartnerApi(userData: Partner): Promise<ApiResponse> {
  const url = '/api/partner/update';
  try {
    const response = await API.post(url, userData);
    return response.data;
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export async function EditSelfUserApi(userData: User): Promise<ApiResponse> {
  const url = '/api/user/updateSelf';
  try {
    const response = await API.post(url, userData);
    return response.data;
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export async function LockUnlockuser(
  userData: Record<string, any>
): Promise<ApiResponse> {
  const url = '/api/user/lockUnlockUser';
  try {
    const response = await API.post(url, userData);
    return response.data;
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export const deletePartner = async (id: string, version: number) => {
  const url = `api/partner/delete?id=${id}&&version=${version}`;
  try {
    const response = await API.get(url);
    return standardResponse(true, response);
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
};

export const lockPartner = async (id: string, version: number) => {
  const url = `api/partner/lock?partner=${id}&&version=${version}`;
  try {
    const response = await API.get(url);
    return standardResponse(true, response);
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
};

export async function resetPassword(username: string) {
  const url = `api/user/resetPassword`;
  return API.post(url, username)
    .then((res) => standardResponse(true, res))
    .catch((err: any) => standardResponse(false, err.response?.data));
}

export async function resetTwoFA(username: string) {
  const url = `api/user/resetTwoFA`;
  return API.post(url, username)
    .then((res) => standardResponse(true, res))
    .catch((err: any) => standardResponse(false, err.response?.data));
}

export async function SearchDataUser(dataSearch: SearchUserParams) {
  let url = 'api/user/list?';
  const { userID, fullName, enabled, role } = dataSearch;

  if (userID) url += `userID=${userID}&`;
  if (fullName) url += `fullName=${fullName}&`;
  if (enabled !== undefined) url += `enabled=${enabled}&`;
  if (role) url += `role=${role}&`;

  return API.get(url)
    .then((res) => res.data)
    .catch((err: any) => standardResponse(false, err.response?.data));
}

export async function getListRole(): Promise<ApiResponse> {
  const url = `api/role/list`;
  return API.get(url)
    .then((res) => res.data)
    .catch((err: any) => standardResponse(false, err.response?.data));
}

export async function getRoleByUserId(
  id: number | string
): Promise<ApiResponse> {
  const url = `api/user/getRoleByUserId?id=${id}`;
  return API.post(url)
    .then((res) => res.data)
    .catch((err: any) => standardResponse(false, err.response?.data));
}

export async function updateRoleUser(item: Record<string, any>) {
  const url = `api/user/updateRoles`;
  return API.post(url, item)
    .then((res) => standardResponse(true, res))
    .catch((err: any) => standardResponse(false, err.response?.data));
}

export async function getUserInfo(id: number | string): Promise<ApiResponse> {
  const url = `/api/user/getUserInfo?id=${id}`;
  return API.get(url)
    .then((res) => res.data)
    .catch((err: any) => standardResponse(false, err.response?.data));
}

export async function getUserByUserName(
  username: string
): Promise<ApiResponse> {
  const url = `/api/user/getByUsername?username=${username}`;
  return API.get(url)
    .then((res) => res.data)
    .catch((err: any) => standardResponse(false, err.response?.data));
}

export async function GetAllActivePartners(): Promise<ApiResponse> {
  const url = 'api/partner/list/full';
  try {
    const response = await API.post(url);
    return response.data;
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export async function partnerInfo(): Promise<ApiResponse> {
  const url = `api/partner/partnerDetail`;
  return API.get(url)
    .then((res) => res.data)
    .catch((err: any) => standardResponse(false, err.response?.data));
}

export async function UpdatePartner(userData: Partner): Promise<ApiResponse> {
  const url = '/api/partner/update';
  if (!userData.startDate) userData.startDate = dayjs();
  if (!userData.endDate) userData.endDate = dayjs();

  return API.post(url, userData)
    .then((res) => res.data)
    .catch((err: any) => standardResponse(false, err.response?.data));
}

export async function renewTOTP(
  payload: string,
  permissionIds: string
): Promise<ApiResponse> {
  const url = `api/partner/renewTOTP?renewTOTP=${encodeURIComponent(
    payload
  )}&permissionIds=${encodeURIComponent(permissionIds)}`;
  return API.get(url)
    .then((res) => res.data)
    .catch((err: any) => standardResponse(false, err.response?.data));
}

export async function validateAuthenticator(
  data: Record<string, any>
): Promise<ApiResponse> {
  const url = '/api/partner/validateAuthenticator';
  return API.post(url, data)
    .then((res) => res.data)
    .catch((err: any) => standardResponse(false, err.response?.data));
}

export async function checkAccessPartner(): Promise<ApiResponse> {
  const url = '/api/partner/checkAccessPartner';
  return API.get(url)
    .then((res) => res.data)
    .catch((err: any) => standardResponse(false, err.response?.data));
}

export async function stopAccessPartner(): Promise<ApiResponse> {
  const url = '/api/partner/stopAccessPartner';
  return API.get(url)
    .then((res) => res.data)
    .catch((err: any) => standardResponse(false, err.response?.data));
}

export async function deleteAccessPartner(): Promise<ApiResponse> {
  const url = '/api/partner/deleteAccessPartner';
  return API.get(url)
    .then((res) => res.data)
    .catch((err: any) => standardResponse(false, err.response?.data));
}

export async function cloneCategories(request: Record<string, any>) {
  const url = '/api/partner/cloneCategories';
  return API.post(url, request)
    .then((res) => standardResponse(true, res))
    .catch((err: any) => standardResponse(false, err.response?.data));
}

export async function generateCode(): Promise<ApiResponse> {
  const url = '/api/partner/generateCode';
  return API.get(url)
    .then((res) => res.data)
    .catch((err: any) => standardResponse(false, err.response?.data));
}

export async function existsUserAdminByPartnerIdTemp(): Promise<ApiResponse> {
  const url = '/api/partner/existsUserAdminByPartnerIdTemp';
  return API.get(url)
    .then((res) => res.data)
    .catch((err: any) => standardResponse(false, err.response?.data));
}

export async function LogDetailPartner(id: String) {
  let url = `api/partner/LogDetailPartner?id=${id}`;

  try {
    const response = await API.get(url);
    return response.data;
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export async function checkDeleteMultiPartner(
  items: {
    id: string;
    name: string | undefined;
    code: string | undefined;
    version: number;
  }[]
) {
  const url = `/api/partner/checkDeleteMulti`;

  try {
    const response = await API.post(url, items);
    return standardResponse(true, response);
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export async function deleteMultiPartner(
  items: { id: string; version: number }[]
) {
  const url = `/api/partner/deleteMulti`;

  try {
    const response = await API.post(url, items);
    return standardResponse(true, response);
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}
