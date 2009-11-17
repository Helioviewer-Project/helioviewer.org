# -*- coding: utf-8 -*-
import sys, os

def setupDatabaseSchema(adminuser, adminpass, dbuser, dbpass, mysql):
    ''' Sets up Helioviewer.org database schema '''
    
    # Work-around to enable unicode support in older versions of Python
    reload(sys)
    sys.setdefaultencoding('utf-8')    
    
    if mysql:
        import MySQLdb
        adaptor = MySQLdb
    else:
        import pgdb
        adaptor = pgdb

    createDB(adminuser, adminpass, dbuser, dbpass, mysql, adaptor)

    # connect to helioviewer database
    if mysql:
        db = MySQLdb.connect(host="localhost", db="helioviewer", user=dbuser, passwd=dbpass)
    else:
        db = pgdb.connect(database="helioviewer", user=dbuser, password=dbpass)
    cursor = db.cursor()

    createSourceTable(cursor)
    createObservatoryTable(cursor)
    createInstrumentTable(cursor)
    createDetectorTable(cursor)
    createMeasurementTable(cursor)
    createImageTable(cursor)
    createDateIndex(cursor)

    return cursor

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

def createDB(adminuser, adminpass, dbuser, dbpass, mysql, adaptor):
    ''' Creates database
        TODO (2009/08/18) Catch error case when db already exists, and gracefully exit '''
    if mysql:
        try:
           db = adaptor.connect(user=adminuser, passwd=adminpass)
           cursor = db.cursor()
           cursor.execute("CREATE DATABASE IF NOT EXISTS helioviewer;")
           cursor.execute("GRANT ALL ON helioviewer.* TO '%s'@'localhost' IDENTIFIED BY '%s';" % (dbuser, dbpass))
        except adaptor.Error, e:
            print "Error: " + e.args[1]
            sys.exit(2)
    else:
        try:
            db = adaptor.connect(database="postgres", user=adminuser, password=adminpass)
            cursor = db.cursor()
            cursor.execute("CREATE DATABASE IF NOT EXISTS helioviewer;")
            cursor.execute("GRANT ALL ON helioviewer.* TO '%s'@'localhost' IDENTIFIED BY '%s';" % (dbuser, dbpass))
        except Exception, e:
            print "Error: " + e.args[1]
            sys.exit(2)

    cursor.close()

def createImageTable(cursor):
    sql = \
    '''CREATE TABLE `image` (
      `id`            INT unsigned NOT NULL auto_increment,
      `filepath`      VARCHAR(255) NOT NULL,
      `filename`      VARCHAR(255) NOT NULL,
      `date`    datetime NOT NULL default '0000-00-00 00:00:00',
      `sourceId`    SMALLINT unsigned NOT NULL,
      PRIMARY KEY  (`id`), INDEX (`id`)
    ) DEFAULT CHARSET=utf8;'''
    cursor.execute(sql)

def createSourceTable(cursor):
    cursor.execute(
    '''CREATE TABLE `datasource` (
        `id`            SMALLINT unsigned NOT NULL,
        `name`          VARCHAR(127) NOT NULL,
        `description`   VARCHAR(255),
        `observatoryId` SMALLINT unsigned NOT NULL,
        `instrumentId`  SMALLINT unsigned NOT NULL,
        `detectorId`    SMALLINT unsigned NOT NULL,
        `measurementId` SMALLINT unsigned NOT NULL,
        `layeringOrder` TINYINT NOT NULL,
      PRIMARY KEY  (`id`), INDEX (`id`)
    ) DEFAULT CHARSET=utf8;''')

    cursor.execute('''
    INSERT INTO `datasource` VALUES
        (0, 'EIT 171', 'SOHO EIT 171', 0, 0, 0, 0, 1),
        (1, 'EIT 195', 'SOHO EIT 195', 0, 0, 0, 1, 1),
        (2, 'EIT 284', 'SOHO EIT 284', 0, 0, 0, 2, 1),
        (3, 'EIT 304', 'SOHO EIT 304', 0, 0, 0, 3, 1),
        (4, 'LASCO C2', 'SOHO LASCO C2', 0, 1, 1, 6, 2),
        (5, 'LASCO C3', 'SOHO LASCO C3', 0, 1, 2, 6, 3),
        (6, 'MDI Mag', 'SOHO MDI Mag', 0, 2, 3, 5, 1),
        (7, 'MDI Int', 'SOHO MDI Int', 0, 2, 3, 4, 1);        
    ''')

def createObservatoryTable(cursor):
    """ Creates table to store observatory information """

    cursor.execute('''
    CREATE TABLE `observatory` (
      `id`          SMALLINT unsigned NOT NULL,
      `name`        VARCHAR(255) NOT NULL,
      `description` VARCHAR(255) NOT NULL,
       PRIMARY KEY (`id`), INDEX (`id`)
    ) DEFAULT CHARSET=utf8;''')

    cursor.execute('''
    INSERT INTO `observatory` VALUES
        (0, 'SOHO', 'Solar and Heliospheric Observatory'),
        (1, 'TRACE', 'The Transition Region and Coronal Explorer');
    ''')

