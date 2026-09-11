import { useEffect, useState, useCallback } from 'react';
import { getRoutes, createRoute, deleteRoute } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import RouteForm from '../../components/RouteForm';
import UsersPanel from './UsersPanel';
import BusesPanel from './BusesPanel';
import RidersPanel from './RidersPanel';
import './AdminDashboard.css';

const TABS = ['Routes', 'Users', 'Buses', 'Riders'];

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('Routes');
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRoutes = useCallback(async () => {
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
    let ignore = false;
    async function init() {
      if (activeTab === 'Routes' && !ignore) {
        await loadRoutes();
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, [activeTab, loadRoutes]);

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

      <nav className="tab-bar">
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`tab-btn${activeTab === tab ? ' active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>

      <div className="tab-content">
        {activeTab === 'Routes' && (
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
        )}

        {activeTab === 'Users' && <UsersPanel />}
        {activeTab === 'Buses' && <BusesPanel />}
        {activeTab === 'Riders' && <RidersPanel />}
      </div>
    </div>
  );
}