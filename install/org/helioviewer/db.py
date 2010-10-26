# -*- coding: utf-8 -*-
import sys, os

def setupDatabaseSchema(adminuser, adminpass, dbname, dbuser, dbpass, mysql):
    ''' Sets up Helioviewer.org database schema '''
    if mysql:
        import MySQLdb
        adaptor = MySQLdb
    else:
        import pgdb
        adaptor = pgdb

    createDB(adminuser, adminpass, dbname, dbuser, dbpass, mysql, adaptor)

    # connect to helioviewer database
    cursor = getDatabaseCursor(dbname, dbuser, dbpass, mysql)

    createSourceTable(cursor)
    createObservatoryTable(cursor)
    createInstrumentTable(cursor)
    createDetectorTable(cursor)
    createMeasurementTable(cursor)
    createImageTable(cursor)
    updateImageTableIndex(cursor)

    return cursor

def getDatabaseCursor(dbname, dbuser, dbpass, mysql):
    ''' Creates a database connection '''
    if mysql:
        import MySQLdb
    else:
        import pgdb
    
    if mysql:
        db = MySQLdb.connect(use_unicode=True, charset = "utf8", host="localhost", db=dbname, user=dbuser, passwd=dbpass)
    else:
        db = pgdb.connect(use_unicode=True, charset = "utf8", database=dbname, user=dbuser, password=dbpass)
    
    return db.cursor()

def checkDBInfo(adminuser, adminpass, mysql):
    ''' Validate database login information '''
    try:
        if mysql:
            import MySQLdb
            db = MySQLdb.connect(user=adminuser, passwd=adminpass)
        else:
            import pgdb
            db = pgdb.connect(database="postgres", user=adminuser, password=adminpass)
    except MySQLdb.Error, e:
        print e
        return False

    db.close()
    return True

def createDB(adminuser, adminpass, dbname, dbuser, dbpass, mysql, adaptor):
    ''' Creates database
        TODO (2009/08/18) Catch error case when db already exists, and gracefully exit '''
    if mysql:
        try:
           db = adaptor.connect(user=adminuser, passwd=adminpass)
           cursor = db.cursor()
           cursor.execute("CREATE DATABASE IF NOT EXISTS %s;" % dbname)
           cursor.execute("GRANT ALL ON %s.* TO '%s'@'localhost' IDENTIFIED BY '%s';" % (dbname, dbuser, dbpass))
        except adaptor.Error, e:
            print "Error: " + e.args[1]
            sys.exit(2)
    else:
        try:
            db = adaptor.connect(database="postgres", user=adminuser, password=adminpass)
            cursor = db.cursor()
            cursor.execute("CREATE DATABASE IF NOT EXISTS %s;" % dbname)
            cursor.execute("GRANT ALL ON %s.* TO '%s'@'localhost' IDENTIFIED BY '%s';" % (dbname, dbuser, dbpass))
        except Exception, e:
            print "Error: " + e.args[1]
            sys.exit(2)

    cursor.close()

def createImageTable(cursor):
    sql = \
    '''CREATE TABLE `images` (
      `id`            INT unsigned NOT NULL auto_increment,
      `filepath`      VARCHAR(255) NOT NULL,
      `filename`      VARCHAR(255) NOT NULL,
      `date`    datetime NOT NULL default '0000-00-00 00:00:00',
      `sourceId`    SMALLINT unsigned NOT NULL,
      PRIMARY KEY  (`id`), KEY `date_index` (`sourceId`,`date`) USING BTREE
    ) DEFAULT CHARSET=utf8;'''
    cursor.execute(sql)

