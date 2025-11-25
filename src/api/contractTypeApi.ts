import { API, standardResponse } from '../utils/middleware';

export interface ContractType {
  id?: string;
  contractTypeCode?: string;
  contractTypeName?: string;
  contractTypeDescription?: string;
  version: number;
  isActive?: number;
}

export interface ContractTypeSearch {
  page?: number;
  size?: number;
  searchString?: string;
  contractTypeCode?: string;
  contractTypeName?: string;
  contractTypeDescription?: string;
  isActive?: number | null;
}

export async function search(search: ContractTypeSearch) {
  const page = search.page ?? 0;
  const size = search.size ?? 10;
  let url = `api/contractType/search?page=${page}&size=${size}`;

  const params = [
    search.searchString
      ? `searchString=${encodeURIComponent(search.searchString)}`
      : '',
    search.contractTypeCode
      ? `contractTypeCode=${encodeURIComponent(search.contractTypeCode)}`
      : '',
    search.contractTypeName
      ? `contractTypeName=${encodeURIComponent(search.contractTypeName)}`
      : '',
    search.contractTypeDescription
      ? `contractTypeDescription=${encodeURIComponent(search.contractTypeDescription)}`
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

export async function createContractType(contractType: ContractType) {
  const url = `/api/contractType/add`;

  return API.post(url, contractType)
    .then((response) => {
      if (response.data.status === 200 || response.data.status === 400) {
        return response.data;
      }
      return null;
    })
    .catch((error) => standardResponse(false, error.response?.data));
}

export async function updateContractType(contractType: ContractType) {
  const url = `api/contractType/update`;

  return API.post(url, contractType)
    .then((response) => {
      if (response.data.status === 200 || response.data.status === 400) {
        return response.data;
      }
      return null;
    })
    .catch((error) => standardResponse(false, error.response?.data));
}

export async function deleteContractType(id: string, version: number) {
  const url = `api/contractType/delete?id=${id}&&version=${version}`;

  return API.get(url)
    .then((response) => standardResponse(true, response))
    .catch((error) => standardResponse(false, error.response?.data));
}

export async function lockContractType(id: string, version: number) {
  const url = `api/contractType/lock?id=${id}&&version=${version}`;

  return API.get(url)
    .then((response) => standardResponse(true, response))
    .catch((error) => standardResponse(false, error.response?.data));
}

export async function deleteMultiContractType(
  items: { id: string; version: number }[]
) {
  const url = `api/contractType/deleteMuti`;

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
  const url = `/api/contractType/checkDeleteMulti`;

  try {
    const response = await API.post(url, items);
    return standardResponse(true, response);
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export async function getAllContractType() {
  let url = `api/contractType/getAllContractType`;

  try {
    const response = await API.get(url);
    return response.data;
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export async function LogDetailContractType(id: number | undefined) {
  let url = `api/contractType/LogDetailContractType?id=${id}`;

  try {
    const response = await API.get(url);
    return response.data;
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}
