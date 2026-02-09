
import React from 'react';
import { createRoot } from 'react-dom/client';
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

try {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  // 渲染后移除初始加载动画
  const loader = document.getElementById('initial-loader');
  if (loader) {
    loader.style.opacity = '0';
    setTimeout(() => loader.remove(), 500);
  }
} catch (err) {
  console.error("React mount failed:", err);
  const rootEl = document.getElementById('root');
  if (rootEl) {
    rootEl.innerHTML = `<div style="padding: 20px; color: red;">应用加载失败，请检查控制台。</div>`;
  }
}
