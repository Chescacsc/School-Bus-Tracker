import { useEffect, useState, useCallback } from 'react';
import { getUsers, createUser, deleteUser } from '../../api/client';

export default function UsersPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('driver');
  const [phone, setPhone] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
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
    if (!name.trim() || !email.trim() || !password) {
      setFormError('Name, email, and password are required');
      return;
    }
    setSubmitting(true);
    try {
      await createUser({ name, email, password, role, phone: phone || null });
      setName(''); setEmail(''); setPassword(''); setPhone(''); setRole('driver');
      await load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this user?')) return;
    await deleteUser(id);
    await load();
  }

  const roleBadge = (r) => {
    const colors = { admin: '#6366f1', driver: '#0891b2', parent: '#16a34a' };
    return (
      <span className="badge" style={{ background: colors[r] || '#888' }}>
        {r}
      </span>
    );
  };

  return (
    <div className="panel">
      <div className="panel-grid">
        <section className="panel-list">
          <h2>Users</h2>
          {loading && <p>Loading…</p>}
          {error && <p className="form-error" role="alert">{error}</p>}

          {!loading && users.length === 0 && <p>No users yet.</p>}

          <div className="table-wrap">
            {!loading && users.length > 0 && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Phone</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>{roleBadge(u.role)}</td>
                      <td>{u.phone || '—'}</td>
                      <td>
                        <button className="delete-btn" onClick={() => handleDelete(u.id)}>
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
          <h3>Add user</h3>

          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>

          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>

          <label>
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>

          <label>
            Role
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="driver">Driver</option>
              <option value="parent">Parent</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          <label>
            Phone
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" />
          </label>

          {formError && <p className="form-error" role="alert">{formError}</p>}

          <button type="submit" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create user'}
          </button>
        </form>
      </div>
    </div>
  );
}
