import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { TestWrapper } from './TestWrapper';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TestWrapper />
  </StrictMode>
);