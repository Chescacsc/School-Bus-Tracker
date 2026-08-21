-- ============================================================
-- School Bus Tracking System — Database Schema
-- MySQL 8+
-- ============================================================

CREATE DATABASE IF NOT EXISTS school_bus_tracker
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE school_bus_tracker;

-- ============================================================
-- users: admins, drivers, and parents all authenticate here
-- ============================================================
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','driver','parent') NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- routes: a named bus route (e.g. "North Hill Route")
-- ============================================================
CREATE TABLE routes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT
);

-- ============================================================
-- stops: ordered stations along a route, each with coordinates.
-- UNIQUE(route_id, stop_order) stops two stops on the same route
-- from ever sharing a position in the sequence.
-- ============================================================
CREATE TABLE stops (
  id INT AUTO_INCREMENT PRIMARY KEY,
  route_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  stop_order INT NOT NULL,
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
  UNIQUE (route_id, stop_order)
);

-- ============================================================
-- buses: each bus currently has at most one route and one driver.
-- is_on_trip flips on/off when the driver starts/ends a run, so the
-- tracking views don't show a stale position for a parked bus.
-- ============================================================
CREATE TABLE buses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  plate_number VARCHAR(20) UNIQUE NOT NULL,
  model VARCHAR(50),
  capacity INT,
  route_id INT,
  driver_id INT,
  status ENUM('active','inactive','maintenance') DEFAULT 'active',
  is_on_trip BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE SET NULL,
  FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- riders: every student, teacher, or staff member who boards at a
-- specific stop. Route is NOT duplicated here — it's derived via
-- stop_id -> stops.route_id, so there's one source of truth for it.
-- parent_user_id is nullable: a teacher/staff rider might log in
-- themselves, while a student's row just points at a parent account.
-- ============================================================
CREATE TABLE riders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  rider_type ENUM('student','teacher','staff') NOT NULL,
  stop_id INT NOT NULL,
  parent_user_id INT NULL,
  FOREIGN KEY (stop_id) REFERENCES stops(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- bus_locations: append-only GPS pings sent by the driver's app
-- every 5-10s while a trip is active. Indexed for fast "where is
-- this bus right now" lookups even as the table grows large.
-- ============================================================
CREATE TABLE bus_locations (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  bus_id INT NOT NULL,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  speed_kmh DECIMAL(5,2),
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE,
  INDEX idx_bus_time (bus_id, recorded_at DESC)
);

-- ============================================================
-- VIEW: most recent GPS ping per bus — the query the /live and
-- /eta endpoints run instead of scanning all of bus_locations.
-- ============================================================
CREATE VIEW current_bus_location AS
SELECT bl.bus_id, bl.latitude, bl.longitude, bl.speed_kmh, bl.recorded_at
FROM bus_locations bl
INNER JOIN (
  SELECT bus_id, MAX(recorded_at) AS max_time
  FROM bus_locations
  GROUP BY bus_id
) latest ON bl.bus_id = latest.bus_id AND bl.recorded_at = latest.max_time;

-- ============================================================
-- VIEW: riders grouped by stop, in route order — powers the
-- driver's roster (GET /api/driver/me) in a single SELECT.
-- ============================================================
CREATE VIEW route_roster AS
SELECT s.route_id, s.id AS stop_id, s.name AS stop_name, s.stop_order,
       r.id AS rider_id, r.name AS rider_name, r.rider_type
FROM stops s
LEFT JOIN riders r ON r.stop_id = s.id
ORDER BY s.route_id, s.stop_order;