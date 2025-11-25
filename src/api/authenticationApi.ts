/* eslint-disable @typescript-eslint/no-explicit-any */
import { API, standardResponse } from '../utils/middleware';

type StandardResponse<T = any> = { success: boolean; message: T };

export async function refreshToken(token: string) {
  const url = "/api/auth/refreshToken";
  const params = { refreshToken: token };

  try {
    const response = await API.post(url, params);
    return response.data;
  } catch (error: any) {
    console.error(error.message);
    return {};
  }
}
export async function checkOTPRegister(phoneNumber: string, password1: string): Promise<StandardResponse> {
  const url = '/api/auth/checkOTPRegister';
  const params = { tel: phoneNumber, password: password1 };

  try {
    const response = await API.post(url, params);
    return standardResponse(true, response.data);
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export async function checkType2FALogin(username: string): Promise<number> {
  const url = '/api/auth/check2FAlogin';
  const params = { username };
  try {
    const response = await API.post(url, params);
    return response.data as number;
  } catch (error: any) {
    return 0;
  }
}

export async function loginToGetToken(username: string, password: string) {
  const url = '/api/auth/login';
  const params = { username, password };
  try {
    const response = await API.post(url, params);
    const d = response.data;
    return {
      token: d.token,
      refreshToken: d.refreshToken,
      username: d.username,
      role: d.role,
      fullName: d.fullName,
      email: d.email,
      twofaType: d.twofaType,
      phone: d.phone,
    };
  } catch (error: any) {
    console.error(error.message);
    return {};
  }
}

export async function login(username: string, password: string) {
  const url = '/api/auth/login';
  const params = { username, password };
  console.debug('[auth] login called for', username);
  try {
    const response = await API.post(url, params);
    console.debug('[auth] login response', response?.status, response?.data);
    const { object, status, message } = response.data;

    if (status === 200 && object) {
      if (object.validate2FAResult) {
        return {
          username: object.username,
          requires2FA: object.validate2FAResult,
          status,
          message,
        };
      }
      if (object.absoluteExp) {
        localStorage.setItem('absoluteExp', object.absoluteExp.toString());
      }

      return {
        token: object.token,
        refreshToken: object.refreshToken,
        username: object.username,
        fullName: object.fullName,
        email: object.email,
        statusAccount: object.status,
        phone: object.phone,
        roles: object.roles,
        partner_id: object.partner_id,
        user_id: object.user_id,
        is_change_password: object.isChangePassword,
        twofa_type: object.twofaType,
        isTrial: object.isTrial,
        linkChatAI: object.linkChatAI,
        backDropEnabled: object.backDropEnabled,
        status,
        message,
      };
    }

    if (status === 401) {
      return { status, message };
    }

    return {
      token: object?.token,
      refreshToken: object?.refreshToken,
      username: object?.username,
      fullName: object?.fullName,
      statusAccount: object?.status,
      email: object?.email,
      phone: object?.phone,
      roles: object?.roles,
      partner_id: object?.partner_id,
      user_id: object?.user_id,
      isChangePassword: object?.isChangePassword,
      status: object?.status,
      message,
      twofaType: object?.twofaType,
      partnerIdTemp: object?.partnerIdTemp,
      permissionsTemp: object?.permissionsTemp,
      backDropEnabled: object?.backDropEnabled,
    };
  } catch (error: any) {
    console.error('Login error:', error);
    return { status: error.response?.data?.status || 500, message: 'Lỗi hệ thống khi đăng nhập' };
  }
}

export async function sendOtp2FA(username: string) {
  const url = '/api/auth/sendOtp2FA';
  try {
    const response = await API.post(url, username);
    return response.data;
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export async function checkOtp2FA(username: string, otp: string, email?: string) {
  const url = '/api/auth/validateOtp';
  const params = { email, username, otp };
  try {
    const response = await API.post(url, params);
    return response.data as boolean;
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export async function sendSms2FA(username: string) {
  const url = '/api/auth/sendSms2FA';
  try {
    const response = await API.post(url, username);
    return response.data;
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export async function validateSmsResetPassword(email: string, otp: string) {
  const url = '/api/auth/validateSmsResetPassword';
  const params = { email, otp };
  try {
    const response = await API.post(url, params);
    return response.data;
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export async function checkSms2FA(username: string, phone: string, otp: string) {
  const url = '/api/auth/validateSms2FA';
  const params = { username, phone, otp };
  try {
    const response = await API.post(url, params);
    return response.data as boolean;
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export async function checkPassWord(username: string, password: string) {
  const url = '/api/auth/checkPassword';
  const params = { username, password };
  try {
    const response = await API.post(url, params);
    return response.data as boolean;
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export async function checkUsernameAndPassword(username: string, password: string) {
  const url = '/api/auth/checkUsernameAndPassword';
  const params = { username, password };
  try {
    const response = await API.post(url, params);
    return response.data as boolean;
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export async function changePassword(staffPassword: string, userId: string | number, userNewPassword: string) {
  const url = '/api/auth/changePassword';
  const params = { staffPassword, userId, userNewPassword };
  try {
    const response = await API.post(url, params);
    return response.data;
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export async function changePasswordAfterLogin(userId: string | number, oldPassword: string, newPassword: string) {
  const url = '/api/auth/changePasswordAfterLogin';
  const params = { userId, oldPassword, newPassword };
  try {
    const response = await API.post(url, params);
    return response;
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}

export async function generateQRCode2FA(username: string, secret: string) {
  const response = await API.get(`/api/auth/generateQR?username=${username}&secret=${secret}`);
  return response.data.object;
}

export async function generateSecret() {
  const response = await API.get(`/api/auth/generateSecret`);
  return response.data.object;
}

export async function validateOtpAuthenticator(secret: string, otp: string, username: string) {
  const response = await API.post(`/api/auth/validateOtpAuthenticator`, { secret, otp, username });
  return response.data;
}

export async function update2FAType(username: string, twoFAType: number) {
  const response = await API.post(`/api/auth/update2FA`, { username, twoFAType });
  return response.data;
}

export async function check2FA(username: string) {
  const response = await API.get(`/api/auth/check2FA?username=${username}`);
  return response.data;
}

export async function checkTokenValid(token: string) {
  const response = await API.get(`/api/auth/validateToken?token=${token}`);
  return response.data;
}

export async function changePasswordCheckOldPwd(oldPassword: string, newPassword: string) {
  const user = { oldPassword, newPassword };
  const response = await API.post(`/api/auth/changePasswordCheckOldPwd`, user);
  return response.data;
}

export async function updatePattern(username: string, password: string) {
  const user = { username, password };
  const response = await API.post(`/api/auth/updatePattern`, user);
  return response.data;
}

export async function checkPattern(username: string, password: string) {
  const user = { username, password };
  const response = await API.post(`/api/auth/checkPattern`, user);
  return response.data;
}

export async function logLogin(roleUserDeptId: string | number) {
  const response = await API.post(`/api/auth/logLogin`, roleUserDeptId);
  return response.data;
}

let cachedAvatar: string | null = null;
let cachedUserId: string | number | null = null;

export async function getUserImageNav(userId: string | number, type: string, cache?: string | null) {
  if (cache) {
    cachedAvatar = cache;
    return cache;
  }
  if (cachedUserId === userId) return cachedAvatar;

  const url = `/api/users/getImage?userId=${userId}&type=${type}`;
  try {
    const response = await API.get(url, { responseType: 'blob' as any });
    const contentType = response.headers['content-type'];
    if (contentType && (contentType as string).startsWith('image/')) {
      cachedAvatar = window.URL.createObjectURL(response.data);
      cachedUserId = userId;
      return cachedAvatar;
    }
    cachedAvatar = null;
    cachedUserId = userId;
    return null;
  } catch (error: any) {
    console.error('Error fetching image:', error);
    cachedAvatar = null;
    cachedUserId = userId;
    return null;
  }
}

export async function logOut() {
  const response = await API.post(`/api/auth/logout`);
  cachedAvatar = null;
  cachedUserId = null;
  return response.data;
}

export async function forgetPassword(username: string, phone: string) {
  const url = '/api/auth/forgetPassword';
  const params = { username, phone };
  try {
    const response = await API.post(url, params);
    return response.data;
  } catch (error: any) {
    return standardResponse(false, error.response?.data);
  }
}