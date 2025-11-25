import { API, standardResponse } from '../utils/middleware';

export interface DocType {
  id?: string;
  docTypeCode?: string;
  docTypeName?: string;
  docTypeDescription?: string;
  version: number;
  isActive?: number;
}

export interface DocTypeSearch {
  page?: number;
  size?: number;
  searchString?: string;
  docTypeCode?: string;
  docTypeName?: string;
  docTypeDescription?: string;
  isActive?: number | null;
}

export async function search(search: DocTypeSearch) {
  const page = search.page ?? 0;
  const size = search.size ?? 10;
  let url = `api/doc-type/search?page=${page}&size=${size}`;

  const params = [
    search.searchString
      ? `searchString=${encodeURIComponent(search.searchString)}`
      : '',
    search.docTypeCode
      ? `docTypeCode=${encodeURIComponent(search.docTypeCode)}`
      : '',
    search.docTypeName
      ? `docTypeName=${encodeURIComponent(search.docTypeName)}`
      : '',
    search.docTypeDescription
      ? `docTypeDescription=${encodeURIComponent(search.docTypeDescription)}`
      : '',
    search.isActive !== undefined && search.isActive !== null
      ? `isActive=${search.isActive}`
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

export async function createDocType(docType: DocType) {
  const url = `/api/doc-type/add`;

  return API.post(url, docType)
    .then((response) => {
      if (response.data.status === 200 || response.data.status === 400) {
        return response.data;
      }
      return null;
    })
    .catch((error) => standardResponse(false, error.response?.data));
}

export async function updateDocType(docType: DocType) {
  const url = `api/doc-type/update`;

  return API.post(url, docType)
    .then((response) => {
      if (response.data.status === 200 || response.data.status === 400) {
        return response.data;
      }
      return null;
    })
    .catch((error) => standardResponse(false, error.response?.data));
}

export async function deleteDocType(id: string, version: number) {
  const url = `api/doc-type/delete?id=${id}&&version=${version}`;

  return API.get(url)
    .then((response) => standardResponse(true, response))
    .catch((error) => standardResponse(false, error.response?.data));
}

export async function lockDocType(id: string, version: number) {
  const url = `api/doc-type/lock?id=${id}&&version=${version}`;

  return API.get(url)
    .then((response) => standardResponse(true, response))
    .catch((error) => standardResponse(false, error.response?.data));
}

export async function deleteMultiDocType(
  items: { id: string; version: number }[]
) {
  const url = `api/doc-type/deleteMuti`;

  try {
    const response = await API.post(url, items);
    return standardResponse(true, response);
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export async function checkDeleteMulti(
  items: {
    id: string;
    name: string | undefined;
    code: string | undefined;
    version: number;
  }[]
) {
  const url = `/api/doc-type/checkDeleteMulti`;

  try {
    const response = await API.post(url, items);
    return standardResponse(true, response);
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export async function getAllDocType() {
  let url = `api/doc-type/getAllDocType`;

  try {
    const response = await API.get(url);
    return response.data;
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export async function LogDetailDocType(id: number | undefined) {
  let url = `api/doc-type/LogDetailDocType?id=${id}`;

  try {
    const response = await API.get(url);
    return response.data;
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}
