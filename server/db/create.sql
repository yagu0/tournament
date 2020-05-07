-- Database should be in this folder, and named 'tournament.sqlite'

create table Users (
  id integer primary key,
  name varchar unique,
  email varchar unique,
  loginToken varchar,
  loginTime datetime,
  sessionToken varchar,
  notify boolean,
  created datetime
);

create table Tournaments (
  id integer primary key,
  dtstart datetime,
  title varchar,
  --'lichess', 'vchess', ...etc: pages defined in client app:
  ttype varchar,
  cadence varchar,
  nbRounds integer,
  completed boolean default false
);

create table Players (
  uid integer,
  tid integer,
  uname varchar,
  elo integer,
  foreign key (uid) references Users(id),
  foreign key (tid) references Tournaments(id) on delete cascade
);

pragma foreign_keys = on;
