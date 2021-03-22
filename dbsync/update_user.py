#!/usr/bin/env python

# Update name and/or email of a specific user

from dbconnect import create_connection, vchess_db_path, tournament_db_path
import sys

def sync_tournament():
    """
    Synchronize tournament/Users from vchess/Users : update
    """

    vconn = create_connection(vchess_db_path)
    vcur = vconn.cursor()
    vcur.execute("SELECT name,email FROM Users WHERE id = ?", sys.argv[1])
    vrow = vcur.fetchone()
    vcur.close()

    tconn = create_connection(tournament_db_path)
    tcur = tconn.cursor()
    tcur.execute("SELECT name,email FROM Users WHERE id = ?", sys.argv[1])
    trow = tcur.fetchone()
    if trow[0] != vrow[0]:
        tconn.cursor().execute("UPDATE Users SET name = ? WHERE id = ?", (vuser[1],vuser[0]))
    if trow[1] != vrow[1]:
        tconn.cursor().execute("UPDATE Users SET email = ? WHERE id = ?", (vuser[2],vuser[0]))
    tcur.close()
    tconn.commit()

sync_tournament()
