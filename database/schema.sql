
CREATE TABLE rooms (
id SERIAL PRIMARY KEY,
name TEXT NOT NULL,
created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE slots (
id SERIAL PRIMARY KEY,
room_id INTEGER REFERENCES rooms(id),
row INTEGER,
column INTEGER,
plant_id INTEGER,
created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE plants (
id SERIAL PRIMARY KEY,
tag_number TEXT UNIQUE,
strain_name TEXT,
status TEXT,
room_id INTEGER,
slot_id INTEGER,
created_at TIMESTAMP DEFAULT NOW(),
updated_at TIMESTAMP DEFAULT NOW()
);
