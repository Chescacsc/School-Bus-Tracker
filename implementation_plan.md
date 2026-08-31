# Build Out Remaining School Bus Tracker Features

Complete the backend APIs, admin management panels, driver dashboard, and parent live-tracking view — everything the schema supports but code doesn't yet.

## User Review Required

> [!IMPORTANT]
> **Map library**: I plan to use **Leaflet** (via `react-leaflet`) for the parent's live map. It's free and needs no API key. OpenStreetMap tiles are used by default. If you'd prefer Google Maps or Mapbox instead, let me know.

> [!IMPORTANT]
> **GPS simulation**: Since you're developing locally without a real bus, the driver dashboard will use the **browser's Geolocation API**. On a desktop browser this gives a rough location — enough to prove the flow works.

## Open Questions

> [!NOTE]
> **Route update (PUT)**: The admin can currently create and delete routes, but not edit them. Should I add an edit/update route feature in this phase, or leave it for later?

> [!NOTE]
> **Notifications**: The schema doesn't include a notifications table. Do you want parents to receive alerts (e.g. "bus is 2 stops away") in this phase, or save that for a future iteration?

---

## Proposed Changes

The work is split into 4 phases. Each phase builds on the previous one.

---

### Phase 1 — Backend API Controllers

Add all remaining backend endpoints. Every new controller follows the same pattern as the existing `RouteController`: auth middleware → PDO queries → JSON response.

#### [NEW] [`UserController.php`](file:///c:/Users/Chesca/Documents/Chesca/schoolBusProject/schoolBusTracker/backend/src/controllers/UserController.php)

Admin-only CRUD for managing driver and parent accounts.

| Method | Endpoint | Action |
|--------|----------|--------|
| GET | `/api/admin/users` | List all users (with role filter `?role=driver`) |
| POST | `/api/admin/users` | Create a user (name, email, password, role, phone) |
| DELETE | `/api/admin/users/{id}` | Delete a user |

Password is hashed server-side with `password_hash()`.

#### [NEW] [`BusController.php`](file:///c:/Users/Chesca/Documents/Chesca/schoolBusProject/schoolBusTracker/backend/src/controllers/BusController.php)

Admin-only CRUD for managing buses and assigning routes/drivers.

| Method | Endpoint | Action |
|--------|----------|--------|
| GET | `/api/admin/buses` | List all buses (joined with route name + driver name) |
| POST | `/api/admin/buses` | Create a bus (plate_number, model, capacity, route_id, driver_id) |
| PUT | `/api/admin/buses/{id}` | Update bus assignment (route, driver, status) |
| DELETE | `/api/admin/buses/{id}` | Delete a bus |

#### [NEW] [`RiderController.php`](file:///c:/Users/Chesca/Documents/Chesca/schoolBusProject/schoolBusTracker/backend/src/controllers/RiderController.php)

Admin-only CRUD for managing riders (students, teachers, staff).

| Method | Endpoint | Action |
|--------|----------|--------|
| GET | `/api/admin/riders` | List all riders (joined with stop name + parent name) |
| POST | `/api/admin/riders` | Create a rider (name, rider_type, stop_id, parent_user_id) |
| DELETE | `/api/admin/riders/{id}` | Delete a rider |

#### [NEW] [`DriverController.php`](file:///c:/Users/Chesca/Documents/Chesca/schoolBusProject/schoolBusTracker/backend/src/controllers/DriverController.php)

Driver-only endpoints for trip management and GPS.

| Method | Endpoint | Action |
|--------|----------|--------|
| GET | `/api/driver/me` | Get the driver's assigned bus, route, stops, and riders (uses `route_roster` view) |
| POST | `/api/driver/trip/start` | Set `is_on_trip = TRUE` on the driver's bus |
| POST | `/api/driver/trip/end` | Set `is_on_trip = FALSE` on the driver's bus |
| POST | `/api/driver/location` | Insert a GPS ping into `bus_locations` |

#### [NEW] [`PublicController.php`](file:///c:/Users/Chesca/Documents/Chesca/schoolBusProject/schoolBusTracker/backend/src/controllers/PublicController.php)

No-auth endpoints for the parent view.

| Method | Endpoint | Action |
|--------|----------|--------|
| GET | `/api/routes` | List all routes (name + id only) |
| GET | `/api/routes/{id}/live` | Get route stops + current bus location (from `current_bus_location` view) + `is_on_trip` flag |

#### [MODIFY] [`index.php`](file:///c:/Users/Chesca/Documents/Chesca/schoolBusProject/schoolBusTracker/backend/public/index.php)

Register all new routes in the router table — approximately 15 new entries.

---

### Phase 2 — Admin Dashboard Expansion

Convert the admin dashboard into a tabbed interface with 4 sections: **Routes** (existing), **Users**, **Buses**, **Riders**.

#### [MODIFY] [`AdminDashboard.jsx`](file:///c:/Users/Chesca/Documents/Chesca/schoolBusProject/schoolBusTracker/frontend/schoolBusProject-app/src/pages/admin/AdminDashboard.jsx)

Add a tab bar (Routes | Users | Buses | Riders). Each tab renders its own panel component. The existing routes list + RouteForm move into a `RoutesPanel` section within this file.

