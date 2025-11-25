import { API, standardResponse } from '../utils/middleware';

export interface Domain {
  id?: string;
  domainCode?: string;
  domainName?: string;
  domainDescription?: string;
  version: number;
  isActive?: number;
}

export interface DomainSearch {
  page?: number;
  size?: number;
  searchString?: string;
  domainCode?: string;
  domainName?: string;
  domainDescription?: string;
  isActive?: number | null;
}

export async function searchDomains(search: DomainSearch) {
  const page = search.page ?? 0;
  const size = search.size ?? 10;
  let url = `api/domains/searchDomains?page=${page}&size=${size}`;

  const params = [
    search.searchString
      ? `searchString=${encodeURIComponent(search.searchString)}`
      : '',
    search.domainCode
      ? `domainCode=${encodeURIComponent(search.domainCode)}`
      : '',
    search.domainName
      ? `domainName=${encodeURIComponent(search.domainName)}`
      : '',
    search.domainDescription
      ? `domainDescription=${encodeURIComponent(search.domainDescription)}`
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

export async function createDomain(domain: Domain) {
  const url = `/api/domains/add`;

  return API.post(url, domain)
    .then((response) => {
      if (response.data.status === 200 || response.data.status === 400) {
        return response.data;
      }
      return null;
    })
    .catch((error) => standardResponse(false, error.response?.data));
}

export async function updateDomain(domain: Domain) {
  const url = `/api/domains/update`;

  return API.post(url, domain)
    .then((response) => {
      if (response.data.status === 200 || response.data.status === 400) {
        return response.data;
      }
      return null;
    })
    .catch((error) => standardResponse(false, error.response?.data));
}

export async function deleteDomain(id: string, version: number) {
  const url = `/api/domains/delete?id=${id}&&version=${version}`;

  return API.get(url)
    .then((response) => standardResponse(true, response))
    .catch((error) => standardResponse(false, error.response?.data));
}

export async function lockDomain(id: string, version: number) {
  const url = `/api/domains/lock?id=${id}&&version=${version}`;

  return API.get(url)
    .then((response) => standardResponse(true, response))
    .catch((error) => standardResponse(false, error.response?.data));
}

export async function deleteMultiDomain(
  items: { id: string; version: number }[]
) {
  const url = `/api/domains/deleteMuti`;
  try {
    const response = await API.post(url, items);
    return standardResponse(true, response);
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export async function getAllDomain() {
  let url = `api/domains/getAllDomain`;

  try {
    const response = await API.get(url);
    return response.data;
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export async function LogDetailDomain(id: number | undefined) {
  let url = `api/domains/LogDetailDomain?id=${id}`;

  try {
    const response = await API.get(url);
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
  const url = `/api/domains/checkDeleteMulti`;

  try {
    const response = await API.post(url, items);
    return standardResponse(true, response);
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}
