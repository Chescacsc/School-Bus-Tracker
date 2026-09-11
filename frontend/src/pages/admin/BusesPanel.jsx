import { useEffect, useState, useCallback } from 'react';
import {
  getBuses, createBus, updateBus, deleteBus,
  getRoutes, getUsers,
} from '../../api/client';

export default function BusesPanel() {
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [plate, setPlate] = useState('');
  const [model, setModel] = useState('');
  const [capacity, setCapacity] = useState('');
  const [routeId, setRouteId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editRoute, setEditRoute] = useState('');
  const [editDriver, setEditDriver] = useState('');
  const [editStatus, setEditStatus] = useState('');

  const load = useCallback(async () => {
    try {
      const [busData, routeData, userData] = await Promise.all([
        getBuses(),
        getRoutes(),
        getUsers('driver'),
      ]);
      setBuses(busData);
      setRoutes(routeData);
      setDrivers(userData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function init() {
      if (!ignore) {
        await load();
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, [load]);

  async function handleCreate(e) {
    e.preventDefault();
    setFormError('');
    if (!plate.trim()) {
      setFormError('Plate number is required');
      return;
    }
    setSubmitting(true);
    try {
      await createBus({
        plate_number: plate,
        model: model || null,
        capacity: capacity ? parseInt(capacity, 10) : null,
        route_id: routeId || null,
        driver_id: driverId || null,
      });
      setPlate(''); setModel(''); setCapacity(''); setRouteId(''); setDriverId('');
      await load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this bus?')) return;
    await deleteBus(id);
    await load();
  }

  function startEdit(bus) {
    setEditingId(bus.id);
    setEditRoute(bus.route_id || '');
    setEditDriver(bus.driver_id || '');
    setEditStatus(bus.status);
  }

  async function saveEdit(id) {
    await updateBus(id, {
      route_id: editRoute || null,
      driver_id: editDriver || null,
      status: editStatus,
    });
    setEditingId(null);
    await load();
  }

  const statusBadge = (s) => {
    const colors = { active: '#16a34a', inactive: '#9ca3af', maintenance: '#f59e0b' };
    return (
      <span className="badge" style={{ background: colors[s] || '#888' }}>
        {s}
      </span>
    );
  };

  return (
    <div className="panel">
      <div className="panel-grid">
        <section className="panel-list">
          <h2>Buses</h2>
          {loading && <p>Loading…</p>}
          {error && <p className="form-error" role="alert">{error}</p>}

          {!loading && buses.length === 0 && <p>No buses yet.</p>}

          <div className="table-wrap">
            {!loading && buses.length > 0 && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Plate</th>
                    <th>Model</th>
                    <th>Cap.</th>
                    <th>Route</th>
                    <th>Driver</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {buses.map((b) => (
                    <tr key={b.id}>
                      <td>{b.plate_number}</td>
                      <td>{b.model || '—'}</td>
                      <td>{b.capacity || '—'}</td>

                      {editingId === b.id ? (
                        <>
                          <td>
                            <select value={editRoute} onChange={(e) => setEditRoute(e.target.value)}>
                              <option value="">None</option>
                              {routes.map((r) => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <select value={editDriver} onChange={(e) => setEditDriver(e.target.value)}>
                              <option value="">None</option>
                              {drivers.map((d) => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                              <option value="maintenance">Maintenance</option>
                            </select>
                          </td>
                          <td>
                            <button className="save-btn" onClick={() => saveEdit(b.id)}>Save</button>
                            <button className="cancel-btn" onClick={() => setEditingId(null)}>Cancel</button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>{b.route_name || '—'}</td>
                          <td>{b.driver_name || '—'}</td>
                          <td>{statusBadge(b.status)}</td>
                          <td>
                            <button className="edit-btn" onClick={() => startEdit(b)}>Edit</button>
                            <button className="delete-btn" onClick={() => handleDelete(b.id)}>Delete</button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <form className="panel-form" onSubmit={handleCreate}>
          <h3>Add bus</h3>

          <label>
            Plate number
            <input value={plate} onChange={(e) => setPlate(e.target.value)} required />
          </label>

          <label>
            Model
            <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Optional" />
          </label>

          <label>
            Capacity
            <input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="Optional" />
          </label>

          <label>
            Route
            <select value={routeId} onChange={(e) => setRouteId(e.target.value)}>
              <option value="">None</option>
              {routes.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </label>

          <label>
            Driver
            <select value={driverId} onChange={(e) => setDriverId(e.target.value)}>
              <option value="">None</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </label>

          {formError && <p className="form-error" role="alert">{formError}</p>}

          <button type="submit" disabled={submitting}>
            {submitting ? 'Creating…' : 'Add bus'}
          </button>
        </form>
      </div>
    </div>
  );
}
