import { useEffect, useState, useCallback } from 'react';
import { getRoutes, createRoute, deleteRoute } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import RouteForm from '../../components/RouteForm';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRoutes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getRoutes();
      setRoutes(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoutes();
  }, [loadRoutes]);

  async function handleCreate(payload) {
    await createRoute(payload);
    await loadRoutes();
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this route and all its stops?')) return;
    await deleteRoute(id);
    await loadRoutes();
  }

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Admin</h1>
          <p>Signed in as {user.name}</p>
        </div>
        <button className="logout-button" onClick={logout}>
          Log out
        </button>
      </header>

      <div className="admin-layout">
        <section className="routes-list">
          <h2>Routes</h2>
          {loading && <p>Loading…</p>}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {!loading && routes.length === 0 && <p>No routes yet — create the first one.</p>}

          {routes.map((route) => (
            <div className="route-card" key={route.id}>
              <div className="route-card-head">
                <h3>{route.name}</h3>
                <button onClick={() => handleDelete(route.id)}>Delete</button>
              </div>
              {route.description && <p>{route.description}</p>}
              <ol className="stop-list">
                {route.stops.map((stop) => (
                  <li key={stop.id}>{stop.name}</li>
                ))}
              </ol>
            </div>
          ))}
        </section>

        <RouteForm onCreate={handleCreate} />
      </div>
    </div>
  );
}