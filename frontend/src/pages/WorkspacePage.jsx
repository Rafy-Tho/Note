import { Workspace } from '../features/workspace/components/Workspace.jsx';
import { Outlet } from 'react-router-dom';

export function WorkspacePage() {
  return (
    <>
      <Workspace />
      <Outlet />
    </>
  );
}
