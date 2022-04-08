var ctx = document.getElementById('canvas').getContext('2d');

ctx.font = "16px Times New Roman";

// ♩   ♭   ♮  ♯

class Note {
  constructor(note){
    this.note = note; //0 is C4, 4 is G4 etc
  }
}

var notes = new Map([
  [0, 'C'],
  [-1, 'D'],
  [-2, 'E'],
  [-3, 'F'],
  [-4, 'G'],
  [-5, 'A'],
  [-6, 'B'],
  [-7, 'C'],
  [-8, 'D'],
  [-9, 'E'],
  [-10, 'F'],
  [-11, 'G'],
  //LH
  [-12, 'E'],
  [-13, 'F'],
  [-14, 'G'],
  [-15, 'A'],
  [-16, 'B'],
  [-17, 'C'],
  [-18, 'D'],
  [-19, 'E'],
  [-20, 'F'],
  [-21, 'G'],
  [-22, 'A'],
  [-23, 'B']
]);

class Staff {
  constructor(x, y, width){
    this.x = x;
    this.y = y;
    this.width = width;
    this.spacing = 20;
    this.increment = this.spacing/2;
    }

  drawStaff(){
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x, this.y+12*this.spacing);
    for(let barLine = 0; barLine < 2; barLine++){
      for(let i = 0; i < 5; i++){
        ctx.moveTo(this.x, this.y + i*this.spacing + barLine*8*this.spacing);
        ctx.lineTo(this.x+this.width, this.y + i*this.spacing + barLine*8*this.spacing);
      }
    }

    ctx.stroke();
    drawChar('𝄞', this.spacing*4, this.x, this.y+(this.spacing*3));
    drawChar('𝄢', this.spacing*4, this.x, this.y+(this.spacing*3) + 8*this.spacing)
  }

  drawKey(key){
    /*♮  ♯
    RH
    0 C
    -1 D
    -2 E
    -3 F
    -4 G
    -5 A
    -6 B
    -7 C
    -8 D
    -9 E
    -10 F
    -11 G
    LH
    0 E
    -1 F
    -2 G
    -3 A
    -4 B
    -5 C
    -6 D
    -7 E
    -8 F
    -9 G
    -10 A
    -11 B


    Flat order:
    L -> R
    B, E, A, D, G
    */

    switch (key) {
      case 'a-':
      case 'c+':
        break;
      case 'ef+':
      case 'c-':  //A B E flat
        this.drawAccidental(-5, '♭', 2, 0);
        this.drawAccidental(-6, '♭', 0, 0);
        this.drawAccidental(-9, '♭', 1, 0);
        break;
      case 'a#-':
      case 'c#+':
        this.drawAccidental(-10, '♯', 0, 0);
        this.drawAccidental(-7, '♯', 1, 0);
        this.drawAccidental(-11, '♯', 2, 0);
        this.drawAccidental(-8, '♯', 3, 0);
        this.drawAccidental(-5, '♯', 4, 0);
        this.drawAccidental(-9, '♯', 5, 0);
        this.drawAccidental(-6, '♯', 6, 0);
        break;
      case 'b-':
      case 'd+':
        this.drawAccidental(-9, '♯', 1, 0);
        this.drawAccidental(-7, '♯', 5, 0);
        break;
      case 'c#-':
      case 'e+':

        break;
      case 'd-':
      case 'f+':
        this.drawAccidental(-6, '♭', 1, 0);

        break;
      case 'af+':
      case 'f-':

        break;
      case 'f#+':
      case 'd#-':

        break;
      case 'e-':
      case 'g+':

        break;
      case 'bf+':
      case 'g-':

        break;
      case 'f#-':
      case 'a+':

        break;
      case 'g#-':
      case 'b+':

        break;
      case 'df+':
      case 'bf-':

        break;
      case 'gf+':
      case 'ef-':

        break;
      case 'cf+':
      case 'af-':

        break;
      default:

    }
  }
  drawAccidental(note, type, shift, hand){
    drawChar(type, this.increment*9, shift*this.spacing + (this.spacing*1.5) + this.x+40, this.y + this.increment*(note+11) + hand*this.spacing*8);
  }

  addNote(note, shift, hand){  // 0 = right, 1 = left
    let i = shift*this.spacing*5 + (this.spacing*1.5) + this.x+40;
    let j = this.y + this.increment*(note+11) + hand*this.spacing*8;
    drawChar('♩',  this.increment*8, i, j);
    if(note == 0){
        ctx.beginPath();
        ctx.moveTo(i+2, j-7);
        ctx.lineTo(this.increment*2.8 +i ,j-7);
        ctx.stroke();
    }
    if(document.getElementById('showNotes').checked){
      drawLet(notes.get((-12)*hand + note), 16,  i+12, j-5);
    }
  }
  addRandom(hand){
    let chord = Math.ceil(3*Math.random());
    for(let i = 0; i < chord; i++){
      this.addNote(Math.ceil(-11*Math.random()), 2, hand);
    }
  }
}

function drawChar(char, size, x, y){
  let colour = "#000000";
  let oldColour = ctx.fillStyle;
  ctx.fillStyle = colour;

  let oldFont = ctx.font;
  ctx.font = size + "px Times New Roman";
  ctx.fillText(char, x, y);

  ctx.font = oldFont;
  ctx.fillStyle = oldColour;
}

function drawLet(char, size, x, y){
  let colour = "#FFFFFF";
  let oldColour = ctx.fillStyle;
  ctx.fillStyle = colour;

  let oldFont = ctx.font;
  ctx.font = size + "px Times New Roman";
  ctx.fillText(char, x, y);

  ctx.font = oldFont;
  ctx.fillStyle = oldColour;
}
function drawNoteAt(x, y){
  let colour = "#000000";
  let oldColour = ctx.fillStyle;
  ctx.fillStyle = colour;

  let oldFont = ctx.font;
  ctx.font = "32px Times New Roman";
  ctx.fillText("♩", x, y);

  ctx.font = oldFont;
  ctx.fillStyle = oldColour;
}

var staff = new Staff(20, 50, 900);
staff.drawStaff();
//staff.addNote(-11 * Math.random(), 0);
//staff.addNote(-11 * Math.random(), 1);
function randomize(){

  let scale = document.getElementById("scale");
  let key = document.getElementById("key");

  ctx.clearRect(0, 0, 940, 350);
  staff.drawStaff();
  staff.drawKey(scale.value + key.value);
  staff.addRandom(0);
  staff.addRandom(1);
}
