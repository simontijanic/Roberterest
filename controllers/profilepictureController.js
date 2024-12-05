function generateDefaultProfilePicture(username = "User") {
  const initials = username
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
  const backgroundColor = "#3498db";
  const textColor = "#ffffff";

  return `https://ui-avatars.com/api/?name=${initials}&background=${backgroundColor.replace(
    "#",
    ""
  )}&color=${textColor.replace("#", "")}`;
}

const getProfilePicture = (user) => {
  if (!user || !user.username) {
    // Handle the case when user is null or undefined
    return generateDefaultProfilePicture(); // Default profile picture if no user or username is available
  }

  const username = user.username || "User";
  if (user.profilepicture && typeof user.profilepicture === "string") {
    return `/images/uploads/${user.profilepicture}`;
  }
  return generateDefaultProfilePicture(username);
};

module.exports = getProfilePicture;
