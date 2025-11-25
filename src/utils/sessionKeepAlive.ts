/* eslint-disable @typescript-eslint/no-explicit-any */
import { Modal } from 'antd';
import API from './middleware';
import { getLocalToken, setLocalToken, clearLocalStorage } from './storage';
import { refreshToken } from '../api/authenticationApi';
import { t } from 'i18next';

let pingInterval: any = null;
let jwtExpiryModal: any = null; // Modal đếm ngược JWT expiry
let jwtExpiryCountdown: any = null; // Interval đếm ngược
let jwtExpirySecondsLeft = 5; // Số giây còn lại
let isRefreshingToken = false; // Đang refresh token hay không
let isTokenRefreshed = false; // Refresh token đã thành công hay chưa

export function isLoginPage(): boolean {
  const path = globalThis.location.pathname;
  return path === '/';
}

export function stopJwtExpiryModal() {
  if (jwtExpiryModal) {
    jwtExpiryModal.destroy();
    jwtExpiryModal = null;
  }
  if (jwtExpiryCountdown) {
    clearInterval(jwtExpiryCountdown);
    jwtExpiryCountdown = null;
  }
  jwtExpirySecondsLeft = 5;
  isTokenRefreshed = false; // Reset flag
}

export function showJwtExpiryCountdown() {
  if (jwtExpiryModal) return;

  jwtExpirySecondsLeft = 5;
  isTokenRefreshed = false;

  jwtExpiryModal = Modal.warning({
    title: t('session.expiringTitle'),
    content: t('session.expiringChecking', { seconds: jwtExpirySecondsLeft }),
    keyboard: false,
    maskClosable: false,
    okButtonProps: { style: { display: 'none' } },
  });

  jwtExpiryCountdown = setInterval(() => {
    if (isTokenRefreshed) {
      jwtExpirySecondsLeft--;
      if (jwtExpirySecondsLeft <= 0) {
        stopJwtExpiryModal();
      }
      return;
    }

    jwtExpirySecondsLeft--;
    if (jwtExpirySecondsLeft <= 0) {
      stopJwtExpiryModal();
      window.location.reload();
    } else if (jwtExpiryModal) {
      jwtExpiryModal.update({
        title: t('session.expiringTitle'),
        content: t('session.expiringContent', { seconds: jwtExpirySecondsLeft }),
      });
    }
  }, 1000);
}

export async function handleJwtExpiredFromInterceptor() {
  if (isLoginPage()) return;
  if (!jwtExpiryModal) showJwtExpiryCountdown();
  if (isRefreshingToken || isTokenRefreshed) return;

  isRefreshingToken = true;
  const refreshTokenValue = localStorage.getItem('refreshToken');
  if (!refreshTokenValue) {
    isRefreshingToken = false;
    return;
  }
  try {
    const refreshResult = await refreshToken(refreshTokenValue);
    const newToken = refreshResult?.object?.token || refreshResult?.object?.accessToken;
    if (newToken) {
      setLocalToken(newToken);
      isTokenRefreshed = true;
    }
  } finally {
    isRefreshingToken = false;
  }
}

export function stopPing() {
  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
  }
  document.removeEventListener('visibilitychange', handleVisibilityChange);
}

function handleVisibilityChange() {
  if (!document.hidden && !pingInterval && !isLoginPage() && getLocalToken()) {
    startPing();
  }
}

