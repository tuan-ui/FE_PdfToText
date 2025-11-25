import { API, standardResponse } from '../utils/middleware';

export async function getWopiUrl(filename: string) {
  const url = `/api/fileViewer/wopiUrl/${filename}`;
  return API.get(url)
    .then((response) => {
      if (response.status === 200) {
        return response.data; // { Name, Url }
      }
      return null;
    })
    .catch((error) => standardResponse(false, error.response?.data));
}

export async function uploadFile(file: any) {
  const url = `/api/fileViewer/upload`;
  const formData = new FormData();
  formData.append('file', file);
  return API.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
    .then((response) => {
      if (response.status === 200) {
        return response.data; // { Name, Url }
      }
      return null;
    })
    .catch((error) => standardResponse(false, error.response?.data));
}

export async function createTemp(fileId: string) {
  const url = `/api/fileViewer/createTemp`;
  return API.post(url, fileId)
    .then((response) => {
      if (response.status === 200) {
        return response.data; // { Name, Url }
      } else if (response.status === 423) {
        return '432';
      }else if (response.status === 403) {
        return '403';
      }
      return null;
    })
    .catch((error) => standardResponse(false, error.response?.data));
}

export async function deleteTemp(tempFileId: string) {
  const url = `/api/fileViewer/deleteTemp/${tempFileId}`;
  return API.delete(url)
    .then((response) => {
      if (response.status === 200) {
        return response.data; // { Name, Url }
      }
      return null;
    })
    .catch((error) => standardResponse(false, error.response?.data));
}

export async function saveFromTemp(tempId: string, lockValue: string) {
  const url = `/api/fileViewer/saveFromTemp`;

  return API.post(
    url,
    { tempId, lockValue },
    {
      headers: { 'Content-Type': 'application/json' },
    }
  )
    .then((response) => {
      if (response.status === 200) {
        return standardResponse(true, {
          message: response.data.message,
          isModified: response.data.isModified ?? true,
        });
      }
      return response.data;
    })
    .catch((error) =>
      standardResponse(false, error.response?.data?.error || error.message)
    );
}

export async function unlockFile(fileId: string, lockValue: string) {
  const url = `/api/fileViewer/unlock`;

  return API.post(
    url,
    { fileId, lockValue },
    {
      headers: { 'Content-Type': 'application/json' },
    }
  )
    .then((response) => {
      if (response.status === 200) {
        return response.data;
      }
      return standardResponse(false, 'Unlock failed');
    })
    .catch((error) =>
      standardResponse(false, error.response?.data?.error || error.message)
    );
}

let cachedCollaboraUrl: string | null = null;

export async function getCollaboraUrl(): Promise<string | null> {
  if (cachedCollaboraUrl) return cachedCollaboraUrl;

  const url = `/api/fileViewer/getCollaboraUrl`;
  try {
    const res = await API.get(url);
    if (res.status === 200 && res.data?.url) {
      cachedCollaboraUrl = res.data.url;
      return cachedCollaboraUrl;
    }
    return null;
  } catch (err) {
    console.error('getCollaboraUrl error:', err);
    return null;
  }
}

export async function getUrlViewFileOnly(fileId: string) {
  const url = `/api/fileViewer/getUrlViewFileOnly`;
  return API.post(url, fileId)
    .then((response) => {
      if (response.status === 200) {
        return response.data;
      }
      return null;
    })
    .catch((error) => standardResponse(false, error.response?.data));
}