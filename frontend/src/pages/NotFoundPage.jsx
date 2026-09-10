import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main>
      <h1>Page not found</h1>
      <p>The requested page does not exist.</p>
      <Link to="/workspace/notes">Return to workspace</Link>
    </main>
  );
}
