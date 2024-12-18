function generateDefaultProfilePicture(username = "User") {
  const initials = username
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
  const backgroundColor = "#3498db";
  const textColor = "#ffffff";

  console.log("Generating new profile picture");

  return `https://ui-avatars.com/api/?name=${initials}&background=${backgroundColor.replace(
    "#",
    ""
  )}&color=${textColor.replace("#", "")}`;
}

exports.getProfilePicture = (user) => {
  console.log("Fetching profile picture");

  if (!user || !user.username) {
    console.log("No user or username, using default picture");
    const defaultPic = generateDefaultProfilePicture();
    user.profilepicture = defaultPic; // Assign generated picture to user
    return defaultPic;
  }

  const username = user.username;

  if (!user.profilepicture || user.profilepicture === "") {
    console.log("No existing profile picture, creating new one");
    const newProfilePic = generateDefaultProfilePicture(username);
    user.profilepicture = newProfilePic; // Assign new picture to user
    return newProfilePic;
  }

  console.log("Profile picture already exists");
  return `/images/uploads/${user.profilepicture}`;
};
