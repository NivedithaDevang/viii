PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'ADMIN',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS service_categories (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY,
  category_id INTEGER NOT NULL,
  sub_category TEXT,
  service_name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 45,
  image_url TEXT,
  is_featured INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES service_categories(id)
);

CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  whatsapp_number TEXT,
  email TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT NOT NULL UNIQUE,
  customer_id INTEGER NOT NULL,
  service_id INTEGER,
  service_name_snapshot TEXT NOT NULL,
  price_snapshot REAL NOT NULL,
  duration_snapshot INTEGER NOT NULL,
  appointment_date TEXT NOT NULL,
  appointment_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  notes TEXT,
  internal_notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_booking_slot ON bookings(appointment_date, appointment_time, status);
CREATE INDEX IF NOT EXISTS idx_booking_status ON bookings(status, appointment_date);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active, category_id);

INSERT OR IGNORE INTO service_categories (id, name) VALUES
  (1, 'Hair'),
  (2, 'Skin & Beauty'),
  (3, 'Women''s Grooming'),
  (4, 'Men''s Grooming'),
  (5, 'Nails');

INSERT OR IGNORE INTO services (id, category_id, sub_category, service_name, price, duration_minutes, is_featured) VALUES
  (101, 1, 'Haircuts & Styling', 'Women''s Haircut', 800, 45, 1),
  (102, 1, 'Haircuts & Styling', 'Men''s Haircut', 400, 30, 1),
  (109, 1, 'Hair Treatments', 'Hair Spa', 1200, 60, 1),
  (114, 1, 'Hair Colour', 'Global Hair Colour', 2800, 90, 1),
  (117, 1, 'Hair Colour', 'Highlights & Lowlights', 3500, 120, 1),
  (118, 1, 'Hair Colour', 'Balayage', 4500, 150, 1),
  (123, 1, 'Hair Smoothening & Texture Treatments', 'Keratin Treatment', 3800, 150, 1),
  (127, 1, 'Hair Smoothening & Texture Treatments', 'Hair Botox', 4200, 120, 1),
  (203, 2, 'Facials', 'Gold Facial', 1800, 60, 1),
  (204, 2, 'Facials', 'Diamond Facial', 2200, 60, 1),
  (214, 2, 'Threading', 'Eyebrow Threading', 60, 15, 0),
  (219, 2, 'Waxing', 'Full Arms', 500, 30, 0),
  (221, 2, 'Waxing', 'Full Legs', 700, 40, 0),
  (304, 3, 'Women''s Grooming', 'Party Hairstyles', 1400, 60, 1),
  (308, 3, 'Women''s Grooming', 'Manicure', 600, 40, 0),
  (309, 3, 'Women''s Grooming', 'Pedicure', 750, 45, 0),
  (401, 4, 'Men''s Grooming', 'Haircut', 400, 30, 1),
  (402, 4, 'Men''s Grooming', 'Beard Trim & Styling', 250, 20, 1),
  (501, 5, 'Nail Extensions', 'Acrylic Nail Extensions', 2200, 90, 1),
  (502, 5, 'Nail Extensions', 'Gel Nail Extensions', 2500, 90, 1),
  (506, 5, 'Nail Art & Design', 'Basic Nail Art', 500, 30, 0),
  (514, 5, 'Nail Care', 'Gel Polish', 800, 40, 1);