def createInstrumentTable(cursor):
    """ Creates table to store instrument information """

    cursor.execute('''
    CREATE TABLE `instrument` (
      `id`          SMALLINT unsigned NOT NULL,
      `name`        VARCHAR(255) NOT NULL,
      `description` VARCHAR(255) NOT NULL,
       PRIMARY KEY (`id`), INDEX (`id`)
    ) DEFAULT CHARSET=utf8;''')

    cursor.execute('''
    INSERT INTO `instrument` VALUES
        (0, 'EIT',   'Extreme ultraviolet Imaging Telescope'),
        (1, 'LASCO', 'The Large Angle Spectrometric Coronagraph'),
        (2, 'MDI',   'Michelson Doppler Imager'),
        (3, 'TRACE', 'TRACE');
    ''')



def createDetectorTable(cursor):
    """ Creates table to store detector information """

    cursor.execute('''
    CREATE TABLE `detector` (
      `id`          SMALLINT unsigned NOT NULL,
      `name`        VARCHAR(255) NOT NULL,
      `description` VARCHAR(255) NOT NULL,
       PRIMARY KEY (`id`), INDEX (`id`)
    ) DEFAULT CHARSET=utf8;''')

    cursor.execute('''
    INSERT INTO `detector` VALUES
        (0, 'EIT', 'EIT'),
        (1, 'C2', 'LASCO C2'),
        (2, 'C3', 'LASCO C3'),
        (3, 'MDI', 'MDI'),
        (4, 'TRACE', 'TRACE');''')


def createMeasurementTable(cursor):
    """ Creates table to store measurement information """

    cursor.execute('''
    CREATE TABLE `measurement` (
      `id`          SMALLINT unsigned NOT NULL,
      `name`        VARCHAR(255) NOT NULL,
      `description` VARCHAR(255) NOT NULL,
      `units`       VARCHAR(20)  NOT NULL,
       PRIMARY KEY (`id`), INDEX (`id`)
    ) DEFAULT CHARSET=utf8;''')

    cursor.execute('''
    INSERT INTO `measurement` VALUES
      (0, '171', '171 Ångström extreme ultraviolet', 'Å'),
        (1, '195', '195 Ångström extreme ultraviolet', 'Å'),
        (2, '284', '284 Ångström extreme ultraviolet', 'Å'),
        (3, '304', '304 Ångström extreme ultraviolet', 'Å'),
        (4, 'continuum', 'Intensitygram', 'DN'),
        (5, 'magnetogram', 'Magnetogram', 'Mx'),
        (6, 'white light', 'White Light', 'DN');''')
    
def createDateIndex(cursor):
    """ Indexes the table on the date field """
    cursor.execute("CREATE INDEX date_index USING BTREE ON image (date);")

def getDataSources(cursor):
    ''' Returns a list of the known datasources '''
    __SOURCE_ID_IDX__ = 0
    __OBS_NAME_IDX__  = 1
    __INST_NAME_IDX__ = 2
    __DET_NAME_IDX__  = 3
    __MEAS_NAME_IDX__ = 4
    
    #((0, 'SOHO', 'EIT', '', '171'), (1, 'SOHO', 'EIT', '', '195'), (2, 'SOHO', 'EIT', '', '284'), (3, 'SOHO', 'EIT', '', '304'), (4, 'SOHO', 'LASCO', 'C2', 'WL'), (5, 'SOHO', 'LASCO', 'C3', 'WL'), (6, 'SOHO', 'MDI', '', 'mag'), (7, 'SOHO', 'MDI', '', 'int'))

    sql = \
    ''' SELECT
            datasource.id as id,
            observatory.name as observatory,
            instrument.name as instrument,
            detector.name as detector,
            measurement.name as measurement
        FROM datasource
            LEFT JOIN observatory ON datasource.observatoryId = observatory.id 
            LEFT JOIN instrument ON datasource.instrumentId = instrument.id 
            LEFT JOIN detector ON datasource.detectorId = detector.id 
            LEFT JOIN measurement ON datasource.measurementId = measurement.id;'''

    # Fetch available data-sources
    cursor.execute(sql)
    results = cursor.fetchall()
    
    # Convert results into a more easily traversable tree structure
    tree = {}
    
    for source in results:
        # Image parameters
        obs  = source[__OBS_NAME_IDX__]
        inst = source[__INST_NAME_IDX__]
        det  = source[__DET_NAME_IDX__]
        meas = source[__MEAS_NAME_IDX__]
        id   = int(source[__SOURCE_ID_IDX__])
        
        # Build tree
        if obs not in tree:
            tree[obs] = {}
        if inst not in tree[obs]:
            tree[obs][inst] = {}
        if det not in tree[obs][inst]:
            tree[obs][inst][det] = {}
        if meas not in tree[obs][inst][det]:
            tree[obs][inst][det][meas] = id
            
    return tree    
