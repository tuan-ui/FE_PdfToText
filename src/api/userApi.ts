import { API, standardResponse } from '../utils/middleware';
export interface Role {
  id:string;
  roleName:string;
}
export interface User {
  id: string;
  userName: string;
  userCode: string;
  fullName: string;
  status: number;
  email: string;
  phone: string;
  birthdayStr: string;
  gender: boolean;
  version: number;
  identifyCode: string;
  issueDateStr: string;
  issuePlace: string;
  lstRole:Role[];
  [key: string]: any;
}

export async function countUsers(
  userId?: string | number,
  userName?: string,
  status?: string
) {
  const url = `/api/user/count?userId=${userId ?? ''}&userName=${
    userName ?? ''
  }&status=${status ?? ''}`;

  return API.get(url)
    .then((response) => standardResponse(true, response))
    .catch((error) => standardResponse(false, error.response?.data));
}

export interface UserSearch {
  page?: number;
  size?: number;
  searchString?: string;
  userName?: string;
  fullName?: string;
  status?: number | null;
  phone?: string;
  userCode?: string;
  birthday?: string;
  roleId?: number | null;
  departmentId?: number | null;
  birthdayStr?: string;
}

export async function searchUsers(search: UserSearch) {
  const page = search.page ?? 0;
  const size = search.size;
  let url = `api/users/list?page=${page}&size=${size}`;

  const params = [
    search.searchString
      ? `searchString=${encodeURIComponent(search.searchString)}`
      : '',
    search.userName ? `userName=${encodeURIComponent(search.userName)}` : '',
    search.fullName ? `fullName=${encodeURIComponent(search.fullName)}` : '',
    search.status !== undefined && search.status !== null
      ? `status=${search.status}`
      : '',
    search.phone ? `phone=${encodeURIComponent(search.phone)}` : '',
    search.userCode ? `userCode=${encodeURIComponent(search.userCode)}` : '',
    search.birthday ? `birthday=${encodeURIComponent(search.birthday)}` : '',
    search.birthdayStr
      ? `birthdayStr=${encodeURIComponent(search.birthdayStr)}`
      : '',
    search.roleId !== undefined && search.roleId !== null
      ? `roleId=${search.roleId}`
      : '',
    search.departmentId !== undefined && search.departmentId !== null
      ? `departmentId=${search.departmentId}`
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

export async function createUser(formData: FormData) {
  const url = `/api/users/add`;
  try {
    const response = await API.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data.status === 200 || response.data.status === 400) {
      return response.data;
    }
    return null;
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export async function updateUser(formData: FormData) {
  const url = `/api/users/update`;
  try {
    const response = await API.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data.status === 200 || response.data.status === 400) {
      return response.data;
    }
    return null;
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export async function deleteUser(id: string , version: number) {
  const url = `/api/users/delete?id=${id}&&version=${version}`;

  return API.get(url)
    .then((response) => standardResponse(true, response))
    .catch((error) => standardResponse(false, error.response?.data));
}

export async function lockUser(id: string , version: number) {
  const url = `/api/users/lock?id=${id}&&version=${version}`;

  return API.get(url)
    .then((response) => standardResponse(true, response))
    .catch((error) => standardResponse(false, error.response?.data));
}

export async function deleteMultiUser(
  items: { id: string; version: number }[]
) {
  const url = `/api/users/deleteMuti`;

  try {
    const response = await API.post(url, items);
    return standardResponse(true, response.data);
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export async function getUserImage(
  userId: string | null,
  type: 'profile' | 'signature'
): Promise<string> {
  const url = `/api/users/getImage?id=${userId ?? ''}&type=${type}`;

  try {
    const response = await API.get<Blob>(url, {
      responseType: 'blob',
    });

    return URL.createObjectURL(response.data);
  } catch (error) {
    console.error('Error fetching image:', error);
    throw error;
  }
}

export async function getUserProfile() {
  const url = `/api/users/getUserById`;

  return API.get(url)
    .then((response) => response.data)
    .catch((error) => standardResponse(false, error.response?.data));
}

export async function updateImage(formData: FormData) {
  const url = `/api/users/updateImage`;
  try {
    const response = await API.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data.status === 200 || response.data.status === 400) {
      return response.data;
    }
    return null;
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export async function LogDetailUser(id: string) {
  let url = `api/users/LogDetailUser?id=${id}`;

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
  const url = `/api/users/checkDeleteMulti`;

  try {
    const response = await API.post(url, items);
    return standardResponse(true, response);
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}
