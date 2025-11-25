import { API, standardResponse } from '../utils/middleware';

export interface Role {
  id: string;
  roleName: string;
  roleCode: string;
  version: number;
  isActive?: boolean;
  [key: string]: any;
}

export async function countRoles(
  id?: string | number,
  roleName?: string,
  status?: string
) {
  const url = `/api/role/count?id=${id ?? ''}&roleName=${
    roleName ?? ''
  }&status=${status ?? ''}`;

  return API.get(url)
    .then((response) => standardResponse(true, response))
    .catch((error) => standardResponse(false, error.response?.data));
}

export interface RoleSearch {
  page?: number;
  size?: number;
  roleName?: string;
  roleCode?: string;
  searchString?: string;
  [key: string]: any;
}

export async function searchRoles(dataSearch: RoleSearch) {
  const page = dataSearch.page ?? 0;
  const size = dataSearch.size ?? 10;
  return API.post('api/roles/searchRoles', { ...dataSearch, page, size })
    .then((response) => response.data)
    .catch((error) => standardResponse(false, error.response?.data));
}

export async function createRole(role: Role) {
  const url = `/api/roles/add`;

  return API.post(url, role)
    .then((response) => {
      return response.data;
    })
    .catch((error) => standardResponse(false, error.response?.data));
}

export async function updateRole(role: Role) {
  const url = `/api/roles/update`;

  return API.post(url, role)
    .then((response) => {
      return response.data;
    })
    .catch((error) => standardResponse(false, error.response?.data));
}

export async function deleteRole(id: string, version: number) {
  const url = `/api/roles/delete?id=${id}&&version=${version}`;

  return API.get(url)
    .then((response) => standardResponse(true, response))
    .catch((error) => standardResponse(false, error.response?.data));
}

export async function lockRole(id: string, version: number) {
  const url = `/api/roles/lock?id=${id}&&version=${version}`;

  return API.get(url)
    .then((response) => standardResponse(true, response))
    .catch((error) => standardResponse(false, error.response?.data));
}

export async function deleteMultiRole(
  items: { id: string; version: number }[]
) {
  const url = `/api/roles/deleteMuti`;

  try {
    const response = await API.post(url, items);
    return standardResponse(true, response);
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export async function getAllRole() {
  let url = `api/roles/getAllRole`;

  try {
    const response = await API.get(url);
    return response.data;
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export async function LogDetailRole(id: string | null) {
  let url = `api/roles/LogDetailRole?id=${id}`;

  try {
    const response = await API.get(url);
    return response.data;
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export async function getALlPermisstion() {
  let url = `api/roles/getALlPermisstion`;

  try {
    const response = await API.get(url);
    return response.data;
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export async function getRolePermisstion(roleId: string | null) {
  let url = `api/roles/getRolePermisstion?roleId=${roleId}`;

  try {
    const response = await API.get(url);
    return response.data;
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export async function getRolePermissionsHalf(roleId: string | null) {
  let url = `api/roles/getRolePermissionsHalf?roleId=${roleId}`;

  try {
    const response = await API.get(url);
    return response.data;
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export async function saveRolePermisstion(
  roleId: string | null,
  checkedKeys: string[],
  checkedHalfKeys: string[]
) {
  let url = `api/roles/updateRolePermisstion`;
  const playload = { roleId, checkedKeys, checkedHalfKeys };
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
  const url = `/api/roles/checkDeleteMulti`;

  try {
    const response = await API.post(url, items);
    return standardResponse(true, response);
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export async function getUserPermissions() {
  let url = `api/roles/getUserPermissions`;

  try {
    const response = await API.get(url);
    return response.data;
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export async function getUserOriginDataPermissions() {
  let url = `api/roles/getUserOriginDataPermissions`;

  try {
    const response = await API.get(url);
    return response.data;
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export async function getPermissionsCurrent(menu: String | null) {
  let url = `api/roles/getPermissionsCurrent?menuCode=${menu}`;

  try {
    const response = await API.get(url);
    return response.data;
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}