def createSourceTable(cursor):
    cursor.execute(
    '''CREATE TABLE `datasources` (
        `id`            SMALLINT unsigned NOT NULL,
        `name`          VARCHAR(127) NOT NULL,
        `description`   VARCHAR(255),
        `observatoryId` SMALLINT unsigned NOT NULL,
        `instrumentId`  SMALLINT unsigned NOT NULL,
        `detectorId`    SMALLINT unsigned NOT NULL,
        `measurementId` SMALLINT unsigned NOT NULL,
        `layeringOrder` TINYINT NOT NULL,
        `enabled`       BOOLEAN NOT NULL,
      PRIMARY KEY  (`id`)
    ) DEFAULT CHARSET=utf8;''')

    cursor.execute('''
    INSERT INTO `datasources` VALUES
        (0, 'EIT 171', 'SOHO EIT 171', 0, 0, 0, 2, 1, 0),
        (1, 'EIT 195', 'SOHO EIT 195', 0, 0, 0, 4, 1, 0),
        (2, 'EIT 284', 'SOHO EIT 284', 0, 0, 0, 6, 1, 0),
        (3, 'EIT 304', 'SOHO EIT 304', 0, 0, 0, 7, 1, 0),
        (4, 'LASCO C2', 'SOHO LASCO C2', 0, 1, 1, 14, 2, 0),
        (5, 'LASCO C3', 'SOHO LASCO C3', 0, 1, 2, 14, 3, 0),
        (6, 'MDI Mag', 'SOHO MDI Mag', 0, 2, 3, 13, 1, 0),
        (7, 'MDI Int', 'SOHO MDI Int', 0, 2, 3, 12, 1, 0),
        (8, 'AIA 94', 'SDO AIA 94',  2, 4, 5, 0, 1, 0),
        (9, 'AIA 131', 'SDO AIA 131',  2, 4, 5, 1, 1, 0),
        (10, 'AIA 171', 'SDO AIA 171',  2, 4, 5, 2, 1, 0),
        (11, 'AIA 193', 'SDO AIA 193',  2, 4, 5, 3, 1, 0),
        (12, 'AIA 211', 'SDO AIA 211',  2, 4, 5, 5, 1, 0),
        (13, 'AIA 304', 'SDO AIA 304',  2, 4, 5, 7, 1, 0),        
        (14, 'AIA 335', 'SDO AIA 335',  2, 4, 5, 8, 1, 0),
        (15, 'AIA 1600', 'SDO AIA 1600',  2, 4, 5, 9, 1, 0),
        (16, 'AIA 1700', 'SDO AIA 1700',  2, 4, 5, 10, 1, 0),
        (17, 'AIA 4500', 'SDO AIA 4500',  2, 4, 5, 11, 1, 0);
    ''')

def createObservatoryTable(cursor):
    """ Creates table to store observatory information """

    cursor.execute('''
    CREATE TABLE `observatories` (
      `id`          SMALLINT unsigned NOT NULL,
      `name`        VARCHAR(255) NOT NULL,
      `description` VARCHAR(255) NOT NULL,
       PRIMARY KEY (`id`)
    ) DEFAULT CHARSET=utf8;''')

    cursor.execute('''
    INSERT INTO `observatories` VALUES
        (0, 'SOHO', 'Solar and Heliospheric Observatory'),
        (1, 'TRACE', 'The Transition Region and Coronal Explorer'),
        (2, 'SDO', 'Solar Dynamics Observatory');        
    ''')

def createInstrumentTable(cursor):
    """ Creates table to store instrument information """

    cursor.execute('''
    CREATE TABLE `instruments` (
      `id`          SMALLINT unsigned NOT NULL,
      `name`        VARCHAR(255) NOT NULL,
      `description` VARCHAR(255) NOT NULL,
       PRIMARY KEY (`id`)
    ) DEFAULT CHARSET=utf8;''')

    cursor.execute('''
    INSERT INTO `instruments` VALUES
        (0, 'EIT',   'Extreme ultraviolet Imaging Telescope'),
        (1, 'LASCO', 'The Large Angle Spectrometric Coronagraph'),
        (2, 'MDI',   'Michelson Doppler Imager'),
        (3, 'TRACE', 'TRACE'),
        (4, 'AIA',   'Atmospheric Imaging Assembly');
    ''')



def createDetectorTable(cursor):
    """ Creates table to store detector information """

    cursor.execute('''
    CREATE TABLE `detectors` (
      `id`          SMALLINT unsigned NOT NULL,
      `name`        VARCHAR(255) NOT NULL,
      `description` VARCHAR(255) NOT NULL,
       PRIMARY KEY (`id`)
    ) DEFAULT CHARSET=utf8;''')

    cursor.execute('''
    INSERT INTO `detectors` VALUES
        (0, 'EIT',   'EIT'),
        (1, 'C2',    'LASCO C2'),
        (2, 'C3',    'LASCO C3'),
        (3, 'MDI',   'MDI'),
        (4, 'TRACE', 'TRACE'),
        (5, 'AIA',   'AIA');
    ''')


