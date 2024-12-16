CREATE TABLE zip (
    zip_code CHAR(5) PRIMARY KEY,
    city_name TEXT NOT NULL,
    county_name TEXT NOT NULL,
    state_id CHAR(2) NOT NULL
);

CREATE INDEX idx_zip_zip_code ON zip(zip_code);
CREATE INDEX idx_zip_city_name ON zip(city_name);
CREATE INDEX idx_zip_county_name ON zip(county_name);
CREATE INDEX idx_zip_state_id ON zip(state_id);

COMMENT ON TABLE zip IS
'
Table description goes here.
';
