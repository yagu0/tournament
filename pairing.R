########
# Usage:
########
# 0) Prepare tourament.csv, 4 columns, Pl,name,id,elo
# 1) source("pairing.R")
# 2) a <- launchRound(c())
#    If at some point player(s) quit the tournament,
#    set arg to quit=c(players_index). They may re-enter later.
# 3) Give pairings, start games, wait for results
# 4) updateTournament(a, c(results), c(game_links))
#    where results is a vector of results codes from white viewpoint,
#      + for 1-0, - for 0-1, = for 1/2,
#      F for win by forfeit, f for lose by forfeit,
#      > for exempt
#    game_links is an optional vector of links to games (TEMP)
# 5) Go back to 2) until all rounds are played.
# 6) computeFinalGrid()
#    outputs tournament_final.csv and tournament_final.html,
#    ready for sharing tournament results.

symbolToScore <- function(symb) {
  if (symb %in% c("+", ">", "F")) return (1)
  if (symb == "=") return (0.5)
  0 #'-', or 'f'
}

findPairing <- function(distances) {
  # Do not give links with Inf (definitely impossible matches)
  # TODO: cleaner communication with Python (maybe a C or even R version?)
  cmd <- 'python2 -c "from mwmatching import maxWeightMatching;'
  cmd <- paste0(cmd, 'print(maxWeightMatching([')
  n <- nrow(distances)
  for (i in 1:(n-1)) {
    for (j in (i+1):n) {
      if (!is.infinite(distances[i,j])) {
        cmd <- paste0(cmd,
          "(", i-1, ",", j-1, ",", -round(distances[i,j], 2), "),")
      }
    }
  }
  cmd <- sub(".$", "", cmd)
  cmd <- paste0(cmd, '], maxcardinality=True))"')
  strAssignment <- system(cmd, intern=T)
  1 + as.integer(
    strsplit(substr(strAssignment, 2, nchar(strAssignment)-1), ",")[[1]]
  )
}

# 'quit' is a vector of players indices who abandoned the tournament
launchRound <- function(quit) {
  tournamentFile <- "tournament.csv"
  # tournamentFile contains number, real + user names ('id'),
  # rankings, players already met + results for each round.
  tournament <- read.csv(tournamentFile)
  rounds <- as.data.frame(tournament[,-(1:4)])
  nbRounds <- ncol(rounds)
  n <- nrow(tournament)
  if (nbRounds >= 1) {
    # Fix input ="=4B" into =3B
    for (i in seq_len(n)) {
      for (j in seq_len(nbRounds)) {
        if (startsWith(rounds[i,j], "=")) {
          rounds[i,j] <- substr(rounds[i,j], 3, nchar(rounds[i,j])-1)
        }
      }
    }
  }
  activePlayers <- seq_len(n)
  if (length(quit) >= 1) activePlayers <- activePlayers[-quit]
  # 'state' list contains players met, colors assigned and current score
  state <- list()
  for (p in activePlayers) {
    state[[p]] <- list(
      met = rep(0,n),
      score = 0,
      colors = list(B=0, N=0),
      exempt = 0
    )
    for (c in seq_len(nbRounds)) {
      if (rounds[p,c] == ">") {
        # Exempt
        state[[p]]$exempt <- state[[p]]$exempt + 1
        state[[p]]$score <- state[[p]]$score + 1
      }
      else {
        nc <- nchar(rounds[p,c])
        value1 <- substr(rounds[p,c], 1, 1)
        value2 <- strtoi(substr(rounds[p,c], 2, nc-1))
        value3 <- substr(rounds[p,c], nc, nc)
        state[[p]]$score <- state[[p]]$score + symbolToScore(value1)
        state[[p]]$met[value2] <- state[[p]]$met[value2] + 1
        state[[p]]$colors[[value3]] <- state[[p]]$colors[[value3]] + 1
      }
    }
  }
  P <- length(activePlayers)
  exempt <- -1
  if (P %% 2 == 1) {
    # Determine a player out for this round
    scores <- c()
    indexes <- c()
    for (p in activePlayers) {
      scores <- c(
        scores,
        state[[p]]$exempt +
          state[[p]]$score / 10 +
          (0.05 - 1 / tournament[p,"elo"])
      )
      indexes <- c(indexes, p)
    }
    scores <- sort(scores, index.return=T)
    exempt <- indexes[scores$ix[1]]
    activePlayers <- activePlayers[-scores$ix[1]]
    P <- P - 1
  }
  # Compute distances matrix: if players shouldn't be paired
  # (self-assignment or players who quit), distance is "+Inf" (10^9 here)
  distances <- matrix(Inf, nrow=P, ncol=P)
  for (i in 1:(P-1)) {
    scoreI <- state[[activePlayers[i]]]$score
    eloI <- tournament[activePlayers[i],"elo"]
    for (j in (i+1):P) {
      scoreJ <- state[[activePlayers[j]]]$score
      eloJ <- tournament[activePlayers[j],"elo"]
      distances[i,j] <-
        # 500: arbitrary value (should be quite greater than number of rounds)
        500 * state[[activePlayers[i]]]$met[activePlayers[j]] +
        abs(scoreI - scoreJ) + 1. / (5 + abs(eloI - eloJ))
      distances[j,i] <- distances[i,j]
    }
  }
  assignment <- findPairing(distances)
  assignment <- activePlayers[assignment]
  pairing <- ""
  alreadyPaired <- rep(F, n)
  colors <- rep('B', n)
  for (i in seq_along(assignment)) {
    if (!alreadyPaired[activePlayers[i]]) {
      # Color assignment: the player who had black the most takes white.
      # In case of equality: random choice.
      ordering <- c(activePlayers[i], assignment[i])
      if (
        state[[activePlayers[i]]]$colors[["N"]] <
        state[[assignment[i]]]$colors[["N"]]
      ) {
        ordering <- c(assignment[i], activePlayers[i])
      }
      else if (
        state[[activePlayers[i]]]$colors[["N"]] ==
        state[[assignment[i]]]$colors[["N"]]
      ) {
        if (sample(2, 1) == 2) ordering <- c(assignment[i], activePlayers[i])
      }
      alreadyPaired[ordering[1]] <- T
      alreadyPaired[ordering[2]] <- T
      pairing <- paste0(
        pairing,
        tournament[ordering[1],"id"],
        "[",
        state[[ordering[1]]]$score,
        "]",
        " vs. ",
        tournament[ordering[2],"id"],
        "[",
        state[[ordering[2]]]$score,
        "]",
        "\n"
      )
      if (ordering[1] == activePlayers[i]) colors[assignment[i]] <- 'N'
      else colors[activePlayers[i]] <- 'N'
    }
  }
  if (exempt >= 1) {
    pairing <- paste0(
      pairing,
      tournament[exempt,"id"],
      "[",
      state[[exempt]]$score,
      "] exempt\n"
    )
  }
  # Print pairings
  cat(pairing)
  # Also output the permutation in a human+machine readable way
  if (exempt >= 1) {
    activePlayers <- c(activePlayers, exempt)
    assignment <- c(assignment, exempt)
  }
  list(cbind(activePlayers, assignment), colors[activePlayers])
}

