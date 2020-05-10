const allowedWebsites = [
  "lichess",
  "vchess"
];

export function checkTournament(t) {
  if (t.dtstart < Date.now() + 45*60*3600)
    return "Start time is too soon";
  if (t.nbRounds <= 0)
    return "Rounds count: positive integer";
  if (!t.cadence.match(/^[\w -]+$/))
    return "Wrong cadence";
  if (!allowedWebsites.includes(t.website))
    return "Unsupported platform";
  return "";
}
