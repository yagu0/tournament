-- Database should be in this folder, and named 'tournament.sqlite'

create table Users (
  id integer primary key,
  firstName varchar,
  lastName varchar,
  email varchar unique,
  license varchar unique,
  club varchar,
  loginToken varchar,
  loginTime datetime,
  sessionToken varchar,
  notify boolean,
  created datetime,
  active boolean default false
);

create table Tournaments (
  id integer primary key,
  dtstart datetime,
  title varchar,
  --'lichess', 'vchess', ...etc, to know profile+challenge links
  website varchar,
  bothcol boolean,
  cadence varchar,
  nbRounds integer,
  -- Current pairing (when tournament has started): list of UID pairs
  pairing: text,
  completed boolean default false
);

create table Chats (
  uid integer,
  tid integer,
  added datetime,
  msg text,
  foreign key (uid) references Users(id),
  foreign key (tid) references Tournaments(id) on delete cascade
);

create table Players (
  uid integer,
  tid integer,
  name varchar,
  elo integer,
  foreign key (uid) references Users(id),
  foreign key (tid) references Tournaments(id) on delete cascade
);

create table Games (
  tid integer,
  round integer,
  score varchar,
  glink varchar,
  -- Only one player ID is required, but it's easier with 2
  player1 integer,
  player2 integer,
  foreign key (tid) references Tournaments(id) on delete cascade
);

pragma foreign_keys = on;