# TODO: gameLinks arg is temporary, OK if not many players.
# Would need an automatic game ID retrieval otherwise (using lichess API)
updateTournament <- function(pairingColors, results, gameLinks=NULL) {
  tournamentFile <- "tournament.csv"
  tournament <- read.csv(tournamentFile)
  newColumn <- rep("", nrow(tournament))
  calcGameLink <- rep("", nrow(tournament))
  # Score is given from white viewpoint: map for black side
  bRes <- list(
    "+" = "-",
    "-" = "+",
    "=" = "=",
    "F" = "f",
    "f" = "F"
  )
  pairing <- pairingColors[[1]]
  colors <- pairingColors[[2]]
  n <- nrow(tournament)
  P <- nrow(pairing)
  alreadyProcessed <- rep(F, n)
  index <- 1
  gl <- !is.null(gameLinks)
  for (i in seq_len(P)) {
    if (!alreadyProcessed[pairing[i,1]]) {
      alreadyProcessed[pairing[i,1]] <- T
      if (pairing[i,1] == pairing[i,2]) {
        # Exempt
        newColumn[pairing[i,1]] <- ">"
      }
      else {
        if (gl) calcGameLink[pairing[i,1]] <- gameLinks[index]
        newColumn[pairing[i,1]] <- paste0(
          ifelse(colors[i] == 'B', results[index], bRes[[results[index]]]),
          pairing[i,2],
          colors[i]
        )
        if (gl) calcGameLink[pairing[i,2]] <- gameLinks[index]
        newColumn[pairing[i,2]] <- paste0(
          ifelse(colors[i] == 'N', results[index], bRes[[results[index]]]),
          pairing[i,1],
          ifelse(colors[i] == 'B', 'N', 'B')
        )
        alreadyProcessed[pairing[i,2]] <- T
        index <- index + 1
      }
    }
  }
  for (i in seq_along(newColumn)) {
    if (startsWith(newColumn[i], "=")) {
      # Fix output for spreadsheet to not interpret as formula
      newColumn[i] <- paste0('="', newColumn[i], '"')
    }
  }
  nbRounds <- ncol(tournament) - 4
  tournament[[paste0("R", nbRounds+1)]] <- newColumn
  if (!file.exists("games.csv")) {
    games <- as.data.frame(calcGameLink)
  }
  else {
    games <- read.table("games.csv",
      sep=",", header=F, fill=T, comment.char="", blank.lines.skip=F)
    games[[ncol(games)+1]] <- calcGameLink
  }
  write.csv(tournament, tournamentFile, row.names=F)
  write.table(games, "games.csv",
    sep=",", dec=".", quote=T, row.names=F, col.names=F, append=F)
}

