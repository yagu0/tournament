#!/usr/bin/env python

# Add one user (from vchess DB to here)

from dbconnect import create_connection, vchess_db_path, tournament_db_path

def sync_tournament():
    """
    Synchronize tournament/Users from vchess/Users : insert
    """

    vconn = create_connection(vchess_db_path)
    vcur = vconn.cursor()
    vcur.execute("SELECT name,email,created,notify FROM Users WHERE id = ?", sys.argv[1])
    vrow = vcur.fetchone()
    vcur.close()

    tconn = create_connection(tournament_db_path)
    tcur = tconn.cursor()
    tcur.execute("INSERT INTO Users (id,name,email,created,notify) VALUES (?,?,?,?,?)", (sys.argv[1],) + vrow)
    tcur.close()
    tconn.commit()

sync_tournament()
