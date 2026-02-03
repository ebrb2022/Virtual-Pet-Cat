

// initialize stats
const maxStats = 100;
let hunger = 100;
let happiness = 100;
let energy = 100;
let health = 100;
let money = 0;

// cat gif img
const cat = document.getElementById("cat");

// stat bars
const healthBar = document.getElementById("health-bar");
const hungerBar = document.getElementById("hunger-bar");
const energyBar = document.getElementById("energy-bar");
const happyBar = document.getElementById("happiness-bar");

// action btns
const feedBtn = document.getElementById("feed");
const playBtn = document.getElementById("play");
const sleepBtn = document.getElementById("sleep");

// alert btn
const closeBtn = document.getElementById("close-button");

// sitter btns
const sitter1h = document.getElementById("sitter-1h");
const sitter6h = document.getElementById("sitter-6h");
const sitter12h = document.getElementById("sitter-12h");

// current mood
const moodText = document.getElementById("mood-text");

// total amount of $$
const totalAmmt = document.getElementById("ammt");

// initializing the interval that updates all the recurring fcts
let mainInterval; 

// flags
let isSleeping = false;
let isEating = false;
let isPlaying = false;
let isDead = false;

let isLocked = false; 
let isMeowing = false;
let currentTimeout = null;
let sleepInterval = null;

let sitterActive = false;
let sitterEndTime = 0;
let sitterStartTime = 0;


// saving all the current var states
function saveCatState() {
    localStorage.setItem("hunger", hunger);
    localStorage.setItem("happiness", happiness);
    localStorage.setItem("energy", energy);
    localStorage.setItem("health", health);
    localStorage.setItem("money", money);
    localStorage.setItem("isSleeping", isSleeping ? "1" : "0");
    localStorage.setItem("isDead", isDead ? "1" : "0");
    localStorage.setItem("sitterActive", sitterActive ? "1" : "0");
    localStorage.setItem("sitterEndTime", sitterEndTime);
    localStorage.setItem("sitterStartTime", sitterStartTime);
}

// loading back those vars w/ saved vals
function loadCatState() {
    if (localStorage.getItem("hunger") !== null) {
        hunger = Number(localStorage.getItem("hunger"));
        happiness = Number(localStorage.getItem("happiness"));
        energy = Number(localStorage.getItem("energy"));
        health = Number(localStorage.getItem("health"));
        money = Number(localStorage.getItem("money"));
        isSleeping = localStorage.getItem("isSleeping") == "1";
        isDead = localStorage.getItem("isDead") == "1";
        sitterActive = localStorage.getItem("sitterActive") === "1";
        sitterEndTime = Number(localStorage.getItem("sitterEndTime")) || 0;
        sitterStartTime = Number(localStorage.getItem("sitterStartTime")) || 0;
    }
}

// restarting the game states for when cat dies
function resetCat() {
    isDead = false;
    sitterActive = false;
    updateAlertBtn();
    localStorage.clear();
    location.reload(); // reloads current webpage
}

// for displaying alert msg
function showAlert(icon, title, msg) {
    document.getElementById("alert-icon").textContent = icon;
    document.getElementById("alert-title").textContent = title;
    document.getElementById("message").textContent = msg;
    document.getElementById("alert-box").style.display = "flex";
    document.getElementById("alert-box").classList.add("show");
    updateAlertBtn();

}

// the alert button behavior dynamically changes based on bool states
function updateAlertBtn () {
    if (isDead) {
        closeBtn.textContent = "Restart";
        closeBtn.onclick = () => resetCat();
        return;
    }

    if (sitterActive) {
        closeBtn.textContent = "Return Cat";
        closeBtn.onclick = () => returnCatEarly();
        return;
    }

    closeBtn.textContent = "Close";
    closeBtn.onclick = () => {
        document.getElementById("alert-box").style.display = "none";
    };

}

// localStorage.clear();

