import { ThemeProvider } from '@baron/ui-spa/theme-provider';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { routerInstance } from './root-router';
import './require-env-vars';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="ui-theme">
      <RouterProvider router={routerInstance} />
    </ThemeProvider>
  </React.StrictMode>,
);
