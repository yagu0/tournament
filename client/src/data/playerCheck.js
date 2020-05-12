export function checkPlayer(p) {
  if (!p.elo.toString().match(/^[0-9]+$/))
    return "ELO: positive integer";
  if (!p.name.match(/^[\w-]+$/))
    return "User name: alphanumerics, underscore and hyphen";
  return "";
}
