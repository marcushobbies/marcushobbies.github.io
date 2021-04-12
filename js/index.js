var eprojects = [
    'Soldering Fume Filter',
    'Laser Sight'
] ;
var eprojectId = [
    'fumefilter',
    'lasersight'
] ;

var cprojects = [
    'This Website!',
    '2D Game'
] ;
var cprojectId = [
    'website',
    'game2d'
] ;

var ddo = 0;
// 0 = neither
// 1 = eProj
// 2 = cProj
// 3 = both

function updateList(difference){
    //2 actually means list 1, 1 actually means list 2
    ddo += difference;
    switch (Math.abs(difference)) {
        case 2:
            unlisteProjects(1);
            listeProjects(1);
            break;
        case 1:
            unlistcProjects(1);
            listcProjects(1);
            break;
        default:
    }
}

function ddoContinuity(difference){
    (ddo+difference == difference || ddo+difference == 0) ? ddo += difference : updateList(difference);
}


function listeProjects(hasContinuity){
    let list = document.getElementById('eprojectList');
    let innerHTML = "<li><a onclick=\"unlisteProjects(0)\" id=\"nosel\">▼ <image src=\"assets/engineering_favicon.png\"> Engineering Projects</a></li>";
    if (hasContinuity == 0) {ddoContinuity(1);}

    for(var i = 0; i < eprojects.length; i++){
        innerHTML = innerHTML + "<li><a href='index.html?project=" + eprojectId[i] + "&ddo="+ddo+"' id=\"project\"> " + eprojects[i] + "</a></li>";
    }

    list.innerHTML = innerHTML;
}
function unlisteProjects(hasContinuity){
    let list = document.getElementById('eprojectList');
    let innerHTML = "<li><a onclick=\"listeProjects(0)\" id=\"nosel\">► <image src=\"assets/engineering_favicon.png\"> Engineering Projects</a></li>";

    list.innerHTML = innerHTML;
    if (hasContinuity == 0) {ddoContinuity(-1);}
}
function listcProjects(hasContinuity){
    let list = document.getElementById('cprojectList');
    let innerHTML = "<li><a onclick=\"unlistcProjects(0)\" id=\"nosel\">▼ <image src=\"assets/coding_favicon.png\"> Coding Projects</a></li>";
    if (hasContinuity == 0) {ddoContinuity(2);}

    for(var i = 0; i < cprojects.length; i++){
        innerHTML = innerHTML + "<li><a href='index.html?project=" + cprojectId[i] + "&ddo="+ddo+"' id=\"project\"> " + cprojects[i] + "</a></li>";
    }

    list.innerHTML = innerHTML;
}
function unlistcProjects(hasContinuity){
    let list = document.getElementById('cprojectList');
    let innerHTML = "<li><a onclick=\"listcProjects(0)\" id=\"nosel\">► <image src=\"assets/coding_favicon.png\"> Coding Projects</a></li>";

    list.innerHTML = innerHTML;
    if (hasContinuity == 0) {ddoContinuity(-2);}
}

function readURL(){
    let url = window.location.href;
    let fullformdata = url.split("?")[1];
    let formdata = fullformdata.split("&");

    var dataMap = new Map();
    for(var i = 0; i < formdata.length; i++){
        let data = formdata[i].split("=");
        dataMap[data[0]] = data[1];
    }

    return dataMap;
}

function updateView(){
    let view = document.getElementsByClassName('view');
    let innerHTML = "";

    var file = "projects/fumefilter.proj";

    var reader = new FileReader();
    reader.onload = function(progressEvent){
    // Entire file
    console.log(this.result);

    // By lines
    var lines = this.result.split('\n');
    for(var line = 0; line < lines.length; line++){
      console.log(lines[line]);
    }
    };
    reader.readAsText(file);

}

function continuityCheck(){
    var GET = readURL();

    if(GET['ddo']){
        var localddo = GET['ddo'];

        if(localddo == 1){
            listeProjects(0);
        }
        if(localddo == 2){
            listcProjects(0);
        }
        if(localddo == 3){
            listeProjects(0);
            listcProjects(0);
        }
    }

    console.log("Continuity Fixed.");
}
function readProjectFile(){
    var GET = readURL();
    var projectframe = document.getElementById("project");
    console.log("TSET");
    projectframe.src = "projects/"+GET['project']+".html";
}

readProjectFile();

continuityCheck();
