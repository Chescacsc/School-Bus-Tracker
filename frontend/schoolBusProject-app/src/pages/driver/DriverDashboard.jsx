import { useEffect, useState, useCallback, useRef } from 'react';
import { getDriverInfo, startTrip, endTrip, sendLocation } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import './DriverDashboard.css';

export default function DriverDashboard() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [bus, setBus] = useState(null);
  const [route, setRoute] = useState(null);
  const [roster, setRoster] = useState([]);
  
  const [isOnTrip, setIsOnTrip] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');
  
  const watchIdRef = useRef(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDriverInfo();
      setBus(data.bus);
      setRoute(data.route);
      setRoster(data.roster || []);
      if (data.bus) {
        setIsOnTrip(data.bus.is_on_trip);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    return () => stopLocationTracking();
  }, [loadData]);

  // When trip status changes, manage location tracking
  useEffect(() => {
    if (isOnTrip) {
      startLocationTracking();
    } else {
      stopLocationTracking();
    }
  }, [isOnTrip]);

  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser.');
      return;
    }

    setLocationStatus('Waiting for GPS signal...');
    
    // We send location periodically. In a real app, we'd use watchPosition 
    // or a background service with high accuracy.
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, speed } = position.coords;
        // Convert speed (m/s) to km/h, default to 0 if null
        const speedKmh = speed ? (speed * 3.6).toFixed(1) : 0;
        
        setLocationStatus(`Last update: ${new Date().toLocaleTimeString()}`);
        sendLocation(latitude, longitude, speedKmh).catch(err => {
          console.error("Failed to send location:", err);
          setLocationStatus('Error sending location data.');
        });
      },
      (err) => {
        console.error("Geolocation error:", err);
        setLocationStatus(`GPS Error: ${err.message}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const stopLocationTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setLocationStatus('');
  };

  const handleStartTrip = async () => {
    try {
      setError('');
      await startTrip();
      setIsOnTrip(true);
    } catch (err) {
      setError(`Failed to start trip: ${err.message}`);
    }
  };

  const handleEndTrip = async () => {
    try {
      setError('');
      await endTrip();
      setIsOnTrip(false);
    } catch (err) {
      setError(`Failed to end trip: ${err.message}`);
    }
  };

  if (loading) return <div className="driver-dashboard"><p className="status-msg">Loading...</p></div>;
  if (error) return <div className="driver-dashboard"><p className="error-msg">Error: {error}</p></div>;
  if (!bus) {
    return (
      <div className="driver-dashboard">
        <header className="dashboard-header">
          <div>
            <h1>Driver</h1>
            <p>Signed in as {user.name}</p>
          </div>
          <button className="logout-button" onClick={logout}>Log out</button>
        </header>
        <div className="no-assignment">
          <h2>No Bus Assigned</h2>
          <p>Please contact an administrator to get assigned to a bus and route.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="driver-dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Driver: {user.name}</h1>
          <p>Bus: {bus.plate_number} {bus.model ? `(${bus.model})` : ''}</p>
        </div>
        <button className="logout-button" onClick={logout}>Log out</button>
      </header>

      <main className="driver-main">
        <section className="trip-control-panel">
          <h2>Trip Control</h2>
          <div className="trip-status">
            <span className={`status-indicator ${isOnTrip ? 'active' : 'inactive'}`}>
              {isOnTrip ? 'ON ROUTE' : 'OFF DUTY'}
            </span>
          </div>
          
          {isOnTrip ? (
            <div className="trip-active-controls">
              <p className="gps-status">{locationStatus || 'Tracking active'}</p>
              <button className="trip-btn stop-trip" onClick={handleEndTrip}>
                End Trip
              </button>
            </div>
          ) : (
            <button className="trip-btn start-trip" onClick={handleStartTrip}>
              Start Trip
            </button>
          )}
        </section>

        <section className="roster-panel">
          <h2>Assigned Route: {route ? route.name : 'Unknown Route'}</h2>
          
          {roster.length === 0 ? (
            <p className="status-msg">No stops configured for this route.</p>
          ) : (
            <div className="stop-cards">
              {roster.map((stop) => (
                <div key={stop.stop_id} className="stop-card">
                  <div className="stop-header">
                    <span className="stop-order">{stop.stop_order}</span>
                    <h3 className="stop-name">{stop.stop_name}</h3>
                  </div>
                  
                  {stop.riders && stop.riders.length > 0 ? (
                    <ul className="rider-list">
                      {stop.riders.map(rider => (
                        <li key={rider.id} className="rider-item">
                          <span className="rider-name">{rider.name}</span>
                          <span className={`rider-badge badge-${rider.type}`}>{rider.type}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="no-riders">No riders assigned to this stop.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}