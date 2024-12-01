class Client {
    constructor() {
        this.settingsbutton = document.querySelector(`#settingsbutton`);
        this.optionsContainer = document.querySelector(`.options-container`);
        this.fileUploadContainer = document.querySelector(`#file`);
        this.deleteForm = document.querySelector(".delete-form")

        this.settingsbutton.addEventListener("click", this.settingsMenu.bind(this));
        this.fileUploadContainer.addEventListener("change", this.previewUploadImage.bind(this));
       // this.deleteForm.addEventListener("change", this.previewUploadImage.bind(this));


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

    previewUploadImage(event) {
        const file = event.target.files[0];
        const preview = document.getElementById('preview');
        
        if (file) {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                preview.src = e.target.result;  
                preview.style.display = 'block'; 
            };
            
            reader.readAsDataURL(file);
        } else {
            preview.style.display = 'none';
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const client = new Client();
})

