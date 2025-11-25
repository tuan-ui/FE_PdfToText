import { API, standardResponse } from '../utils/middleware';

export async function saveContentDnD(id: String, content: any) {
  const url = `/api/DnD/saveContent`;
  // send a JSON body with id and content to match backend expectations
  return API.post(url, { id, content })
    .then((response) => {
      if (response.data.status === 200 || response.data.status === 400) {
        return response.data;
      }
      return null;
    })
    .catch((error) => standardResponse(false, error.response?.data));
}

export async function publishSchema(id: string, content: any) {
  const url = `/api/DnD/publishSchema`;
  // include id so backend can persist under that id
  return API.post(url, { id, content })
    .then((response) => {
      return response.data;
    })
    .catch((error) => standardResponse(false, error.response?.data));
}

export async function getContentDnD(id: string) {
  const url = `/api/DnD/getContent/${encodeURIComponent(id)}`;
  return API.get(url)
    .then((response) => response.data)
    .catch((error) => standardResponse(false, error.response?.data));
}
export interface Search {
  page?: number;
  size?: number;
}

export async function searchFormSchemas(dataSearch: Search) {
  const page = dataSearch.page ?? 0;
  const size = dataSearch.size ?? 10;
  return API.post('api/DnD/searchFormSchemas', { ...dataSearch, page, size })
    .then((response) => response.data)
    .catch((error) => standardResponse(false, error.response?.data));
}

export async function deleteFormSchema(id: string | number) {
  const url = `/api/DnD/delete?id=${id}`;

    return API.get(url)
    .then((response) => standardResponse(true, response))
    .catch((error) => standardResponse(false, error.response?.data));
}

export async function lockFormSchema(id: string | number) {
  const url = `/api/DnD/lock?id=${id}`;

  return API.get(url)
    .then((response) => standardResponse(true, response))
    .catch((error) => standardResponse(false, error.response?.data));
}

export async function deleteMultiFormSchema(ids: number[]) {
  const query = ids.join(',');
  const url = `/api/DnD/deleteMuti?id=${query}`;

  try {
    const response = await API.get(url);
    return standardResponse(true, response.data);
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}