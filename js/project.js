var logs = document.getElementsByClassName("log");

toggleBuildLogs()

function toggleBuildLogs(){
    for(var i =0; i < logs.length; i++){
        if(logs[i].style.display != "none")
            logs[i].style.display = "none";
        else
            logs[i].style.display = "flex";
    }
}