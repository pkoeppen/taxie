CREATE TABLE acs_metric (
    id VARCHAR(20) NOT NULL,
    zip_code CHAR(5) REFERENCES zip(zip_code) ON UPDATE CASCADE ON DELETE CASCADE,
    estimate REAL,
    PRIMARY KEY (id, zip_code)
);

CREATE INDEX idx_acs_metric_id ON acs_metric(id);
CREATE INDEX idx_acs_metric_zip_code ON acs_metric(zip_code);

COMMENT ON TABLE acs_metric IS
'
Table description goes here.
';
