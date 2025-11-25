import { API, standardResponse } from '../utils/middleware';
export interface Search {
  page?: number;
  size?: number;
  actionKey?: string;
  functionKey?: string;
  fromDateStr?: string;
  toDateStr?: string;
  userId?: number | null;
}

export async function searchLogs(dataSearch: Search) {
  const page = dataSearch.page ?? 0;
  const size = dataSearch.size ?? 10;
  let url = `api/log/list?page=${page}&size=${size}`;

  const params = [
    dataSearch.actionKey
      ? `actionKey=${encodeURIComponent(dataSearch.actionKey)}`
      : '',
    dataSearch.functionKey
      ? `functionKey=${encodeURIComponent(dataSearch.functionKey)}`
      : '',
    dataSearch.fromDateStr
      ? `fromDateStr=${encodeURIComponent(dataSearch.fromDateStr)}`
      : '',
    dataSearch.toDateStr
      ? `toDateStr=${encodeURIComponent(dataSearch.toDateStr)}`
      : '',
    dataSearch.userId !== undefined && dataSearch.userId !== null
      ? `userId=${dataSearch.userId}`
      : '',
  ]
    .filter(Boolean)
    .join('&');

  if (params) url += `&${params}`;

  try {
    const response = await API.get(url);
    return response.data;
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export async function getListFunction() {
  let url = `api/log/getListFunction`;
  try {
    const response = await API.get(url);
    return response.data;
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export async function getListAction() {
  let url = `api/log/getListAction`;
  try {
    const response = await API.get(url);
    return response.data;
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export async function getAllUser() {
  let url = `api/users/getAllUser`;
  try {
    const response = await API.get(url);
    return response.data;
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}