#### [NEW] [`UsersPanel.jsx`](file:///c:/Users/Chesca/Documents/Chesca/schoolBusProject/schoolBusTracker/frontend/schoolBusProject-app/src/pages/admin/UsersPanel.jsx)

Table of all users with role badges. "Add user" form (name, email, password, role dropdown, phone). Delete button per row.

#### [NEW] [`BusesPanel.jsx`](file:///c:/Users/Chesca/Documents/Chesca/schoolBusProject/schoolBusTracker/frontend/schoolBusProject-app/src/pages/admin/BusesPanel.jsx)

Table of all buses showing plate, model, capacity, assigned route, assigned driver, status. "Add bus" form with dropdowns for route and driver. Edit/delete per row.

#### [NEW] [`RidersPanel.jsx`](file:///c:/Users/Chesca/Documents/Chesca/schoolBusProject/schoolBusTracker/frontend/schoolBusProject-app/src/pages/admin/RidersPanel.jsx)

Table of all riders showing name, type, assigned stop, parent. "Add rider" form with dropdowns for stop and parent. Delete per row.

#### [MODIFY] [`Admindashboard.css`](file:///c:/Users/Chesca/Documents/Chesca/schoolBusProject/schoolBusTracker/frontend/schoolBusProject-app/src/pages/admin/Admindashboard.css)

Add styles for the tab bar, data tables, forms in each panel, status badges, and role badges.

#### [MODIFY] [`client.js`](file:///c:/Users/Chesca/Documents/Chesca/schoolBusProject/schoolBusTracker/frontend/schoolBusProject-app/src/api/client.js)

Add API functions: `getUsers`, `createUser`, `deleteUser`, `getBuses`, `createBus`, `updateBus`, `deleteBus`, `getRiders`, `createRider`, `deleteRider`.

---

### Phase 3 — Driver Dashboard

#### [MODIFY] [`DriverDashboard.jsx`](file:///c:/Users/Chesca/Documents/Chesca/schoolBusProject/schoolBusTracker/frontend/schoolBusProject-app/src/pages/driver/DriverDashboard.jsx)

Replace placeholder with full implementation:
- Fetch `/api/driver/me` on mount to get assigned bus, route, and rider roster
- **Trip toggle**: prominent Start Trip / End Trip button that calls the backend
- **GPS tracking**: when trip is active, use `navigator.geolocation.watchPosition()` to send location pings every 10 seconds via `POST /api/driver/location`
- **Roster display**: stops listed in order, with riders grouped under each stop
- Header showing bus plate number, route name, trip status indicator

#### [NEW] [`DriverDashboard.css`](file:///c:/Users/Chesca/Documents/Chesca/schoolBusProject/schoolBusTracker/frontend/schoolBusProject-app/src/pages/driver/DriverDashboard.css)

Styles for the driver view — trip status banner, roster cards, start/end buttons.

#### [MODIFY] [`client.js`](file:///c:/Users/Chesca/Documents/Chesca/schoolBusProject/schoolBusTracker/frontend/schoolBusProject-app/src/api/client.js)

Add: `getDriverInfo`, `startTrip`, `endTrip`, `sendLocation`.

---

### Phase 4 — Parent Live Tracking View

#### Install dependency

```bash
npm install leaflet react-leaflet
```

#### [MODIFY] [`ParentView.jsx`](file:///c:/Users/Chesca/Documents/Chesca/schoolBusProject/schoolBusTracker/frontend/schoolBusProject-app/src/pages/ParentView.jsx)

Replace placeholder with full implementation:
- **Route picker**: dropdown populated from `GET /api/routes`
- **Live map**: Leaflet map centered on the route's stops
  - Stop markers (numbered, in route order)
  - Bus marker (animated, shows current position from `GET /api/routes/{id}/live`)
  - Auto-refreshes every 5 seconds while a trip is active
- **Info panel**: route name, bus plate, trip status, speed
- **"Bus not on trip"** state shown when `is_on_trip` is false

#### [NEW] [`ParentView.css`](file:///c:/Users/Chesca/Documents/Chesca/schoolBusProject/schoolBusTracker/frontend/schoolBusProject-app/src/pages/ParentView.css)

Map container sizing, route picker styling, info panel overlay on the map.

#### [MODIFY] [`client.js`](file:///c:/Users/Chesca/Documents/Chesca/schoolBusProject/schoolBusTracker/frontend/schoolBusProject-app/src/api/client.js)

Add: `getPublicRoutes`, `getRouteLive`.

#### [MODIFY] [`index.html`](file:///c:/Users/Chesca/Documents/Chesca/schoolBusProject/schoolBusTracker/frontend/schoolBusProject-app/index.html)

Add Leaflet CSS from CDN in `<head>` for proper map tile rendering.

---

## Verification Plan

### Automated Tests
- Not applicable yet (no test framework set up).

### Manual Verification

1. **Backend**: Use `curl` or the browser to test each new endpoint — verify correct JSON responses and proper 401/403 for unauthorized access.
2. **Admin dashboard**: Log in as admin → switch between all 4 tabs → create/delete users, buses, riders → verify data persists.
3. **Driver dashboard**: Log in as a driver → verify route/roster loads → start trip → confirm `is_on_trip` flips in DB → verify GPS pings are inserted into `bus_locations`.
4. **Parent view**: Open `/` without logging in → pick a route → see stops on map → when a driver starts a trip, see the bus marker appear and move on refresh.
