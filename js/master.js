var btn = document.getElementById("enterBtn");
var con = document.getElementById("console");

var activeTimeout;
var GET = {};

window.addEventListener('load',onLoadFnc);

function log(text){
    con.innerHTML = con.innerHTML + text;
}

function logNewLine(text){
    con.innerHTML = con.innerHTML + text + "<br>";
}

function enter() {
    btn.innerHTML = "Accessing";
    logNewLine("Injecting new user's credentials...");
    activeTimeout = setTimeout(function() {
        con.classList.add("transitionNav");
        setTimeout(function() {
            con.classList.remove("transitionNav");
            let loc = location.href;
            //window.location.replace(loc.replace("index", "site"));
            window.location.replace(loc + "?injected=1");
        }, 400);
        logNewLine("Logged in.");
    }, 1300);
}
function resetEnter() {
    btn.innerHTML = "Hold To Enter";
    logNewLine("Cancelled Login");

    clearTimeout(activeTimeout);
}

function processCommand(command){
    var cmd = command.split("+");
    log(cmd);
}

function onLoadFnc(){
    var entrance = document.getElementById("entrance");
    var msite = document.getElementById("mainSite");


    var loadedGet = location.href.split("?");
    var splitGet = loadedGet[loadedGet.length-1].split("&");

    splitGet.forEach((item, i) => {
        let keyVal = item.split("=");
        GET[keyVal[0]] = keyVal[1];
    });

    if(GET["injected"]){
        entrance.innerHTML = "";
        msite.classList.remove("hidden");
        con.classList.remove("terminal");
        con.classList.add("navbar");

        con.innerHTML = "> <form method=\"get\" style=\"display: inline;\"><input type=\"text\" name=\"conInput\" class=\"conInput\" value=\"\" autofocus></input><input type=\"submit\" hidden /><input type=\"text\" name=\"injected\" value=\"1\"hidden /></form><br>"
        if(GET["conInput"]){
            processCommand(GET["conInput"]);
        }
    }else{
        logNewLine("New user detected, welcome to Marcus Porfilio's website.")
        logNewLine("Please hold button to authenticate.");
    }
}
