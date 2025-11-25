import { UploadFile } from 'antd';
import { API, standardResponse } from '../utils/middleware';
export interface DocDocument {
  id: string;
  documentTitle: string;
  docTemplateId: string;
  docTemplateName:string;
  docTypeId: string;
  status: string;
  deptName: string;
  docTypeName: string;
  purpose: string;
  version: number;
  files :File[];
  [key: string]: any;
}

export interface CreatePersonalDoc {
  id?: string;
  [key: string]: any;
}

export interface PersonalDocSearch {
  page?: number;
  size?: number;
  status?: string;
  searchString?: string;
  title?: string;
  docType?: string;
  unit?: string;
}

export async function searchPersonalDocs(search: PersonalDocSearch) {
  const page = search.page ?? 0;
  const size = search.size ?? 10;
  let url = `api/doc-document/search?page=${page}&size=${size}`;

  const params = [
    search.searchString
      ? `searchString=${encodeURIComponent(search.searchString)}`
      : '',
    search.status ? `status=${encodeURIComponent(search.status)}` : '',
    search.title ? `title=${encodeURIComponent(search.title)}` : '',
    search.docType ? `docType=${encodeURIComponent(search.docType)}` : '',
    search.unit !== undefined ? `unit=${encodeURIComponent(search.unit)}` : '',
  ]
    .filter((param) => param !== '')
    .join('&');

  if (params) {
    url += `&${params}`;
  }

  return API.get(url)
    .then((response) => response.data)
    .catch((error) => standardResponse(false, error.response?.data));
}
export async function createOrUpdate(docType: DocDocument) {
  const url = `/api/doc-document/createOrUpdate`;

  const formData = new FormData();

  docType?.files?.forEach((file: any) => {
    // file gốc là originFileObj
    const actualFile = file.originFileObj ?? file;
    if (actualFile) {
      formData.append('files', actualFile);
    }
  });

  // Thêm DTO JSON dưới dạng string
  formData.append('docDocument', JSON.stringify(docType));

  return API.post(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
    .then((response) => {
      if (response.data.status === 200 || response.data.status === 400) {
        return response.data;
      }
      return null;
    })
    .catch((error) => standardResponse(false, error.response?.data));
}

export async function getAttachs(id:any) {
  let url = `api/doc-document/attachs?id=${id}`;
  return API.get(url)
    .then((response) => response.data)
    .catch((error) => standardResponse(false, error.response?.data));
}

export async function getUsersProcess(id:any) {
  let url = `api/doc-document/users-process?id=${id}`;
  return API.get(url)
    .then((response) => response.data)
    .catch((error) => standardResponse(false, error.response?.data));
}

export async function deleteDoc(id:any) {
  let url = `api/doc-document/delete?id=${id}`;
  return API.get(url)
    .then((response) => response.data)
    .catch((error) => standardResponse(false, error.response?.data));
}