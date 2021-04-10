var projects = [
    'Soldering Fume Filter',
    'Laser Sight'
] ;
var projectId = [
    'fumefilter',
    'lasersight'
] ;

function listProjects(){
    let list = document.getElementById('projectList');
    let innerHTML = "";

    for(var i = 0; i < projects.length; i++){
        innerHTML = innerHTML + "<li><a href='index.html?project=" + projectId[i] + "&page=0'> " + projects[i] + "</a></li>";
    }

    list.innerHTML = innerHTML;

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

listProjects();


console.log(readURL());
