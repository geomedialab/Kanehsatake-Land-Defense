function changeLanguage() {
    var language = checkLanguage();

    if (language == "english" || language == null) {
        changeToFrench();
    }
    else if (language == "french") {
        changeToEnglish();
    }
}

function changeToFrench() {
    const englishDivs = document.getElementsByClassName("english");
    const frenchDivs = document.getElementsByClassName("french");

    // change styles of english and french divs
    for (i = 0; i < englishDivs.length; i++) {
        englishDivs[i].style.display = "none";
    }
    for (i = 0; i < frenchDivs.length; i++) {
        // Specific check for content of leaflet popup so I can style it properly
        if (frenchDivs[i].parentElement.classList.contains('leaflet-popup-content')) {
            frenchDivs[i].style.display = "inline";
        } else {
            frenchDivs[i].style.display = "block";
        }
    }

    // remove any no-data elements so they don't blink uneccessarily
    var noDataFrench = document.getElementById("no-data-french");
    var noDataEnglish = document.getElementById("no-data");

    if (noDataFrench !== null) {
        noDataFrench.style.display = "none";
    }
    if (noDataEnglish !== null) {
        noDataEnglish.style.display = "none";
    }

    localStorage.setItem("Language", "french")
    console.log("Language set to french")
}

function changeToEnglish() {
    const englishDivs = document.getElementsByClassName("english");
    const frenchDivs = document.getElementsByClassName("french");

    // change styles of english and french divs
    for (i = 0; i < englishDivs.length; i++) {
        // Specific check for content of leaflet popup so I can style it properly
        if (englishDivs[i].parentElement.classList.contains('leaflet-popup-content')) {
            englishDivs[i].style.display = "inline";
        } else {
            englishDivs[i].style.display = "block";
        }
    }
    for (i = 0; i < frenchDivs.length; i++) {
        frenchDivs[i].style.display = "none";
    }

    // remove any no-data elements so they don't blink uneccessarily
    var noDataFrench = document.getElementById("no-data-french");
    var noDataEnglish = document.getElementById("no-data");

    if (noDataFrench !== null) {
        noDataFrench.style.display = "none";
    }
    if (noDataEnglish !== null) {
        noDataEnglish.style.display = "none";
    }

    // Set local storage data
    localStorage.setItem("Language", "english")
    console.log("Language set to english")
}

function checkLanguage() {
    var language = localStorage.getItem("Language")
    return language;
}


function pageLoadLanguageCheck() {
    var languageSwitch = document.getElementById("language-toggle");
    var language = checkLanguage();

    if (language == "french") {
        languageSwitch.click()
        changeToFrench();
    }
}

window.addEventListener("resize", function (event) {
    phoneCheckAndChange();
}
)
window.onload = function () {
    phoneCheckAndChange();
    pageLoadLanguageCheck();
}

function phoneCheckAndChange() {
    console.log("Checking screen size")
    var vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)

    if (vw <= 850) {
        this.document.body.innerHTML =
            '<div class="machina" style="width: 100vw; height: 100vh; color: var(--white-color); background-color: var(--black-color); text-align: center; display: flex; align-items: center; justify-content: center; padding: 10px; flex-direction: column;">\
            <p>This website is not designed for mobile, our apologies.<br><br>\
            <p>Ce site n\'est pas conçu pour les téléphones portables, veuillez nous en excuser.</p>\
            </div>'
    }
}

// Set up password check
function passwordCheck(){
    var password = prompt("This site requires a password to view.\nPlease enter the password:");
    if (password==="LandBack1721"){
        window.location="https://geomedialab.github.io/Kanehsatake-Land-Defense/index.html";
        localStorage.setItem("passwordVerified", true)
    } else{
        passwordCheck();
    }
}

if(localStorage.getItem("passwordVerified") === false || localStorage.getItem("passwordVerified") === null) {
    console.log("Password not entered")
    window.onload=passwordCheck;
}