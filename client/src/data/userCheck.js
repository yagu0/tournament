export function checkUser(u) {
  if (!u.firstName || !u.lastName) return "Missing name";
  for (let name of [u.firstName, u.lastName]) {
    if (
      !!name &&
      !name.match(/^[a-zA-ZáàâäãåçéèêëíìîïñóòôöõúùûüýÿæœÁÀÂÄÃÅÇÉÈÊËÍÌÎÏÑÓÒÔÖÕÚÙÛÜÝŸÆŒ' -]+$/)
    ) {
      return "Names: letters, apostrophe, space and hyphen";
    }
  }
  if (
    !!u.club &&
    !u.club.match(/^[\wáàâäãåçéèêëíìîïñóòôöõúùûüýÿæœÁÀÂÄÃÅÇÉÈÊËÍÌÎÏÑÓÒÔÖÕÚÙÛÜÝŸÆŒ' -]+$/)
  ) {
    return "Club: letters, numbers, apostrophe, space and hyphen";
  }
  const emailError = checkEmail(u.email);
  if (!!emailError) return emailError;
  if (!!u.license && !u.license.match(/^[\w]+$/))
    return "License: alphanumerics";
  return "";
}

export function checkEmail(email) {
  if (email.length == 0) return "Missing email";
  if (!email.match(/^[\w.+-]+@[\w.+-]+$/)) return "Invalid email";
  return "";
}