// loading back everything in from saved session
window.onload = function () {

    loadCatState();

    // remembering to set death scene even if user reloads page
    if (isDead) {
        triggerDeath();
        return;
    }

    // the tracker of main functs
    mainInterval = setInterval(() => {

        if (sitterActive) {
            // keep track of hrs left (dividing ms by 3.6 mil shows hrs) then round up
            const hoursLeft = Math.max(0, Math.ceil((sitterEndTime - Date.now()) / 3600000));
            // makes sure to show this again when user comes back to page (if they enabled sitter)
            showAlert("₍^. .^₎⟆", "Pet Sitter Hired", `Your cat will be cared for for ${hoursLeft} hour(s).`);

            updateAlertBtn(); // gotta make sure we get the correct btn text

            sitterMode(); //activate sitter mode

            // stat bars updating while on sitter mode
            updateBar(happiness, happyBar);
            updateBar(energy, energyBar);
            updateBar(hunger, hungerBar);
            updateBar(health, healthBar);
            return;
        }

        // stat bar updating normally
        updateBar(happiness, happyBar);
        updateBar(energy, energyBar);
        updateBar(hunger, hungerBar);
        updateBar(health, healthBar);

        //calculating health
        updateHealth();

        //seeing if we need cat meow for when stats are low
        catMeowUpdate();

        // update money count
        updateMoneyDisplay();

        //update mood count
        moodDisplay();

        // automatically stop sleeping if fully energized
        if (energy >= 100) {
            stopSleep();
        }
        saveCatState();
    }, 250);

};

// gifs for different cat states
const catGifs = {
    happy: "imgs/HappyCat.gif",
    sleeping: "imgs/CatSleep.gif",
    eating: "imgs/CatEat.gif",
    meowing: "imgs/MeowCat.gif",
    cute: "imgs/CuteCat.gif",
    dead: "imgs/DeadCat.gif"
}
// gotta keep track of how long these gifs last for proper animation
const gifDuration = {
    sleeping: 3000,
    eating: 6200,
    cute: 3250,
    happy: 3000,
    dead: 400,
    meowing: 3000
}

//updating bar val based on percentage (+ color change on break points)
function updateBar(barStats, bar) {
    const percentage = ((barStats/maxStats) * 100);
    bar.style.width = percentage + "%";

    if (percentage < 25) {
        bar.style.backgroundColor = "firebrick";
    } else if (percentage < 50) {
        bar.style.backgroundColor = "goldenrod";
    }  else {
        bar.style.backgroundColor = "#4CAF50";
    }
}

// changing cat gif
function changeImage(action) {
    // don't do anything if any of those states are true
    if (isLocked && action != "sleep") return;

    // clear timeout
    if (currentTimeout) {
        clearTimeout(currentTimeout);
        currentTimeout = null;
    }

    // cleanly resets gif to first frame
    cat.src = catGifs[action] + "?t=" + Date.now();

    // time eating and playing anim
    if (action == "eating" || action == "cute") {

        isLocked = true;
        setTimeout(() => {
            isLocked = false;

            // go back to either meowing or happy anim
            if (!isMeowing) {
              cat.src = catGifs.happy;  
            }
            else {
                cat.src = catGifs.meowing;
            }
            
        }, gifDuration[action]);
        
    } else {
        return;
    }
}


function updateHealth() {
    let change = 0;

    // hunger influence
    if (hunger < 5) {
        change -= 0.5; 
        happiness = Math.max(0, happiness - 0.25);
        energy = Math.max(0, energy - 0.20);
    } else if (hunger < 15) {
        change -= 0.25; 
    } else if (hunger < 30) {
        change -= 0.125;
    } else if (hunger >= 60 && hunger < 80) {
        change += 0.125; 
    } else if (hunger >= 80) {
        change += 0.25; 
    }

    // happiness influence
    if (happiness < 10) {
        change -= 0.25; 
    } else if (happiness < 25) {
        change -= 0.125; 
    } else if (happiness >= 60 && happiness < 80) {
        change += 0.125; 
    } else if (happiness >= 80) {
        change += 0.25; 
    }

    // energy influence
    if (energy < 5) {
        change -= 0.5; 
        happiness = Math.max(0, happiness - 0.25); 
    } else if (energy < 15) {
        change -= 0.25; 
    } else if (energy < 25) {
        change -= 0.125;
    } else if (energy >= 60 && energy < 80) {
        change += 0.125; 
    } else if (energy >= 80) {
        change += 0.25; 
    }

    // apply change
    health = Math.max(0, Math.min(100, health + change));

    // detect death
    if (health <= 0 && !isDead) {
        triggerDeath();
    }
}

