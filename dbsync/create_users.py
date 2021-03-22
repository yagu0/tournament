#!/usr/bin/env python

# (Re)Sync both DB, vchess --> tournament
# (Manual usage if something went wrong...)

from dbconnect import create_connection, vchess_db_path, tournament_db_path

def sync_tournament():
    """
    Synchronize tournament/Users from vchess/Users : create
    """

    vconn = create_connection(vchess_db_path)
    vcur = vconn.cursor()
    vcur.execute("SELECT id,name,email,created,notify FROM Users")
    vrows = vcur.fetchall()
    vcur.close()

    tconn = create_connection(tournament_db_path)
    tcur = tconn.cursor()
    tcur.execute("DELETE FROM Users")
    for vuser in vrows:
        tcur.execute("INSERT INTO Users (id,name,email,created,notify) VALUES (?,?,?,?,?)", vuser)
    tconn.commit()

sync_tournament()
