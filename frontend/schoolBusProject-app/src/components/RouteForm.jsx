import { useState } from 'react';

const emptyStop = () => ({ name: '', latitude: '', longitude: '' });

export default function RouteForm({ onCreate }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [stops, setStops] = useState([emptyStop()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function updateStop(index, field, value) {
    setStops((prev) =>
      prev.map((stop, i) => (i === index ? { ...stop, [field]: value } : stop)),
    );
  }

  function addStop() {
    setStops((prev) => [...prev, emptyStop()]);
  }

  function removeStop(index) {
    setStops((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Route name is required');
      return;
    }
    if (stops.some((s) => !s.name || s.latitude === '' || s.longitude === '')) {
      setError('Every stop needs a name, latitude, and longitude');
      return;
    }

    setSubmitting(true);
    try {
      await onCreate({
        name,
        description,
        stops: stops.map((s) => ({
          name: s.name,
          latitude: parseFloat(s.latitude),
          longitude: parseFloat(s.longitude),
        })),
      });
      setName('');
      setDescription('');
      setStops([emptyStop()]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="route-form" onSubmit={handleSubmit}>
      <h3>New route</h3>

      <label>
        Route name
        <input value={name} onChange={(e) => setName(e.target.value)} />
      </label>

      <label>
        Description
        <input value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>

      <div className="stops-editor">
        <div className="stops-editor-header">
          <span>Stops, in order</span>
          <button type="button" onClick={addStop}>
            + Add stop
          </button>
        </div>

        {stops.map((stop, index) => (
          <div className="stop-row" key={index}>
            <span className="stop-index">{index + 1}</span>
            <input
              placeholder="Stop name"
              value={stop.name}
              onChange={(e) => updateStop(index, 'name', e.target.value)}
            />
            <input
              placeholder="Latitude"
              value={stop.latitude}
              onChange={(e) => updateStop(index, 'latitude', e.target.value)}
            />
            <input
              placeholder="Longitude"
              value={stop.longitude}
              onChange={(e) => updateStop(index, 'longitude', e.target.value)}
            />
            {stops.length > 1 && (
              <button type="button" onClick={() => removeStop(index)} aria-label="Remove stop">
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <button type="submit" disabled={submitting}>
        {submitting ? 'Creating…' : 'Create route'}
      </button>
    </form>
  );
}