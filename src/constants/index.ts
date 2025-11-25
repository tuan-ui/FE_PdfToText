import { PATH_AUTH, PATH_ERROR, PATH_DND, PATH_SYSTEM, PATH_HOME, PATH_DOCS } from './routes.ts';

const DASHBOARD_ITEMS = [
  { title: 'sidebar.partner', path: PATH_SYSTEM.partner },
  { title: 'sidebar.role', path: PATH_SYSTEM.role },
  { title: 'sidebar.user', path: PATH_SYSTEM.user },
  { title: 'sidebar.userGroup', path: PATH_SYSTEM.userGroup },
  { title: 'sidebar.log', path: PATH_SYSTEM.log },
  { title: 'sidebar.originData', path: PATH_SYSTEM.originData },
];

const DND_ITEMS = [
  { title: 'dnd', path: PATH_DND.root },
  { title: 'manager', path: PATH_DND.default },
];

const DOCS_ITEMS = [
  { title: 'sidebar.personalDoc', path: PATH_DOCS.personalDoc },
];

const AUTHENTICATION_ITEMS = [
  { title: 'sign in', path: PATH_AUTH.signin },
  { title: 'sign up', path: PATH_AUTH.signup },
  { title: 'welcome', path: PATH_AUTH.welcome },
  { title: 'verify email', path: PATH_AUTH.verifyEmail },
  { title: 'password reset', path: PATH_AUTH.passwordReset },
  { title: 'account deleted', path: PATH_AUTH.accountDelete },
];

const ERROR_ITEMS = [
  { title: '400', path: PATH_ERROR.error400 },
  { title: '403', path: PATH_ERROR.error403 },
  { title: '404', path: PATH_ERROR.error404 },
  { title: '500', path: PATH_ERROR.error500 },
  { title: '503', path: PATH_ERROR.error503 },
];

export {
  PATH_AUTH,
  PATH_ERROR,
  DASHBOARD_ITEMS,
  DOCS_ITEMS,
  PATH_DND,
  DND_ITEMS,
  AUTHENTICATION_ITEMS,
  ERROR_ITEMS,
  PATH_SYSTEM,
  PATH_HOME,
  PATH_DOCS,
};
