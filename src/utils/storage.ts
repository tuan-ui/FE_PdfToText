/**
 * Utility functions for managing localStorage
 * Used with Ant Design React app
 */

export interface UserInfo {
  id?: number;
  username?: string;
  email?: string;
  roles?: number[] | string; // Có thể là mảng hoặc chuỗi
  [key: string]: any; // Cho phép mở rộng
}

/**
 * @returns token in localStorage
 */
export function getLocalToken(): string | null {
  return window.localStorage.getItem("token");
}

/**
 * @param value token value to store
 */
export function setLocalToken(value: string): void {
  window.localStorage.setItem("token", value);
  window.dispatchEvent(new Event("storage"));
}
export function setRefreshToken(value: string): void {
  window.localStorage.setItem("refreshToken", value);
  window.dispatchEvent(new Event("storage"));
}

/**
 * @returns user info object from localStorage
 */
export function getLocalUserInfo(): UserInfo | null {
  const info = window.localStorage.getItem("user");
  try {
    return info ? (JSON.parse(info) as UserInfo) : null;
  } catch (error) {
    console.warn("Invalid user info in localStorage:", error);
    return null;
  }
}

/**
 * @param value user info object to store
 */
export function setLocalUserInfo(value: UserInfo): void {
  window.localStorage.setItem("user", JSON.stringify(value));
  window.dispatchEvent(new Event("storage"));
}

/**
 * Clears session-related data in localStorage but keeps remembered username
 * @param triggerEvent whether to trigger 'storage' event after clearing
 */
export function clearLocalStorage(triggerEvent = false): void {
  const rememberedUsername = localStorage.getItem("rememberedUsername");

  const keysToRemove = ["token", "refreshToken", "user", "currentPage"];
  keysToRemove.forEach((key) => localStorage.removeItem(key));

  if (rememberedUsername) {
    localStorage.setItem("rememberedUsername", rememberedUsername);
  }

  if (triggerEvent) {
    window.dispatchEvent(new Event("storage"));
  }
}

/**
 * Employee permission list management
 */
export function setLocalEmpPermission(list: any[]): void {
  window.localStorage.setItem("empPermissionList", JSON.stringify(list));
  window.dispatchEvent(new Event("storage"));
}

export function getLocalEmpPermission(): any[] {
  const empPermissionList = window.localStorage.getItem("empPermissionList");
  try {
    return empPermissionList ? JSON.parse(empPermissionList) : [];
  } catch {
    return [];
  }
}

/**
 * Get roles from userInfo
 * @returns an array of numeric roles
 */
export function getLocalRoles(): number[] {
  const userInfo = getLocalUserInfo();
  if (!userInfo?.roles) return [];

  if (Array.isArray(userInfo.roles)) {
    return userInfo.roles.map(Number);
  }

  return userInfo.roles.split(",").map(Number);
}

/**
 * @param value Comma-separated roles string
 */
export function setLocalRoles(value: string): void {
  window.localStorage.setItem("roles", value);
  window.dispatchEvent(new Event("storage"));
}

/**
 * Manage current page persistence
 */
export function setLocalPage(value: string): void {
  window.localStorage.setItem("currentPage", value);
  window.dispatchEvent(new Event("storage"));
}

export function getLocalPage(): string | null {
  return window.localStorage.getItem("currentPage");
}
