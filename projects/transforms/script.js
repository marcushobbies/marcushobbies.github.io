var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');


ctx.strokeStyle = "rgb(255, 0 , 0)";
ctx.lineWidth = 2;

var squarePath = new Path2D();

var octVertices = [
        10, 20,
        20, 100,
        20, -10,
        100, -20,
        -10, -20,
        -20, -100,
        -20, 10,
        -100, 20
];
var orn = [
    100, 100
];
var ang = Math.PI/640;

class Shape {
    constructor(vertices, origin) {
        this.vertices = vertices;
        this.origin = [...origin];
    }
    setVertices(vertices){
        this.vertices = vertices;
    }
    getRelativeVertices(){
        let relativeTransform = [];
        for(let i = 0; i < this.vertices.length; i+=2){
            relativeTransform[i] = this.vertices[i]+this.origin[0];
            relativeTransform[i+1] = this.vertices[i+1]+this.origin[1];
        }
        return relativeTransform;
    }
    rotate(point, angle){
        for(let i = 0; i < this.vertices.length; i+=2){
            let x = this.vertices[i];
            let y = this.vertices[i+1];
            this.vertices[i] = (x*Math.cos(angle) - y*Math.sin(angle));
            this.vertices[i+1] = (x*Math.sin(angle) + y*Math.cos(angle));
        }
    }
}

var octagon = new Shape(octVertices, orn);
//let t = shear2D(octagon.vertices, 5);
//octagon.setVertices(t);

function draw(){
    requestAnimationFrame(draw);
    ctx.clearRect(0, 0, 1600, 1600);

    //let transform = rotateMatrix2d(octagon, orn, ang);
    //let transform;

    //transform = rotateMatrix2d(octagon, orn, ang);
    //octagon.setVertices(transform);
    let transform = octagon.getRelativeVertices();

    octagon.rotate([99, 99], ang);


    ctx.beginPath();
    ctx.moveTo(transform[0], transform[1]);
    for(let i = 2; i < transform.length; i+=2){
        ctx.lineTo(transform[i], transform[i+1]);
        ctx.moveTo(transform[i], transform[i+1]);
    }
    ctx.lineTo(transform[0], transform[1]);
    ctx.closePath();

    ctx.stroke();
}

function shear2D(matrix, k){
    let transform = [...matrix];
    for(let i = 0; i < transform.length; i+=2){
        let x = transform[i];
        let y = transform[i+1];
        transform[i] = (x*k);
        transform[i+1] = (y);
    }
    return transform;
}

draw();
