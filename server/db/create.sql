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
  allRounds boolean,
  nbRounds integer,
  frozen boolean,
  stage integer default 0
);

-- TODO: at tournament creation, give a series of variant[cadence]2 <-- '2' if bothcol/twogames.
-- or, juste series of variants + global bothcol / cadence. Or just one variant + cadence + bothcol
-- --> and use this table below !
create table Rounds (
  tid integer,
  variant varchar,
  cadence varchar,
  bothcol boolean
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
