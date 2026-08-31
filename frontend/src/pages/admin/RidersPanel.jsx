import { useEffect, useState, useCallback } from 'react';
import {
  getRiders, createRider, deleteRider,
  getRoutes, getUsers,
} from '../../api/client';

export default function RidersPanel() {
  const [riders, setRiders] = useState([]);
  const [stops, setStops] = useState([]);
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [riderType, setRiderType] = useState('student');
  const [stopId, setStopId] = useState('');
  const [parentId, setParentId] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [riderData, routeData, parentData] = await Promise.all([
        getRiders(),
        getRoutes(),       // includes stops within each route
        getUsers('parent'),
      ]);
      setRiders(riderData);

      // Flatten routes → stops for the dropdown
      const allStops = [];
      routeData.forEach((route) => {
        (route.stops || []).forEach((stop) => {
          allStops.push({
            ...stop,
            routeName: route.name,
          });
        });
      });
      setStops(allStops);
      setParents(parentData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e) {
    e.preventDefault();
    setFormError('');
    if (!name.trim()) {
      setFormError('Rider name is required');
      return;
    }
    if (!stopId) {
      setFormError('Please select a stop');
      return;
    }
    setSubmitting(true);
    try {
      await createRider({
        name,
        rider_type: riderType,
        stop_id: parseInt(stopId, 10),
        parent_user_id: parentId ? parseInt(parentId, 10) : null,
      });
      setName(''); setRiderType('student'); setStopId(''); setParentId('');
      await load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this rider?')) return;
    await deleteRider(id);
    await load();
  }

  const typeBadge = (t) => {
    const colors = { student: '#6366f1', teacher: '#0891b2', staff: '#f59e0b' };
    return (
      <span className="badge" style={{ background: colors[t] || '#888' }}>
        {t}
      </span>
    );
  };

  return (
    <div className="panel">
      <div className="panel-grid">
        <section className="panel-list">
          <h2>Riders</h2>
          {loading && <p>Loading…</p>}
          {error && <p className="form-error" role="alert">{error}</p>}

          {!loading && riders.length === 0 && <p>No riders yet.</p>}

          <div className="table-wrap">
            {!loading && riders.length > 0 && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Stop</th>
                    <th>Route</th>
                    <th>Parent</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {riders.map((r) => (
                    <tr key={r.id}>
                      <td>{r.name}</td>
                      <td>{typeBadge(r.rider_type)}</td>
                      <td>{r.stop_name || '—'}</td>
                      <td>{r.route_name || '—'}</td>
                      <td>{r.parent_name || '—'}</td>
                      <td>
                        <button className="delete-btn" onClick={() => handleDelete(r.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <form className="panel-form" onSubmit={handleCreate}>
          <h3>Add rider</h3>

          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>

          <label>
            Type
            <select value={riderType} onChange={(e) => setRiderType(e.target.value)}>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="staff">Staff</option>
            </select>
          </label>

          <label>
            Stop
            <select value={stopId} onChange={(e) => setStopId(e.target.value)} required>
              <option value="">Select a stop…</option>
              {stops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.routeName})
                </option>
              ))}
            </select>
          </label>

          <label>
            Parent account
            <select value={parentId} onChange={(e) => setParentId(e.target.value)}>
              <option value="">None</option>
              {parents.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
              ))}
            </select>
          </label>

          {formError && <p className="form-error" role="alert">{formError}</p>}

          <button type="submit" disabled={submitting}>
            {submitting ? 'Creating…' : 'Add rider'}
          </button>
        </form>
      </div>
    </div>
  );
}
