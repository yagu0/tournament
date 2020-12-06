-- Database should be in this folder, and named 'tournament.sqlite'

create table Users (
  id integer primary key,
  name varchar,
  email varchar unique,
  loginToken varchar,
  loginTime datetime,
  sessionToken varchar,
  created datetime,
  notify boolean
);

create table Tournaments (
  id integer primary key,
  dtstart datetime,
  title varchar,
  variant varchar,
  bothcol boolean,
  allRounds boolean,
  cadence varchar,
  nbRounds integer,
  frozen boolean,
  stage integer default 0
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
  elo integer,
  quit boolean,
  ban boolean,
  foreign key (uid) references Users(id),
  foreign key (tid) references Tournaments(id) on delete cascade
);

create table Games (
  tid integer,
  round integer,
  score varchar,
  glink varchar,
  player1 integer,
  player2 integer,
  foreign key (player1) references Users(id),
  foreign key (player2) references Users(id),
  foreign key (tid) references Tournaments(id) on delete cascade
);

create table Exempts (
  tid integer,
  round integer,
  player integer,
  foreign key (player) references Users(id),
  foreign key (tid) references Tournaments(id) on delete cascade
);

pragma foreign_keys = on;
