import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthLayout } from './layouts/AuthLayout.jsx';
import { AppLayout } from './layouts/AppLayout.jsx';
import { ProtectedRoute } from '../features/auth/components/ProtectedRoute.jsx';
import { PublicRoute } from '../features/auth/components/PublicRoute.jsx';
import { AuthPage } from '../pages/AuthPage.jsx';
import { NotFoundPage } from '../pages/NotFoundPage.jsx';
import { WorkspacePage } from '../pages/WorkspacePage.jsx';

export const router = createBrowserRouter([
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
            element: <Navigate to="/workspace/notes" replace />,
          },
          { path: '/workspace/notes', element: <WorkspacePage /> },
          { path: '/workspace/notes/:noteId', element: <WorkspacePage /> },
          { path: '/workspace/favorites', element: <WorkspacePage /> },
          { path: '/workspace/favorites/:noteId', element: <WorkspacePage /> },
          { path: '/workspace/archive', element: <WorkspacePage /> },
          { path: '/workspace/archive/:noteId', element: <WorkspacePage /> },
          { path: '/workspace/tags', element: <WorkspacePage /> },
          { path: '/workspace/tags/:tagId', element: <WorkspacePage /> },
          {
            path: '/workspace/tags/:tagId/:noteId',
            element: <WorkspacePage />,
          },
          { path: '/workspace/search', element: <WorkspacePage /> },
          { path: '/workspace/trash', element: <WorkspacePage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
