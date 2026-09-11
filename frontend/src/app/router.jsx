import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthLayout } from './layouts/AuthLayout.jsx';
import { AppLayout } from './layouts/AppLayout.jsx';
import { ProtectedRoute } from '../features/auth/components/ProtectedRoute.jsx';
import { PublicRoute } from '../features/auth/components/PublicRoute.jsx';
import { AuthPage } from '../pages/AuthPage.jsx';
import { NotFoundPage } from '../pages/NotFoundPage.jsx';
import { PrivacyPolicyPage } from '../pages/PrivacyPolicyPage.jsx';
import { WorkspacePage } from '../pages/WorkspacePage.jsx';

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [{ path: '/privacy-policy', element: <PrivacyPolicyPage /> }],
  },
  {
    element: <PublicRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: <AuthPage mode="login" /> },
          { path: '/register', element: <AuthPage mode="register" /> },
          { path: '/verify-email', element: <AuthPage mode="verify" /> },
          { path: '/forgot-password', element: <AuthPage mode="forgot" /> },
          { path: '/reset-password', element: <AuthPage mode="reset" /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <Navigate to="/workspace/notes" replace /> },
          {
            path: '/workspace',
            element: <WorkspacePage />,
            children: [
              { index: true, element: <Navigate to="notes" replace /> },
              { path: 'notes' },
              { path: 'notes/:noteId' },
              { path: 'favorites' },
              { path: 'favorites/:noteId' },
              { path: 'archive' },
              { path: 'archive/:noteId' },
              { path: 'notebooks' },
              { path: 'notebooks/:notebookId' },
              { path: 'notebooks/:notebookId/:noteId' },
              { path: 'tags' },
              { path: 'tags/:tagId' },
              { path: 'tags/:tagId/:noteId' },
              { path: 'search' },
              { path: 'search/:noteId' },
              { path: 'trash' },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
