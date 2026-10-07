-- Galaxy DB — nazwa eventu
USE galaxy;

ALTER TABLE events
  ADD COLUMN title VARCHAR(200) NULL AFTER id;
