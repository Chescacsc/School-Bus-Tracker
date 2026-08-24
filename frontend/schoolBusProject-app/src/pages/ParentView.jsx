import { Link } from 'react-router-dom';

export default function ParentView() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', margin: 0 }}>Track a route</h1>
      <p style={{ color: 'var(--ink-soft)' }}>
        Route picker, live map, and ETA go here next.
      </p>
      <p>
        <Link to="/login" style={{ color: 'var(--ink)' }}>
          Admin or driver? Sign in
        </Link>
      </p>
    </div>
  );
}