export function startPing() {
  if (pingInterval) return;

  const performPing = async () => {
    if (isLoginPage()) return;

    const token = getLocalToken();
    if (!token) {
      stopPing();
      return;
    }

    try {
      const res = await API.get('/api/auth/ping', {
        headers: { Authorization: 'Bearer ' + token },
      });

      const { message, object, code, status: responseStatus } = res.data || {};

      if (responseStatus === 498 || code === 'JWT_EXPIRED') {
        if (isLoginPage() || isTokenRefreshed) return;

        if (!jwtExpiryModal) showJwtExpiryCountdown();

        if (!isRefreshingToken && !isTokenRefreshed) {
          isRefreshingToken = true;
          const refreshTokenValue = localStorage.getItem('refreshToken');
          if (refreshTokenValue) {
            try {
              const refreshResult = await refreshToken(refreshTokenValue);
              const newToken = refreshResult?.object?.token || refreshResult?.object?.accessToken;
              if (newToken) {
                setLocalToken(newToken);
                isTokenRefreshed = true;
              }
            } finally {
              isRefreshingToken = false;
            }
          } else {
            isRefreshingToken = false;
          }
        }
        return;
      }

      if (message === 'TIMEOUT') {
        stopSessionWatcher();
        stopPing();
        stopJwtExpiryModal();
        clearLocalStorage(true);
        window.location.reload();
      } else if (message === 'OK') {
        if (object?.token) {
          localStorage.setItem('token', object.token);
        }
        if (object?.idleExpire) {
          localStorage.setItem('idleExpire', object.idleExpire.toString());
        }
        if (jwtExpiryModal) {
          stopJwtExpiryModal();
        }
      }
    } catch {
      /* empty */
    }
  };

  performPing();

  pingInterval = setInterval(() => {
    if (isLoginPage() || !getLocalToken()) {
      stopPing();
      return;
    }
    if (!document.hidden) performPing();
  }, 1 * 60 * 1000);

  document.addEventListener('visibilitychange', handleVisibilityChange);
}

let sessionWatchInterval: any = null;
let countdownModal: any = null;

export function stopSessionWatcher() {
  if (sessionWatchInterval) {
    clearInterval(sessionWatchInterval);
    sessionWatchInterval = null;
  }
  if (countdownModal) {
    countdownModal.destroy();
    countdownModal = null;
  }
}

export function startSessionWatcher() {
  stopSessionWatcher();
  sessionWatchInterval = setInterval(() => {
    const absoluteExpStr = localStorage.getItem('absoluteExp');
    if (!absoluteExpStr) return;

    const now = Date.now();
    const absoluteExp = Number.parseInt(absoluteExpStr, 10);
    const timeLeft = absoluteExp - now;
    const secondsLeft = Math.ceil(timeLeft / 1000);

    if (timeLeft <= 0) {
      if (countdownModal) countdownModal.destroy();
      clearLocalStorage(true);
      window.location.href = '/';
      stopSessionWatcher();
    } else if (timeLeft <= 5000) {
      if (!countdownModal) {
        countdownModal = Modal.warning({
          title: t('session.expiringTitle'),
          content: t('session.expiringContent', { seconds: secondsLeft }),
          keyboard: false,
          maskClosable: false,
          okButtonProps: { style: { display: 'none' } },
        });
      } else {
        countdownModal.update({
          content: t('session.expiringContentShort', { seconds: secondsLeft }),
        });
      }
    }
  }, 1000);
}

function setupRouteListeners() {
  window.addEventListener('popstate', () => {
    if (isLoginPage()) {
      stopPing();
      stopJwtExpiryModal();
    } else if (getLocalToken() && !pingInterval) {
      startPing();
    }
  });

  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function (...args: any) {
    originalPushState.apply(history, args);
    if (isLoginPage()) {
      stopPing();
      stopJwtExpiryModal();
    } else if (getLocalToken() && !pingInterval) {
      startPing();
    }
  } as any;

  history.replaceState = function (...args: any) {
    originalReplaceState.apply(history, args);
    if (isLoginPage()) {
      stopPing();
      stopJwtExpiryModal();
    } else if (getLocalToken() && !pingInterval) {
      startPing();
    }
  } as any;
}

export function initKeepAlive() {
  if (!isLoginPage() && getLocalToken()) {
    startPing();
    startSessionWatcher();
  }
  setupRouteListeners();
}

export const KeepAliveExports = {
  isLoginPage,
  showJwtExpiryCountdown,
  stopJwtExpiryModal,
  startPing,
  stopPing,
  startSessionWatcher,
  stopSessionWatcher,
  initKeepAlive,
};


