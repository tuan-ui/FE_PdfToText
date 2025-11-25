/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosInstance, AxiosResponse } from 'axios';
  import {notification } from 'antd';
import { getLocalToken, clearLocalStorage} from './storage';
import {
  initKeepAlive,
} from './sessionKeepAlive';
import { t } from 'i18next';

const viteApi = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) || undefined;
const baseURL = (window as any).REACT_APP_API_URL || viteApi || process.env.VITE_API_URL;

export const API: AxiosInstance = axios.create({
  baseURL,
  timeout: 300000,
  headers: {
    'Content-Type': 'application/json',
  },
  validateStatus: () => true,
});

API.interceptors.response.use(
  (response: AxiosResponse) => {
    if (response.status !== 200) {
      if (response.data.status === 498 || response.data.code === "JWT_EXPIRED") {
        clearLocalStorage(true);
      }
    }
    if (response.status === 401 && response.data?.code === 'TRIAL_EXPIRED') {
      clearLocalStorage(true);
    }
    return response;
  },
  (error: unknown) => {
    const err: any = error;
    const status = err?.response?.status;
    console.warn('Error status: ', status);
    notification.error({
      message: t('notification.networkError'),
      description: err?.message || String(err),
    });
    return Promise.reject(error);
  }
);

API.interceptors.request.use((request: import('axios').InternalAxiosRequestConfig) => {
  try {
    console.debug('[API] request to', request?.url, 'baseURL=', request?.baseURL || baseURL);
  } catch (e) { /* empty */ }
  const token = getLocalToken();
  if (token && request.headers) {
    (request.headers as any).Authorization = 'Bearer ' + token;
  }
  return request;
});

initKeepAlive();


export function standardResponse<T = any>(success: boolean, message: T) {
  return {
    success,
    message,
  } as { success: boolean; message: T };
}

export const API_PROVINCE: AxiosInstance = axios.create({
  baseURL: 'https://vapi.vnappmob.com/api',
  timeout: 300000,
  headers: {
    'Content-Type': 'application/json',
  },
  validateStatus: () => true,
});

export const APICookie: AxiosInstance = axios.create({
  baseURL,
  timeout: 300000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  validateStatus: () => true,
});

APICookie.interceptors.response.use(
  (response: AxiosResponse) => {
    if (response.status !== 200) {
      const title = response.data?.title;
      if (title === 'Unauthorized' || title === 'User was locked' || title === 'User not found') {
        clearLocalStorage(true);
      }
      notification.error({
        message: t('notification.requestFailed', { status: response.status }),
        description: response.data?.message || response.statusText,
      });
    }
    return response;
  },
  (error: unknown) => {
    const err: any = error;
    console.warn('Error status: ', err.response?.status);
    notification.error({
      message: t('notification.networkError'),
      description: err?.message || String(err),
    });
    return Promise.reject(error);
  }
);

APICookie.interceptors.request.use((request: import('axios').InternalAxiosRequestConfig) => {
  const token = getLocalToken();
  if (token && request.headers) {
    (request.headers as any).Authorization = 'Bearer ' + token;
  }
  return request;
});

export default API;
