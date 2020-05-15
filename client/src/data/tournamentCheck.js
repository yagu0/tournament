const allowedWebsites = [
  "lichess",
  "vchess"
];

export function checkTournament(t) {
  if (!t.title)
    return "Missing title";
  if (!t.dtstart || t.dtstart < Date.now() / 1000 + 45*60)
    return "Start time is missing or too soon";
  if (!t.nbRounds || t.nbRounds <= 0)
    return "Rounds count: positive integer";
  if (t.allRounds && t.nbRounds % 2 == 0)
    return "Rounds count must be odd if all rounds";
  if (!t.cadence.match(/^[\w+ -]+$/))
    return "Wrong cadence (alphanumerics, space, '+' and '_')";
  if (!allowedWebsites.includes(t.website))
    return "Missing or unsupported platform";
  return "";
}
