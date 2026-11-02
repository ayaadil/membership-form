USE user_data_db;

ALTER TABLE user_info ADD COLUMN passport_hash CHAR(64) NULL AFTER passport_number;
ALTER TABLE user_info ADD UNIQUE KEY uq_passport_hash (passport_hash);
ALTER TABLE user_info ADD INDEX idx_email (email);

CREATE USER 'app_user'@'localhost' IDENTIFIED BY 'CHANGE_ME_STRONG_PASSWORD';
GRANT SELECT, INSERT, UPDATE, DELETE ON user_data_db.user_info TO 'app_user'@'localhost';
FLUSH PRIVILEGES;
