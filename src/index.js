import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'; // Anda mungkin perlu membuat file ini
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);