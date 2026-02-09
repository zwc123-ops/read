
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// 全局错误捕获以辅助调试
window.addEventListener('error', (event) => {
  console.error('Global Error caught:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise Rejection:', event.reason);
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
