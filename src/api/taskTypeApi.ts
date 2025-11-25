import { API, standardResponse } from '../utils/middleware';

export interface TaskType {
  id?: string;
  taskTypeCode?: string;
  taskTypeName?: string;
  taskTypeDescription?: string;
  version: number;
  isActive?: number;
}

export interface TaskTypeSearch {
  page?: number;
  size?: number;
  searchString?: string;
  taskTypeCode?: string;
  taskTypeName?: string;
  taskTypeDescription?: string;
  isActive?: number | null;
}

export async function search(search: TaskTypeSearch) {
  const page = search.page ?? 0;
  const size = search.size ?? 10;
  let url = `api/task-type/search?page=${page}&size=${size}`;

  const params = [
    search.searchString
      ? `searchString=${encodeURIComponent(search.searchString)}`
      : '',
    search.taskTypeCode
      ? `taskTypeCode=${encodeURIComponent(search.taskTypeCode)}`
      : '',
    search.taskTypeName
      ? `taskTypeName=${encodeURIComponent(search.taskTypeName)}`
      : '',
    search.taskTypeDescription
      ? `taskTypeDescription=${encodeURIComponent(search.taskTypeDescription)}`
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

export async function createTaskType(taskType: TaskType) {
  const url = `/api/task-type/add`;

  return API.post(url, taskType)
    .then((response) => {
      if (response.data.status === 200 || response.data.status === 400) {
        return response.data;
      }
      return null;
    })
    .catch((error) => standardResponse(false, error.response?.data));
}

export async function updateTaskType(taskType: TaskType) {
  const url = `api/task-type/update`;

  return API.post(url, taskType)
    .then((response) => {
      if (response.data.status === 200 || response.data.status === 400) {
        return response.data;
      }
      return null;
    })
    .catch((error) => standardResponse(false, error.response?.data));
}

export async function deleteTaskType(id: string, version: number) {
  const url = `api/task-type/delete?id=${id}&&version=${version}`;

  return API.post(url)
    .then((response) => standardResponse(true, response))
    .catch((error) => standardResponse(false, error.response?.data));
}

export async function lockTaskType(id: string, version: number) {
  const url = `api/task-type/lock?id=${id}&&version=${version}`;

  return API.post(url)
    .then((response) => standardResponse(true, response))
    .catch((error) => standardResponse(false, error.response?.data));
}

export async function deleteMultiTaskType(
  items: { id: string; version: number }[]
) {
  const url = `api/task-type/deleteMulti`;

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
  const url = `/api/task-type/checkDeleteMulti`;

  try {
    const response = await API.post(url, items);
    return standardResponse(true, response);
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export async function getAllTaskType() {
  let url = `api/task-type/getAllTaskType`;

  try {
    const response = await API.get(url);
    return response.data;
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export async function LogDetailTaskType(id: number | undefined) {
  let url = `api/task-type/LogDetailTaskType?id=${id}`;

  try {
    const response = await API.get(url);
    return response.data;
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}
