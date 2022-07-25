//▼ ►

var projects = [
        'test',
        'test2'
];

function dropDown(id, text){
    let dd = document.getElementById(id);
    let items = dd.getElementsByTagName('li');

    if(items[0].classList.contains('dropAnim')){
        dd.getElementsByTagName('div').innerHTML = "►" + text;
        console.log(dd.getElementsByTagName('div').innerHTML);
    }else{
        dd.getElementsByTagName('div').innerHTML = "▼" + text;
    }

    for(let i of items) {
        i.classList.toggle('dropAnim');
    };

    var fs = require('fs');
    var files = fs.readdirSync('projects');
    console.log(files);
}
