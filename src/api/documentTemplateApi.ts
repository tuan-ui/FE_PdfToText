import { API, standardResponse } from '../utils/middleware';
export interface DocumentTemplate {
  id: string;
  documentTemplateName: string;
  documentTemplateCode: string;
  documentTemplateDescription: string;
  documentTypeId: string;
  attachFileId: string;
  allowedEditors?: string[];
  allowedViewers?: string[];
  version: number;
  isActive?: boolean;
  [key: string]: any;
}

export async function countDocumentTemplates(
  id?: string | number,
  documentTemplateName?: string,
  status?: string
) {
  const url = `/api/documentTemplate/count?id=${
    id ?? ''
  }&documentTemplateName=${documentTemplateName ?? ''}&status=${status ?? ''}`;

  return API.get(url)
    .then((response) => standardResponse(true, response))
    .catch((error) => standardResponse(false, error.response?.data));
}

export interface DocumentTemplateSearch {
  page?: number;
  size?: number;
  documentTemplateName?: string;
  documentTemplateCode?: string;
  searchString?: string;
  [key: string]: any;
}

export async function searchDocumentTemplates(
  dataSearch: DocumentTemplateSearch
) {
  const page = dataSearch.page ?? 0;
  const size = dataSearch.size ?? 10;
  let url = `api/documentTemplates/search?page=${page}&size=${size}`;

  const params = [
    dataSearch.documentTemplateCode
      ? `documentTemplateCode=${encodeURIComponent(
          dataSearch.documentTemplateCode
        )}`
      : '',
    dataSearch.documentTemplateName
      ? `documentTemplateName=${encodeURIComponent(
          dataSearch.documentTemplateName
        )}`
      : '',
    dataSearch.documentTemplateDescription
      ? `documentTemplateDescription=${encodeURIComponent(
          dataSearch.documentTemplateDescription
        )}`
      : '',
    dataSearch.searchString
      ? `searchString=${encodeURIComponent(dataSearch.searchString)}`
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

export async function createDocumentTemplate(
  documentTemplate: DocumentTemplate
) {
  const url = `/api/documentTemplates/add`;

  return API.post(url, documentTemplate)
    .then((response) => {
      return response.data;
    })
    .catch((error) => standardResponse(false, error.response?.data));
}

export async function updateDocumentTemplate(
  documentTemplate: DocumentTemplate
) {
  const url = `/api/documentTemplates/update`;

  return API.post(url, documentTemplate)
    .then((response) => {
      return response.data;
    })
    .catch((error) => standardResponse(false, error.response?.data));
}

export async function deleteDocumentTemplate(id: string, version: number) {
  const url = `/api/documentTemplates/delete?id=${id}&&version=${version}`;

  return API.get(url)
    .then((response) => standardResponse(true, response))
    .catch((error) => standardResponse(false, error.response?.data));
}

export async function lockDocumentTemplate(id: string, version: number) {
  const url = `/api/documentTemplates/lock?id=${id}&&version=${version}`;

  return API.get(url)
    .then((response) => standardResponse(true, response))
    .catch((error) => standardResponse(false, error.response?.data));
}

export async function deleteMultiDocumentTemplate(
  items: { id: string; version: number }[]
) {
  const url = `/api/documentTemplates/deleteMuti`;

  try {
    const response = await API.post(url, items);
    return standardResponse(true, response);
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export async function getAllDocumentTemplate() {
  let url = `api/documentTemplates/getAllDocumentTemplate`;

  try {
    const response = await API.get(url);
    return response.data;
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export async function getDocumentDetail(id: string | null) {
  let url = `api/documentTemplates/getDocumentDetail?id=${id}`;

  try {
    const response = await API.get(url);
    return response.data;
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export async function getALlPermisstion() {
  let url = `api/documentTemplates/getALlPermisstion`;

  try {
    const response = await API.get(url);
    return response.data;
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export async function getDocumentTemplatePermisstion(
  documentTemplateId: string | null
) {
  let url = `api/documentTemplates/getDocumentTemplatePermisstion?documentTemplateId=${documentTemplateId}`;

  try {
    const response = await API.get(url);
    return response.data;
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export async function getDocumentTemplatePermissionsHalf(
  documentTemplateId: string | null
) {
  let url = `api/documentTemplates/getDocumentTemplatePermissionsHalf?documentTemplateId=${documentTemplateId}`;

  try {
    const response = await API.get(url);
    return response.data;
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export async function saveDocumentTemplatePermisstion(
  documentTemplateId: string | null,
  checkedKeys: string[],
  checkedHalfKeys: string[]
) {
  let url = `api/documentTemplates/updateDocumentTemplatePermisstion`;
  const playload = { documentTemplateId, checkedKeys, checkedHalfKeys };
  try {
    const response = await API.post(url, playload);
    return response.data;
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
  const url = `/api/documentTemplates/checkDeleteMulti`;

  try {
    const response = await API.post(url, items);
    return standardResponse(true, response);
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export async function getDocumentTemplateById(id: string) {
  const url = `/api/documentTemplates/add`;

  return API.post(url, id)
    .then((response) => {
      if (response.data.status === 200 || response.data.status === 400) {
        return response.data;
      }
      return null;
    })
    .catch((error) => standardResponse(false, error.response?.data));
}

export async function getAllowspermission(id: string) {
  let url = `api/documentTemplates/getAllowspermission?id=${id}`;

  try {
    const response = await API.get(url);
    return response.data;
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}
