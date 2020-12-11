#!/usr/bin/python

# After each users removal, also remove in tournament DB

import sys
from dbconnect import create_connection, tournament_db_path

def delete_users():
    """
    Remove users corresponding to given IDs
    """

    tconn = create_connection(tournament_db_path)
    tcur = tconn.cursor()

    # https://stackoverflow.com/a/52479382
    id_list = list(map(int, sys.argv[1]))
    query = "DELETE FROM Users WHERE id IN ({})".format(", ".join("?" * len(id_list)))
    tcur.execute(query, id_list)

    # Failure: why?
    #tcur.executemany("DELETE FROM Users WHERE id = ?", id_list )

    # Open to SQL injection:
    #tcur.execute("DELETE FROM Users WHERE id IN (" + sys.argv[1] + ")")

    tconn.commit()
    tcur.close()

delete_users()
