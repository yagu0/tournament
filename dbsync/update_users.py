#!/usr/bin/env python

# Before tournament, trigger manually:
# for each vchess user, check if ID present in tournament.sqlite
#   if yes, check username, and if changed, alter in DB.
#   if no, create user (copy).

from dbconnect import create_connection, vchess_db_path, tournament_db_path

def sync_tournament():
    """
    Synchronize tournament/Users table from vchess/Users
    """

    vconn = create_connection(vchess_db_path)
    tconn = create_connection(tournament_db_path)
    vcur = vconn.cursor()
    vcur.execute("SELECT id,name,email,created,notify FROM Users")
    vrows = vcur.fetchall()

    for vuser in vrows:
        tcur = tconn.cursor()
        tcur.execute("SELECT name FROM Users WHERE id = ?", (vuser[0],))
        tuser = tcur.fetchone()
        tcur.close()
        if tuser == None:
            tconn.cursor().execute("INSERT INTO Users(id,name,email,created,notify) VALUES (?,?,?,?,?)", vuser)
        elif tuser[0] != vuser[1]:
            tconn.cursor().execute("UPDATE Users SET name = ? WHERE id = ?", (vuser[1],vuser[0]))

    tconn.commit()
    vcur.close()

sync_tournament()
