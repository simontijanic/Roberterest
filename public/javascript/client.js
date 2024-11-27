class Client {
    constructor() {
        // Define properties
        this.settingsbutton = document.querySelector(`#settingsbutton`);
        this.optionsContainer = document.querySelector(`.options-container`);

        this.settingsbutton.addEventListener("click", this.settingsMenu.bind(this));
    }

    settingsMenu() {
        if (this.optionsContainer.style.display === "none" || this.optionsContainer.style.display === "") {
            this.settingsbutton.classList.add("active"); 
            this.optionsContainer.style.display = "flex";
        } else {
            this.optionsContainer.style.display = "none";
            this.settingsbutton.classList.remove("active"); 
        }
    }
}

const client = new Client();