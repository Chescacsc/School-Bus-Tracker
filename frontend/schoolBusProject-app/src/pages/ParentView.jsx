import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getPublicRoutes, getRouteLive } from '../api/client';
import './ParentView.css';

// Fix Leaflet's default icon path issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const busIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

const userIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1077/1077114.png',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

const targetStopIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1483/1483336.png', // A distinct pin for their stop
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

// Component to handle auto-panning to user location on first load
function MapController({ userLocation, liveData, selectedRouteId, selectedStopId }) {
  const map = useMap();
  const [initialPanDone, setInitialPanDone] = useState(false);

  // Initial pan to user location
  useEffect(() => {
    if (userLocation && !initialPanDone && !selectedRouteId) {
      map.setView(userLocation, 14, { animate: true });
      setInitialPanDone(true);
    }
  }, [userLocation, initialPanDone, selectedRouteId, map]);

  // Fit bounds when route/live data loads
  useEffect(() => {
    if (liveData && liveData.stops && liveData.stops.length > 0) {
      const bounds = L.latLngBounds(liveData.stops.map(s => [s.latitude, s.longitude]));
      if (liveData.location) bounds.extend([liveData.location.latitude, liveData.location.longitude]);
      if (userLocation) bounds.extend(userLocation);
      map.fitBounds(bounds, { padding: [50, 50], animate: true });
    }
  }, [liveData, userLocation, map]);

  return null;
}

