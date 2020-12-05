export function checkEmail(email) {
  if (email.length == 0) return "Missing email";
  if (!email.match(/^[\w.+-]+@[\w.+-]+$/)) return "Invalid email";
  return "";
}