def createMeasurementTable(cursor):
    """ Creates table to store measurement information """

    cursor.execute('''
    CREATE TABLE `measurements` (
      `id`          SMALLINT unsigned NOT NULL,
      `name`        VARCHAR(255) NOT NULL,
      `description` VARCHAR(255) NOT NULL,
      `units`       VARCHAR(20)  NOT NULL,
       PRIMARY KEY (`id`)
    ) DEFAULT CHARSET=utf8;''')

    cursor.execute(u'''
    INSERT INTO `measurements` VALUES
        (0, '94', '94 Ångström extreme ultraviolet', 'Å'),
        (1, '131', '131 Ångström extreme ultraviolet', 'Å'),
        (2, '171', '171 Ångström extreme ultraviolet', 'Å'),
        (3, '193', '193 Ångström extreme ultraviolet', 'Å'),
        (4, '195', '195 Ångström extreme ultraviolet', 'Å'),
        (5, '211', '211 Ångström extreme ultraviolet', 'Å'),        
        (6, '284', '284 Ångström extreme ultraviolet', 'Å'),
        (7, '304', '304 Ångström extreme ultraviolet', 'Å'),
        (8, '335', '335 Ångström extreme ultraviolet', 'Å'),
        (9, '1600', '1600 Ångström extreme ultraviolet', 'Å'),
        (10, '1700', '1700 Ångström extreme ultraviolet', 'Å'),
        (11, '4500', '4500 Ångström extreme ultraviolet', 'Å'),
        (12, 'continuum', 'Intensitygram', 'DN'),
        (13, 'magnetogram', 'Magnetogram', 'Mx'),
        (14, 'white-light', 'White Light', 'DN');
    ''')
    
def enableDataSource(cursor, sourceId):
    """ Marks a single datasource as enabled to signal that there is data for that source """
    cursor.execute("UPDATE datasources SET enabled=1 WHERE id=%d;" % sourceId)
    
def updateImageTableIndex(cursor):
    """ Updates index on images table """
    cursor.execute("OPTIMIZE TABLE images;")

def getDataSources(cursor):
    ''' Returns a list of the known datasources '''
    __SOURCE_ID_IDX__ = 0
    __ENABLED_IDX__   = 1
    __OBS_NAME_IDX__  = 2
    __INST_NAME_IDX__ = 3
    __DET_NAME_IDX__  = 4
    __MEAS_NAME_IDX__ = 5
    
    sql = \
    ''' SELECT
            datasources.id as id,
            datasources.enabled as enabled,
            observatories.name as observatory,
            instruments.name as instrument,
            detectors.name as detector,
            measurements.name as measurement
        FROM datasources
            LEFT JOIN observatories ON datasources.observatoryId = observatories.id 
            LEFT JOIN instruments ON datasources.instrumentId = instruments.id 
            LEFT JOIN detectors ON datasources.detectorId = detectors.id 
            LEFT JOIN measurements ON datasources.measurementId = measurements.id;'''

    # Fetch available data-sources
    cursor.execute(sql)
    results = cursor.fetchall()
    
    # Convert results into a more easily traversable tree structure
    tree = {}
    
    for source in results:
        # Image parameters
        obs     = source[__OBS_NAME_IDX__]
        inst    = source[__INST_NAME_IDX__]
        det     = source[__DET_NAME_IDX__]
        meas    = source[__MEAS_NAME_IDX__]
        id      = int(source[__SOURCE_ID_IDX__])
        enabled = bool(source[__ENABLED_IDX__])
        
        # Build tree
        if obs not in tree:
            tree[obs] = {}
        if inst not in tree[obs]:
            tree[obs][inst] = {}
        if det not in tree[obs][inst]:
            tree[obs][inst][det] = {}
        if meas not in tree[obs][inst][det]:
            tree[obs][inst][det][meas] = {"id": id, "enabled": enabled}
            
    return tree    
