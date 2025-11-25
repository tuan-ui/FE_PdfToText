import { API, standardResponse } from '../utils/middleware';

export interface HolidayType {
  id: string;
  holidayTypeCode?: string;
  holidayTypeName?: string;
  description?: string;
  version: number;
  isActive?: number;
}

export interface HolidayTypeSearch {
  page?: number;
  size?: number;
  searchString?: string;
  holidayTypeCode?: string;
  holidayTypeName?: string;
  description?: string;
  status?: number | null;
}

export async function search(search: HolidayTypeSearch) {
  const page = search.page ?? 0;
  const size = search.size ?? 10;
  let url = `api/holiday-type/search?page=${page}&size=${size}`;

  const params = [
    search.searchString
      ? `searchString=${encodeURIComponent(search.searchString)}`
      : '',
    search.holidayTypeCode
      ? `holidayTypeCode=${encodeURIComponent(search.holidayTypeCode)}`
      : '',
    search.holidayTypeName
      ? `holidayTypeName=${encodeURIComponent(search.holidayTypeName)}`
      : '',
      search.description
      ? `description=${encodeURIComponent(search.description)}`
      : '',
    search.status !== undefined && search.status !== null
      ? `status=${search.status}`
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

export async function createHolidayType(holidayType: HolidayType) {
  const url = `/api/holiday-type/create`;

  return API.post(url, holidayType)
    .then((response) => {
      if (response.data.status === 200 || response.data.status === 400) {
        return response.data;
      }
      return null;
    })
    .catch((error) => standardResponse(false, error.response?.data));
}

export async function updateHolidayType(holidayType: HolidayType) {
  const url = `api/holiday-type/update`;

  return API.post(url, holidayType)
    .then((response) => {
      if (response.data.status === 200 || response.data.status === 400) {
        return response.data;
      }
      return null;
    })
    .catch((error) => standardResponse(false, error.response?.data));
}

export async function deleteHolidayType(id: string, version: number) {
  const url = `api/holiday-type/delete?id=${id}&&version=${version}`;

  return API.post(url)
    .then((response) => standardResponse(true, response))
    .catch((error) => standardResponse(false, error.response?.data));
}

export async function lockHolidayType(id: string, version: number) {
  const url = `api/holiday-type/lock?id=${id}&&version=${version}`;

  return API.post(url)
    .then((response) => standardResponse(true, response))
    .catch((error) => standardResponse(false, error.response?.data));
}

export async function deleteMultiHolidayType(items: { id: string; version: number }[]) {
  const url = `api/holiday-type/deleteMulti`;

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
  const url = `/api/holiday-type/checkDeleteMulti`;

  try {
    const response = await API.post(url, items);
    return standardResponse(true, response);
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export async function getAllHolidayType() {
  let url = `api/holiday-type/getAllHolidayType`;

  try {
    const response = await API.get(url);
    return response.data;
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export async function LogDetailHolidayType(id: number | undefined) {
  let url = `api/holiday-type/LogDetailHolidayType?id=${id}`;

  try {
    const response = await API.get(url);
    return response.data;
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}
