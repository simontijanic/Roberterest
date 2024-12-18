class Client {
  constructor() {
    this.settingsbutton = document.querySelector(`#settingsbutton`);
    this.optionsContainer = document.querySelector(`.options-container`);
    this.fileUploadContainer = document.querySelector(`#file`);
    this.deleteForm = document.querySelector(".delete-form");
    this.sideBarButtons = document.querySelectorAll(".menu a");
    this.searchInput = document.getElementById("searchInput");

    if (this.settingsbutton) {
      this.settingsbutton.addEventListener(
        "click",
        this.settingsMenu.bind(this)
      );
    }

    if (this.fileUploadContainer) {
      this.fileUploadContainer.addEventListener(
        "change",
        this.previewUploadImage.bind(this)
      );
    }

    this.chevrons = document.querySelectorAll(".chevron-down");
    this.chevrons.forEach((chevron) => {
      chevron.addEventListener("click", this.togglePostDiv.bind(this, chevron));
    });

    this.searchInput.addEventListener("input", this.searchFunction.bind(this));
  }

  togglePostDiv(chevron) {
    const postId = chevron.getAttribute("data-post-id");

    // Find the corresponding post_Div using the postId
    const postDiv = document.getElementById(postId);

    // Toggle the display of the postDiv
    if (postDiv.style.display === "none" || postDiv.style.display === "") {
      postDiv.style.display = "flex"; // Show the postDiv
      chevron.style.transform = "rotate(180deg)"; // Rotate the chevron
    } else {
      postDiv.style.display = "none"; // Hide the postDiv
      chevron.style.transform = "rotate(0deg)"; // Reset the chevron rotation
    }
  }

  settingsMenu() {
    if (
      this.optionsContainer.style.display === "none" ||
      this.optionsContainer.style.display === ""
    ) {
      this.settingsbutton.classList.add("active");
      this.optionsContainer.style.display = "flex";
    } else {
      this.optionsContainer.style.display = "none";
      this.settingsbutton.classList.remove("active");
    }
  }

  previewUploadImage(event) {
    const file = event.target.files[0];
    const preview = document.getElementById("preview");

    if (file) {
      const reader = new FileReader();

      reader.onload = function (e) {
        preview.src = e.target.result;
        preview.style.display = "block";
      };

      reader.readAsDataURL(file);
    } else {
      preview.style.display = "none";
    }
  }

  async searchFunction(event) {
    const query = event.target.value;

    const response = await fetch(`/search?query=${encodeURIComponent(query)}`);
    const results = await response.json();

    const grid = document.querySelector(".grid");
    grid.innerHTML = "";

    results.forEach((post) => {
      const gridItem = document.createElement("div");
      gridItem.classList.add("grid-item");

      gridItem.innerHTML = `
                <a class="buttonProfilePost" href="/post/${post._id}">
                    <img class="gridPostImage" src="/images/uploads/${
                      post.image
                    }" alt="Post Image" />
                </a>
                <div class="info">
                    <div class="imageforgrid">
                        <img class="profilelogo" src="${
                          post.profilepicture
                        }" alt="User Profile Picture">
                    </div>
                    ${post.posttext ? `<p>${post.posttext}</p>` : ""}
                </div>
            `;
      grid.appendChild(gridItem);
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const client = new Client();
});
