import { API, standardResponse } from '../utils/middleware';

export interface UserGroup {
  id: string;
  groupName: string;
  groupCode: string;
  isActive: boolean;
  version: number;
  users?:
    | [
        {
          userId: string;
          username: string;
          userCode: string;
          fullName: string;
        },
      ]
    | [];
  [key: string]: any;
}

export interface CreateUserGroup {
  id?: string | null;
  groupName: string;
  groupCode: string;
  version: number;
  [key: string]: any;
}

export interface UserGroupSearch {
  page?: number;
  size?: number;
  searchString?: string;
  groupName?: string;
  groupCode?: string;
  status?: number;
}

export async function saveLogDetailUserGroup(id: string | null) {
  const url = `api/userGroups/logDetail?id=${id ?? null}`;
  return API.get(url)
    .then((response) => response.data)
    .catch((error) => standardResponse(false, error.response?.data));
}

export async function searchUserGroups(search: UserGroupSearch) {
  const page = search.page ?? 0;
  const size = search.size ?? 10;
  let url = `api/userGroups/search?page=${page}&size=${size}`;

  const params = [
    search.searchString
      ? `searchString=${encodeURIComponent(search.searchString)}`
      : '',
    search.groupName ? `groupName=${encodeURIComponent(search.groupName)}` : '',
    search.groupCode ? `groupCode=${encodeURIComponent(search.groupCode)}` : '',
    search.status !== undefined
      ? `status=${encodeURIComponent(search.status)}`
      : '',
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

export async function saveUserGroup(userGroup: CreateUserGroup) {
  const url = 'api/userGroups/save';
  return API.post(url, userGroup)
    .then((response) => response.data)
    .catch((error) => standardResponse(false, error.response?.data));
}

export async function updateStatusUserGroup(groupId: string, version: number) {
  const url = `api/userGroups/updateStatus?id=${encodeURIComponent(
    groupId
  )}&&version=${version}`;
  return API.put(url)
    .then((response) => standardResponse(true, response))
    .catch((error) => standardResponse(false, error.response?.data));
}

export async function deleteUserGroup(groupId: string, version: number) {
  const url = `api/userGroups/delete?id=${encodeURIComponent(
    groupId
  )}&&version=${version}`;
  return API.delete(url)
    .then((response) => standardResponse(true, response))
    .catch((error) => standardResponse(false, error.response?.data));
}

export async function deleteMultipleUserGroups(
  items: { id: string; version: number }[]
) {
  const url = `api/userGroups/deleteMultiple`;
  return API.post(url, items)
    .then((response) => response.data)
    .catch((error) => standardResponse(false, error.response?.data));
}

export async function checkDeleteMultiple(
  items: {
    id: string;
    name: string | undefined;
    code: string | undefined;
    version: number;
  }[]
) {
  const url = `api/userGroups/checkDeleteMulti`;
  return API.post(url, items)
    .then((response) => response.data)
    .catch((error) => standardResponse(false, error.response?.data));
}