// death scene :((
function triggerDeath() {
    isDead = true;
    updateAlertBtn();
    clearInterval(sleepInterval);
    clearInterval(mainInterval);

    feedBtn.disabled = true;
    playBtn.disabled = true;
    sleepBtn.disabled = true;
    sitter1h.disabled = true;
    sitter6h.disabled = true;
    sitter12h.disabled = true;

    changeImage("dead");
    document.getElementById("death-screen").classList.add("show");
    setTimeout(() => {
        showAlert(":,(", "Your Cat Has Died", "It seems you have forgotten to take care of your cat. Restart to adopt a new one."); 
    }, 10000);
    
}

// deducts money if possible, sets alert, starts the sitter timer
function hireSitter(hours, cost) {
    if (money < cost) {
        showAlert("⚠", "Not Enough Money", "You can't afford a pet sitter.")
        return; 
    }

    money -= cost;
    sitterActive = true;

    sitterEndTime = Date.now() + (hours * 60 * 60 * 1000);
    saveCatState();
    showAlert("₍^. .^₎⟆", "Pet Sitter Hired", `Your cat will be cared for for ${hours} hour(s).`);
}

// activate sitter mode B)
function sitterMode() {
    const now = Date.now();

    if (now >= sitterEndTime) {
        endSitter()
        return;
    }

    //  incrementing stats while sitter is active
    hunger = Math.min(100, hunger + 0.1);
    happiness = Math.min(100, happiness + 0.1);
    energy = Math.min(100, energy + 0.1);
    health = Math.min(100, health + 0.1);
}

// for ending the sitter mode after timer ends
function endSitter() {
    sitterActive = false;

    hunger = Math.min(100, hunger + 40);
    happiness = Math.min(100, happiness + 40);
    energy = Math.min(100, energy + 50);
    health = Math.min(100, health + 40);

    updateAlertBtn();
    showAlert("^-^", "Your Cat Is Back!", "The sitter took great care of your cat.");

    saveCatState();
}

// to allow player to go back to game from sitter mode
function returnCatEarly() {
    if (!sitterActive) return;

    const now = Date.now();
    const total = sitterEndTime - sitterStartTime;
    const elapsed = now - sitterStartTime;

    const pct = Math.min(1, elapsed / total);

    // partial benefits
    hunger = Math.min(100, hunger + 40 * pct);
    happiness = Math.min(100, happiness + 40 * pct);
    energy = Math.min(100, energy + 50 * pct);
    health = Math.min(100, health + 40 * pct);

    sitterActive = false;

    updateAlertBtn(); // button becomes "Close"
    showAlert("^-^", "Your Cat Came Home Early", "They were happy to see you!");

    saveCatState();
}

// cat meows if stats are low
function catMeowUpdate() {
    const shouldMeow = (hunger < 30 || energy < 25 || happiness < 25);
    if (shouldMeow && !isMeowing) {
            isMeowing = true;
            changeImage("meowing");
        }

    if (!shouldMeow && isMeowing) {
        isMeowing = false;
        changeImage("happy");
    }
}


// appends moods and needs
function getMood() {
    let tags = []; // holds the mood txts

    //hunger
    if (hunger < 15)  {
        tags.push("starving");
    } else if (hunger < 30) {
        tags.push("hungry");
    }

    //energy
    if (energy < 15 ) {
        tags.push("exhausted");
    } else if (energy < 25) {
        tags.push("sleepy");
    }

    //happiness
    if (happiness < 10) {
        tags.push("sad");
    } else if (happiness < 25) {
        tags.push("bored");
    }
    //main mood (based on overall wellbeing)
    const avg = (hunger + happiness + energy) / 3;

    let mainMood = "neutral";

    if (avg > 75) {
        mainMood = "happy";
    } else if (avg > 55) {
        mainMood = "content";
    } else if (avg < 35) {
        mainMood = "grumpy";
    }

    if (mainMood == "happy" && tags.length > 0) {
        mainMood = "content";
    }

    if (tags.length > 0) {
        return mainMood + " (" + tags.join(", ") + ")";
    }

    return mainMood;

}


