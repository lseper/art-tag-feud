import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/globals.css';

import { BrowserRouter } from 'react-router-dom';

const root = createRoot(
  document.getElementById('root')!
);

root.render(
  <BrowserRouter basename={import.meta.env.BASE_URL}>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </BrowserRouter>
);
