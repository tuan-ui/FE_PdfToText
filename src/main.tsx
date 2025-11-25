import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n';
import { store, persistor } from './redux/store.ts';
import { Provider } from 'react-redux';
import { StyleProvider } from 'antd-style';
import { PersistGate } from 'redux-persist/integration/react';
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PersistGate persistor={persistor}>
      <StyleProvider>
        <Provider store={store}>
          <App />
        </Provider>
      </StyleProvider>
    </PersistGate>
  </React.StrictMode>
);