function moodDisplay() {
    moodText.textContent = getMood();
}

// sleeping logic
function startSleep() {
    if (isSleeping) return;
    isSleeping = true;
    changeImage("sleeping");
    sleepBtn.innerText = "Wake";

    sleepInterval = setInterval(() => {
        energy = Math.min(100, energy + 1);
    }, 500);

    feedBtn.disabled = true;
    playBtn.disabled = true;
    sitter1h.disabled = true;
    sitter6h.disabled = true;
    sitter12h.disabled = true;
    
    // automatically stop sleeping if energized
    if (energy >= 100) {
        stopSleep();
    }

}

// ending sleep
function stopSleep() {
    if (!isSleeping) return;
    feedBtn.disabled = false;
    playBtn.disabled = false;
    sitter1h.disabled = false;
    sitter6h.disabled = false;
    sitter12h.disabled = false;
    isSleeping = false;
    clearInterval(sleepInterval);
    sleepInterval = null;
    changeImage("happy");
    sleepBtn.innerText = "Sleep";

}

// snaturally decaying stats
const hungerInterval = setInterval(function() {
    if (hunger > 0) {
        hunger -= 1;
    }
}, 5000);

const happyInterval = setInterval(function() {
    if (happiness > 0) {
        happiness -= 1;
    }
}, 10000);

const energyInterval = setInterval(function() {
    if (energy > 0) {
        energy -= 1 ;
    }
}, 15000);


// incrementing money on timely basis (as long as happy or content)
let getMoney = setInterval(() => {
    const mood = getMood();

    if (mood.startsWith("happy")) money += 2;
    else if (mood.startsWith("content")) money += 1;

}, 10000);


// gotta show that cash
function updateMoneyDisplay() {
    totalAmmt.innerText = money;
}

// action clicks
feedBtn.onclick = function() {
    if (isEating) return;
    if (hunger >= 100) return;
    playBtn.disabled = true;
    sleepBtn.disabled = true;
    sitter1h.disabled = true;
    sitter6h.disabled = true;
    sitter12h.disabled = true;
    isEating = true;
    changeImage("eating");
    hunger = Math.min(100, hunger + 25);
    setTimeout(() => {
        playBtn.disabled = false;
        sleepBtn.disabled = false;
        sitter1h.disabled = false;
        sitter6h.disabled = false;
        sitter12h.disabled = false;
        isEating = false;
    }, gifDuration.eating);
    
}

playBtn.onclick = function() {
    if (isPlaying) return;
    if (happiness >= 100) return;
    feedBtn.disabled = true;
    sleepBtn.disabled = true;
    sitter1h.disabled = true;
    sitter6h.disabled = true;
    sitter12h.disabled = true;
    isPlaying = true;
    changeImage("cute"); 
    happiness = Math.min(100, happiness + 25);
    energy = Math.max(0, energy - 10);
    hunger = Math.max(0, hunger - 10);
    setTimeout(() => {
        feedBtn.disabled = false;
        sleepBtn.disabled = false;
        sitter1h.disabled = false;
        sitter6h.disabled = false;
        sitter12h.disabled = false;
        isPlaying = false;
    }, gifDuration.cute);
    
};
sleepBtn.onclick = function() {
    if (!isSleeping) {
        startSleep();
    } else {
        stopSleep();
    }
    
}

//sitter clicks
sitter1h.onclick = () => {
    hireSitter(1, 50);
};

sitter6h.onclick = () => {
    hireSitter(6, 300);
};

sitter12h.onclick = () => {
    hireSitter(12, 600);
};









