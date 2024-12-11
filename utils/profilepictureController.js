function generateDefaultProfilePicture(username = "User") {
  const initials = username
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase())
    .join("");

  return `https://ui-avatars.com/api/?name=${initials}&background=random`
}

const getProfilePicture = (user) => {
  if (!user) {
    return generateDefaultProfilePicture();
  }

  const username = user.username || "User";
  if (user.profilepicture && typeof user.profilepicture === "string") {
    return `/images/uploads/${user.profilepicture}`;
  }
  return generateDefaultProfilePicture(username);
};

module.exports = getProfilePicture;
