import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '../context/AuthContext';
import 'leaflet/dist/leaflet.css';
import './Login.css';

/* ── fix default marker icons broken by Vite/Webpack ───────── */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const ROLE_HOME = {
  admin:  '/admin',
  driver: '/driver',
  parent: '/',
};

/* Nairobi as fallback while geolocation resolves */
const FALLBACK = [-1.2921, 36.8219];

/* Sub-component: flies to the user's real position once acquired */
function FlyToUser({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 15, { duration: 1.4 });
  }, [map, position]);
  return null;
}

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [error,      setError]      = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userPos,    setUserPos]    = useState(null);

  /* ── ask for real location once ──────────────────────────── */
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setUserPos([coords.latitude, coords.longitude]),
      () => { /* silently fall back to Nairobi */ }
    );
  }, []);

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

      {/* ── LEFT: fully interactive live map ─────────────────── */}
      <aside className="login-map-panel" aria-label="Live map preview">
        <MapContainer
          center={userPos ?? FALLBACK}
          zoom={13}
          zoomControl={true}
          scrollWheelZoom={true}
          dragging={true}
          doubleClickZoom={true}
          keyboard={true}
          attributionControl={false}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Dark CartoDB tile — matches right-panel theme */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
            maxZoom={20}
          />

          <FlyToUser position={userPos} />

          {userPos && (
            <Marker position={userPos}>
              <Popup>You are here</Popup>
            </Marker>
          )}
        </MapContainer>

        {/* Branding badge — bottom-left corner */}
        <div className="login-map-overlay">
          <div className="login-map-badge">
            <svg className="route-mark" viewBox="0 0 220 120" aria-hidden="true">
              <path d="M10 100 C 60 100, 60 20, 110 20 S 160 100, 210 100" />
              <circle cx="10"  cy="100" r="5" className="stop" />
              <circle cx="110" cy="20"  r="5" className="stop" />
              <circle cx="210" cy="100" r="6" className="stop stop--active" />
            </svg>
            <h1>Route Watch</h1>
            <p>Live tracking for every school bus, stop, and rider on the route.</p>
            <Link to="/" className="view-map-btn">Open full map →</Link>
          </div>
        </div>
      </aside>

      {/* ── RIGHT: sign-in form — dark theme to match the map ── */}
      <main className="login-form-panel">
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-form-header">
            <span className="login-form-icon" aria-hidden="true">🚌</span>
            <h2>Staff Portal</h2>
            <p className="login-form-sub">Sign in to manage routes &amp; riders</p>
          </div>

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              placeholder="you@school.edu"
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
              placeholder="••••••••"
              required
            />
          </label>

          {error && (
            <p className="login-error" role="alert">{error}</p>
          )}

          <button type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="back-to-map">
          <Link to="/">← Back to Live Map</Link>
        </p>
      </main>
    </div>
  );
}