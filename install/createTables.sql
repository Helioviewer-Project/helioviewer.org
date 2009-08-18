-- Helioviewer Database Structure --
-- last update: 2009/08/17        --

--
-- Create schema & user
--
CREATE DATABASE IF NOT EXISTS helioviewer;
GRANT ALL ON helioviewer.* TO 'helioviewer'@'localhost' IDENTIFIED BY 'helioviewer';
USE helioviewer;

--
-- Create tables
--

-- --------------------------------------------------------
--
-- image
-- (id, uri, timestamp, sourceId, corrupt)
--
-- --------------------------------------------------------
CREATE TABLE `image` (
    `id`          INT unsigned NOT NULL auto_increment,
    `uri`         VARCHAR(255) NOT NULL,
    `timestamp`   datetime NOT NULL default '0000-00-00 00:00:00',
    `sourceId`    SMALLINT unsigned NOT NULL,
    `corrupt`     BOOL default 0,
  PRIMARY KEY  (`id`), INDEX (`id`)
);

-- --------------------------------------------------------
--
-- datasource
-- (id, name, description, observatoryId, instrumentId, detectorId, measurementId, layeringOrder)
--
-- TODO: Add INSERT's
-- --------------------------------------------------------
CREATE TABLE `datasource` (
    `id`            SMALLINT unsigned NOT NULL,
    `name`          VARCHAR(255) NOT NULL,
    `description`   VARCHAR(255),
    `observatoryId` SMALLINT unsigned NOT NULL,
    `instrumentId`  SMALLINT unsigned NOT NULL,
    `detectorId`    SMALLINT unsigned NOT NULL,
    `measurementId` SMALLINT unsigned NOT NULL,
    `layeringOrder` TINYINT NOT NULL,
  PRIMARY KEY  (`id`), INDEX (`id`)
) DEFAULT CHARSET=utf8;

-- --------------------------------------------------------
--
-- observatory
-- (id, name, description)
--
-- --------------------------------------------------------
CREATE TABLE `observatory` (
  `id`          SMALLINT unsigned NOT NULL,
  `name`        VARCHAR(255) NOT NULL,
  `description` VARCHAR(255) NOT NULL,
   PRIMARY KEY (`id`), INDEX (`id`)
) DEFAULT CHARSET=utf8;

INSERT INTO `observatory` VALUES(1, 'SOHO', 'Solar and Heliospheric Observatory');
INSERT INTO `observatory` VALUES(2, 'TRACE', 'The Transition Region and Coronal Explorer');


-- --------------------------------------------------------
--
-- instrument
-- (id, name, description)
--
-- --------------------------------------------------------

CREATE TABLE `instrument` (
  `id`          SMALLINT unsigned NOT NULL,
  `name`        VARCHAR(255) NOT NULL,
  `description` VARCHAR(255) NOT NULL,
   PRIMARY KEY (`id`), INDEX (`id`)
) DEFAULT CHARSET=utf8;

INSERT INTO `instrument` VALUES(1, 'EIT',   'Extreme ultraviolet Imaging Telescope');
INSERT INTO `instrument` VALUES(2, 'LASCO', 'The Large Angle Spectrometric Coronagraph');
INSERT INTO `instrument` VALUES(3, 'MDI',   'Michelson Doppler Imager');
INSERT INTO `instrument` VALUES(4, 'TRACE', 'TRACE');

-- --------------------------------------------------------
--
-- detector
-- (id, name, description)
--
-- --------------------------------------------------------
CREATE TABLE `detector` (
  `id`          SMALLINT unsigned NOT NULL,
  `name`        VARCHAR(255) NOT NULL,
  `description` VARCHAR(255) NOT NULL,
   PRIMARY KEY (`id`), INDEX (`id`)
) DEFAULT CHARSET=utf8;

INSERT INTO `detector` VALUES(1, 'C2', 'LASCO C2');
INSERT INTO `detector` VALUES(2, 'C3', 'LASCO C3');
INSERT INTO `detector` VALUES(3, '', 'EIT');
INSERT INTO `detector` VALUES(4, '', 'MDI');
INSERT INTO `detector` VALUES(5, '', 'TRACE');

-- --------------------------------------------------------
--
-- measurement
-- (id, name, description, units)
--
-- TODO: Remove redundant items and adjust source table
-- --------------------------------------------------------
CREATE TABLE `measurement` (
  `id`          SMALLINT unsigned NOT NULL,
  `name`        VARCHAR(255) NOT NULL,
  `description` VARCHAR(255) NOT NULL,
  `units`       VARCHAR(20)  NOT NULL,
   PRIMARY KEY (`id`), INDEX (`id`)
) DEFAULT CHARSET=utf8;

INSERT INTO `measurement` VALUES(1, '171', '171 Angstrom extreme ultraviolet', 'nm');
INSERT INTO `measurement` VALUES(2, '195', '195 Angstrom extreme ultraviolet', 'nm');
INSERT INTO `measurement` VALUES(3, '284', '284 Angstrom extreme ultraviolet', 'nm');
INSERT INTO `measurement` VALUES(4, '304', '304 Angstrom extreme ultraviolet', 'nm');
INSERT INTO `measurement` VALUES(5, '171', '171 Angstrom extreme ultraviolet', 'nm');
INSERT INTO `measurement` VALUES(6, 'int', 'Intensitygram');
INSERT INTO `measurement` VALUES(7, 'mag', 'Magnetogram');
INSERT INTO `measurement` VALUES(8, 'WL', 'White Light');
INSERT INTO `measurement` VALUES(9, 'WL', 'White Light');

