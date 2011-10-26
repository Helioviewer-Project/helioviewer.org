--
-- This script can be used to find gaps the Helioviewer data archive
--
-- Currently it is geared to find gaps of one minute or greater in AIA data. For
-- other types of data it is likely easier to request a complete list of data
-- available from that source and compare it to what is held by Helioviewer.
-- Note that this SQL should not be run on the production machine itself, but
-- instead should be used on a dump of the database. Solution based on:
--
-- http://forums.mysql.com/read.php?10,426760,427089#msg-427089
-- 
-- keith.hughitt@nasa.gov
-- Oct 25, 2011
--

-- (1) Create table
CREATE TABLE t (id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY)
    SELECT date 
    FROM images 
    WHERE sourceId in (SELECT id FROM datasources WHERE instrumentId=4) 
    ORDER BY date;

-- (2) Find all gaps >= 60s
SELECT a.date as start, b.date as end, (UNIX_TIMESTAMP(b.date) - UNIX_TIMESTAMP(a.date)) AS gap
    FROM t AS a
    JOIN t AS b  ON b.id = a.id + 1
    HAVING gap >= 60;

-- (3) Clean up
--DROP TABLE t;