computeFinalGrid <- function() {
  tournamentFile <- "tournament.csv"
  # 1) Compute score, performance and tiebreak ("Buchholz") columns
  tournament <- read.csv(tournamentFile)
  n <- nrow(tournament)
  score <- rep(0, n)
  perf <- rep(0, n)
  nbRounds <- ncol(tournament) - 4
  met <- list()
  exempt <- rep(0, n)
  minP <- 1 / (10 * nbRounds)
  if (nbRounds >= 1) {
    # Fix input ="=4B" into =3B
    for (i in seq_len(n)) {
      for (j in seq_len(nbRounds)) {
        if (startsWith(tournament[i,j+4], "=")) {
          tournament[i,j+4] <- substr(tournament[i,j+4], 3, nchar(tournament[i,j+4])-1)
        }
      }
    }
  }
  for (i in seq_len(n)) {
    score[i] <- 0
    metI <- c()
    for (j in seq_len(nbRounds)) {
      cell <- tournament[i,j+4]
      if (cell == ">") {
        score[i] <- score[i] + 1
        exempt[i] <- exempt[i] + 1
      }
      else {
        nc <- nchar(cell)
        value1 <- substr(cell, 1, 1)
        value2 <- strtoi(substr(cell, 2, nc-1))
        score[i] <- score[i] + symbolToScore(value1)
        if (!(value1 %in% c('F','f'))) {
          metI <- c(metI, value2)
        }
      }
    }
    met[[i]] <- metI
    L <- length(met[[i]])
    if (L >= 1) {
      for (m in met[[i]]) {
        perf[i] <- perf[i] + tournament[m,4]
      }
      perf[i] <- perf[i] / L
      p <- (score[i] - exempt[i]) / L
      if (p == 0) p <- minP
      else if (p == 1) p <- 1 - minP
      Delta <- -400 * log10(1/p - 1)
      perf[i] <- perf[i] + Delta
    }
  }
  tournament[["score"]] <- score
  bc <- rep(0, n)
  for (i in seq_len(n)) {
    L <- length(met[[i]])
    if (L >= 1) {
      for (m in met[[i]]) {
        # Our opponent met at least us, so length(met[[m]]) >= 1
        p <- (score[m] - exempt[m]) / length(met[[m]])
        bc[i] <- bc[i] + p
      }
      bc[i] <- bc[i] / L
    }
  }
  tournament[["bc"]] <- round(bc, 2)
  tournament[["perf"]] <- round(perf)
  # 2) reorder data.frame (https://www.datanovia.com/en/lessons/reorder-data-frame-rows-in-r/)
  #    on score first, perf then, and tiebreak last.
  require(tidyverse)
  tournament <- tournament %>% arrange(-score, -perf, -bc)
  ranking <- tournament[,1]
  # 3) Translate into HTML ("tournament.html") with profile + games links
  games <- read.table("games.csv",
    sep=",", header=F, fill=T, comment.char="", blank.lines.skip=F)
  htmlFile <- "tournament_final.html"
  head <- "<table><tr><th>Pl</th><th>name</th><th>id</th><th>elo</th>"
  for (i in seq_len(nbRounds)) {
    head <- paste0(head, "<th>R", i, "</th>")
  }
  head <- paste0(head, "<th>score</th><th>bc</th><th>perf</th></tr>")
  head <- paste0(head, "</tr>\n")
  cat(head, file=htmlFile)
  for (i in seq_len(n)) {
    line <- "<tr>"
    for (j in 1:4) {
      line <- paste0(line,
        "<td>",
        ifelse(j == 3,
          paste0("<a href='https://lichess.org/@/", tournament[i,j], "'>"),
          ""),
        tournament[i,j],
        ifelse(j == 3, "</a>", ""),
        "</td>"
      )
    }
    for (j in seq_len(nbRounds)) {
      line <- paste0(line,
        "<td>",
        ifelse(!is.na(games[ranking[i],j]) && nchar(games[ranking[i],j])>0,
          paste0("<a href='",games[ranking[i],j],"'>"),
          ""),
        tournament[i,j+4],
        ifelse(!is.na(games[ranking[i],j]) && nchar(games[ranking[i],j])>0,
          "</a>",
          ""),
        "</td>"
      )
    }
    for (j in 1:3) {
      line <- paste0(line, "<td>", tournament[i,j+4+nbRounds], "</td>")
    }
    line <- paste0(line, "</tr>\n")
    cat(line, file=htmlFile, append=T)
  }
  cat("</table>\n", file=htmlFile, append=T)
  # 4) Replace links in csv to open in LibreOffice
  for (i in seq_len(n)) {
    tournament[i,3] <- paste0(
      '=HYPERLINK("https://lichess.org/@/',
      tournament[i,3],
      '";"',
      tournament[i,3],'")'
    )
    for (j in seq_len(nbRounds)) {
      # Test !is.na(games) because last row(s) could be empty
      if (!is.na(games[ranking[i],j]) && nchar(games[ranking[i],j]) > 0) {
        tournament[i,j+4] <- paste0(
          '=HYPERLINK("',
          games[ranking[i],j],
          '";"',
          tournament[i,j+4],
          '")'
        )
      }
    }
  }
  write.csv(tournament, "tournament_final.csv", row.names=F)
}