export default function ParentView() {
  const [routes, setRoutes] = useState([]);
  
  // UX Steps: 'SELECT_ROUTE' -> 'SELECT_STOP' -> 'TRACKING'
  const [step, setStep] = useState('SELECT_ROUTE');
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [selectedStopId, setSelectedStopId] = useState('');
  
  const [liveData, setLiveData] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  
  const pollIntervalRef = useRef(null);

  useEffect(() => {
    async function fetchRoutes() {
      try {
        const data = await getPublicRoutes();
        setRoutes(data);
      } catch (err) {
        console.error("Failed to load routes", err);
      }
    }
    fetchRoutes();
  }, []);

  // Track viewer location
  useEffect(() => {
    if ('geolocation' in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
        (err) => console.warn('User location error:', err),
        { enableHighAccuracy: true, maximumAge: 10000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  const fetchLiveRoute = useCallback(async (routeId) => {
    if (!routeId) return;
    try {
      const data = await getRouteLive(routeId);
      setLiveData(data);
    } catch (err) {
      console.error('Could not load live route data.');
    }
  }, []);

  useEffect(() => {
    if (selectedRouteId) {
      fetchLiveRoute(selectedRouteId);
      pollIntervalRef.current = setInterval(() => fetchLiveRoute(selectedRouteId), 5000);
    } else {
      setLiveData(null);
    }

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [selectedRouteId, fetchLiveRoute]);

  const handleRouteSelect = (routeId) => {
    setSelectedRouteId(routeId);
    setStep('SELECT_STOP');
  };

  const handleStopSelect = (stopId) => {
    setSelectedStopId(stopId);
    setStep('TRACKING');
  };

  const handleReset = () => {
    setStep('SELECT_ROUTE');
    setSelectedRouteId('');
    setSelectedStopId('');
    setLiveData(null);
  };

  const defaultCenter = [51.505, -0.09];
  const routePath = liveData?.stops?.map(s => [parseFloat(s.latitude), parseFloat(s.longitude)]) || [];
  const selectedRoute = routes.find(r => r.id === parseInt(selectedRouteId, 10));
  const selectedStop = liveData?.stops?.find(s => s.id === parseInt(selectedStopId, 10));

  return (
    <div className="parent-view">
      <header className="parent-header-minimal">
        <div className="brand">
          <svg className="route-mark-small" viewBox="0 0 220 120" aria-hidden="true">
            <path d="M10 100 C 60 100, 60 20, 110 20 S 160 100, 210 100" />
            <circle cx="10" cy="100" r="10" className="stop" />
            <circle cx="110" cy="20" r="10" className="stop" />
            <circle cx="210" cy="100" r="12" className="stop stop--active" />
          </svg>
          <h1>Tracker</h1>
        </div>
        <Link to="/login" className="login-link">Staff Login</Link>
      </header>

      <main className="map-container-wrapper">
        <MapContainer 
          center={defaultCenter} 
          zoom={3} 
          zoomControl={false}
          scrollWheelZoom={true} 
          className="leaflet-map"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <MapController 
            userLocation={userLocation} 
            liveData={liveData} 
            selectedRouteId={selectedRouteId} 
            selectedStopId={selectedStopId}
          />
          
          {liveData && (
            <>
              {routePath.length > 1 && (
                <Polyline positions={routePath} color="var(--accent)" weight={4} opacity={0.6} />
              )}
              
              {liveData.stops?.map((stop, i) => {
                const isSelected = stop.id === parseInt(selectedStopId, 10);
                return (
                  <Marker 
                    key={stop.id} 
                    position={[parseFloat(stop.latitude), parseFloat(stop.longitude)]}
                    icon={isSelected ? targetStopIcon : new L.Icon.Default()}
                    zIndexOffset={isSelected ? 500 : 0}
                  >
                    <Popup><strong>{isSelected ? 'Your Stop: ' : ''}{stop.name}</strong></Popup>
                  </Marker>
                );
              })}

              {liveData.location && (
                <Marker 
                  position={[parseFloat(liveData.location.latitude), parseFloat(liveData.location.longitude)]}
                  icon={busIcon}
                  zIndexOffset={1000}
                >
                  <Popup>
                    <strong>{liveData.bus?.plate_number}</strong>
                  </Popup>
                </Marker>
              )}
            </>
          )}

          {userLocation && (
            <Marker position={userLocation} icon={userIcon} zIndexOffset={900}>
              <Popup><strong>You are here</strong></Popup>
            </Marker>
          )}
        </MapContainer>

        {/* Bolt-style Bottom Sheet */}
        <div className="bottom-sheet">
          <div className="sheet-handle"></div>

          {step === 'SELECT_ROUTE' && (
            <div className="sheet-content">
              <h2>Where's the bus?</h2>
              <p className="sheet-subtitle">Select a route to track its progress</p>
              <div className="route-list">
                {routes.map(r => (
                  <button key={r.id} className="list-item-btn" onClick={() => handleRouteSelect(r.id)}>
                    <div className="item-icon route-icon">R</div>
                    <div className="item-text">
                      <span className="item-title">{r.name}</span>
                      {r.description && <span className="item-desc">{r.description}</span>}
                    </div>
                  </button>
                ))}
                {routes.length === 0 && <p className="empty-msg">No routes available right now.</p>}
              </div>
            </div>
          )}

          {step === 'SELECT_STOP' && (
            <div className="sheet-content">
              <button className="back-btn" onClick={handleReset}>&larr; Back</button>
              <h2>Select your stop</h2>
              <p className="sheet-subtitle">{selectedRoute?.name}</p>
              
              {!liveData ? (
                <p className="empty-msg">Loading stops...</p>
              ) : (
                <div className="route-list">
                  {liveData.stops?.map((s, i) => (
                    <button key={s.id} className="list-item-btn" onClick={() => handleStopSelect(s.id)}>
                      <div className="item-icon stop-icon">{i + 1}</div>
                      <div className="item-text">
                        <span className="item-title">{s.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 'TRACKING' && (
            <div className="sheet-content tracking-mode">
              <div className="tracking-header">
                <button className="back-btn" onClick={() => setStep('SELECT_STOP')}>&larr; Change stop</button>
                <button className="reset-btn" onClick={handleReset}>Change route</button>
              </div>
              
              <div className="tracking-info">
                <div className="tracking-stop">
                  <span className="label">Your Stop</span>
                  <h2 className="target-stop-name">{selectedStop?.name}</h2>
                </div>
                
                <div className="tracking-status-box">
                  {liveData?.bus ? (
                    <>
                      <div className="bus-details">
                        <span className="bus-plate">{liveData.bus.plate_number}</span>
                        <span className={`bus-status ${liveData.bus.is_on_trip ? 'active' : 'inactive'}`}>
                          {liveData.bus.is_on_trip ? 'ON ROUTE' : 'OFF DUTY'}
                        </span>
                      </div>
                      <p className="bus-driver">Driver: {liveData.bus.driver_name || 'Unassigned'}</p>
                      
                      {liveData.location ? (
                        <p className="last-updated">Last ping: {new Date(liveData.location.recorded_at + 'Z').toLocaleTimeString()}</p>
                      ) : (
                        <p className="last-updated">Waiting for bus GPS...</p>
                      )}
                    </>
                  ) : (
                    <p className="empty-msg">No bus is currently assigned to this route.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}