import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const ROLE_HOME = {
  admin: '/admin',
  driver: '/driver',
  parent: '/',
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(email, password);
      navigate(ROLE_HOME[user.role] ?? '/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-screen">
      <aside className="login-brand">
        <svg className="route-mark" viewBox="0 0 220 120" aria-hidden="true">
          <path d="M10 100 C 60 100, 60 20, 110 20 S 160 100, 210 100" />
          <circle cx="10" cy="100" r="5" className="stop" />
          <circle cx="110" cy="20" r="5" className="stop" />
          <circle cx="210" cy="100" r="6" className="stop stop--active" />
        </svg>
        <h1>Route Watch</h1>
        <p>Live tracking for every school bus, stop, and rider on the route.</p>
      </aside>

      <main className="login-form-panel">
        <form className="login-form" onSubmit={handleSubmit}>
          <h2>Sign in</h2>

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </main>
    </div>
  );
}