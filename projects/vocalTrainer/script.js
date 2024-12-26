//A lot of this code was figured out Thanks to Alex Ellis' work: https://alexanderell.is/posts/tuner/
/*
The MIT License (MIT)
Copyright (c) 2014 Chris Wilson
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

Note: autoCorrelate comes from https://github.com/cwilso/PitchDetect/pull/23
with the above license.

*/

var pitchElement = document.getElementById("pitch");
var noteElement = document.getElementById("note");
var targetNoteElement = document.getElementById("targetNote");

var topTimeSignature = document.getElementById("topTimeSig");
var btmTimeSignature = document.getElementById("btmTimeSig");

var source;
var audioContext;
var analyser;

var running = false;

var canvas = document.getElementById('sheet');
var canvasWidth = canvas.getBoundingClientRect().width;
var canvasHeight = canvas.getBoundingClientRect().height;

var ctx = canvas.getContext("2d", { alpha: false });

getLocalStream();



// From https://github.com/cwilso/PitchDetect/pull/23
function autoCorrelate(buffer, sampleRate) {
  // Perform a quick root-mean-square to see if we have enough signal
  var SIZE = buffer.length;
  var sumOfSquares = 0;
  for (var i = 0; i < SIZE; i++) {
    var val = buffer[i];
    sumOfSquares += val * val;
  }
  var rootMeanSquare = Math.sqrt(sumOfSquares / SIZE)
  if (rootMeanSquare < 0.01) {
    return -1;
  }

  // Find a range in the buffer where the values are below a given threshold.
  var r1 = 0;
  var r2 = SIZE - 1;
  var threshold = 0.2;

  // Walk up for r1
  for (var i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buffer[i]) < threshold) {
      r1 = i;
      break;
    }
  }

  // Walk down for r2
  for (var i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buffer[SIZE - i]) < threshold) {
      r2 = SIZE - i;
      break;
    }
  }

  // Trim the buffer to these ranges and update SIZE.
  buffer = buffer.slice(r1, r2);
  SIZE = buffer.length

  // Create a new array of the sums of offsets to do the autocorrelation
  var c = new Array(SIZE).fill(0);
  // For each potential offset, calculate the sum of each buffer value times its offset value
  for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE - i; j++) {
      c[i] = c[i] + buffer[j] * buffer[j+i]
    }
  }

  // Find the last index where that value is greater than the next one (the dip)
  var d = 0;
  while (c[d] > c[d+1]) {
    d++;
  }

  // Iterate from that index through the end and find the maximum sum
  var maxValue = -1;
  var maxIndex = -1;
  for (var i = d; i < SIZE; i++) {
    if (c[i] > maxValue) {
      maxValue = c[i];
      maxIndex = i;
    }
  }

  var T0 = maxIndex;

  // From the original author:
  // interpolation is parabolic interpolation. It helps with precision. We suppose that a parabola pass through the
  // three points that comprise the peak. 'a' and 'b' are the unknowns from the linear equation system and b/(2a) is
  // the "error" in the abscissa. Well x1,x2,x3 should be y1,y2,y3 because they are the ordinates.
  var x1 = c[T0 - 1];
  var x2 = c[T0];
  var x3 = c[T0 + 1]

  var a = (x1 + x3 - 2 * x2) / 2;
  var b = (x3 - x1) / 2
  if (a) {
    T0 = T0 - b / (2 * a);
  }

  return sampleRate/T0;
}

function reportCanvasSize() {
  //canvasHeight = window.height*window.devicePixelRatio;
  //canvasWidth = window.width*window.devicePixelRatio;

  //canvas.width = window.innerWidth;
  //canvas.height = 700;
}

window.onresize = reportCanvasSize;

const debugURL = 'myway.mp3';
var audio;
var useDebugAudio = false;

function getLocalStream() {
    audio = new Audio('f2-c6.mp3');
    audio.controls = true;
    audio.autoplay = true;
    audio.crossOrigin = "anonymous";


  navigator.mediaDevices.getUserMedia({ video: false, audio: true }).then((stream) => {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      analyser.minDecibels = -100;
      analyser.maxDecibels = -10;
      analyser.smoothingTimeConstant = 0.1; //Was at 0.85

     // source = audioContext.createMediaStreamSource(stream); //use microphone
      if(useDebugAudio){
          source = audioContext.createMediaElementSource(audio); //use myway.mp3
      }else{
          source = audioContext.createMediaStreamSource(stream);
      }
      source.connect(analyser);

      if(useDebugAudio){
          analyser.connect(audioContext.destination);
      }
      running = true;
    })
    .catch((err) => {
      console.error(`you got an error: ${err}`);
    });
}

var noteThreshold = 15; //How accurate should it be updating? Default is it will only update for a 0.1Hz difference or more
var noteHeldThreshold = 5;
var heldTime = 0;
var heldNote = 0;
var displayValue = 0;
var previousDisplayValue = 0;

function findNote(){
    var bufferLength = analyser.fftSize;
    var buffer = new Float32Array(bufferLength);
    analyser.getFloatTimeDomainData(buffer);
    var autoCorrelateFrequencyValue = autoCorrelate(buffer, audioContext.sampleRate);

    displayValue = autoCorrelateFrequencyValue;

    if(Math.abs(displayValue-previousDisplayValue) > noteThreshold && displayValue != -1){
            previousDisplayValue = displayValue;
            updateDisplay(displayValue);
    }else{
        if(heldTime < noteHeldThreshold){
            heldTime++;
        }else{
            heldTime = 0;
            previousDisplayValue = displayValue;
            updateDisplay(displayValue);
        }
    }

}

function updateDisplay(value){
    if(value === -1){
        pitchElement.innerHTML = "Too Quiet";
        noteElement.innerHTML = "N/A";
        return;
    }
    pitchElement.innerHTML = value.toPrecision(5) + "Hz";
    noteElement.innerHTML = findRelativeNote(value);
    heldNote = value;


}

var staff = new Path2D();
const trebleClefImg = document.getElementById("trebleClef");
const bassClefImg = document.getElementById("bassClef");

const offsetFromTop = 150;
var gap = 27;

function createStaff(gapSize, yOffset){

    for(var y = yOffset; y < yOffset+5; y++){
        staff.moveTo(0, (y-yOffset)*gapSize + yOffset);
        staff.lineTo(canvasWidth, (y-yOffset)*gapSize + yOffset);
    }
    let bassYOffset = yOffset + 6*gapSize;

    for(var y = bassYOffset; y < bassYOffset+5; y++){
        staff.moveTo(0, (y-bassYOffset)*gapSize + bassYOffset);
        staff.lineTo(canvasWidth, (y-bassYOffset)*gapSize + bassYOffset);
    }
}
var halfStepsFromA4 = new Map();
var inverseHalfStepsFromA4 = new Map();

var targetNoteFindFromA4 = new Map();


function generateSemitoneMap(){
    halfStepsFromA4.set(-57, 'C0');
    halfStepsFromA4.set(-56, 'C#0');
    halfStepsFromA4.set(-55, 'D0');
    halfStepsFromA4.set(-54, 'D#0');
    halfStepsFromA4.set(-53, 'E0');
    halfStepsFromA4.set(-52, 'F0');
    halfStepsFromA4.set(-51, 'F#0');
    halfStepsFromA4.set(-50, 'G0');
    halfStepsFromA4.set(-49, 'G#0');
    halfStepsFromA4.set(-48, 'A0');
    halfStepsFromA4.set(-47, 'A#0');
    halfStepsFromA4.set(-46, 'B0');

    halfStepsFromA4.set(-45, 'C1');
    halfStepsFromA4.set(-44, 'C#1');
    halfStepsFromA4.set(-43, 'D1');
    halfStepsFromA4.set(-42, 'D#1');
    halfStepsFromA4.set(-41, 'E1');
    halfStepsFromA4.set(-40, 'F1');
    halfStepsFromA4.set(-39, 'F#1');
    halfStepsFromA4.set(-38, 'G1');
    halfStepsFromA4.set(-37, 'G#1');
    halfStepsFromA4.set(-36, 'A1');
    halfStepsFromA4.set(-35, 'A#1');
    halfStepsFromA4.set(-34, 'B1');

    halfStepsFromA4.set(-33, 'C2');
    halfStepsFromA4.set(-32, 'C#2');
    halfStepsFromA4.set(-31, 'D2');
    halfStepsFromA4.set(-30, 'D#2');
    halfStepsFromA4.set(-29, 'E2');
    halfStepsFromA4.set(-28, 'F2');
    halfStepsFromA4.set(-27, 'F#2');
    halfStepsFromA4.set(-26, 'G2');
    halfStepsFromA4.set(-25, 'G#2');
    halfStepsFromA4.set(-24, 'A2');
    halfStepsFromA4.set(-23, 'A#2');
    halfStepsFromA4.set(-22, 'B2');

    halfStepsFromA4.set(-21, 'C3');
    halfStepsFromA4.set(-20, 'C#3');
    halfStepsFromA4.set(-19, 'D3');
    halfStepsFromA4.set(-18, 'D#3');
    halfStepsFromA4.set(-17, 'E3');
    halfStepsFromA4.set(-16, 'F3');
    halfStepsFromA4.set(-15, 'F#3');
    halfStepsFromA4.set(-14, 'G3');
    halfStepsFromA4.set(-13, 'G#3');
    halfStepsFromA4.set(-12, 'A3');
    halfStepsFromA4.set(-11, 'A#3');
    halfStepsFromA4.set(-10, 'B3');

    halfStepsFromA4.set(-9, 'C4');
    halfStepsFromA4.set(-8, 'C#4');
    halfStepsFromA4.set(-7, 'D4');
    halfStepsFromA4.set(-6, 'D#4');
    halfStepsFromA4.set(-5, 'E4');
    halfStepsFromA4.set(-4, 'F4');
    halfStepsFromA4.set(-3, 'F#4');
    halfStepsFromA4.set(-2, 'G4');
    halfStepsFromA4.set(-1, 'G#4');
    halfStepsFromA4.set(0, 'A4');
    halfStepsFromA4.set(1, 'A#4');
    halfStepsFromA4.set(2, 'B4');

    halfStepsFromA4.set(3, 'C5');
    halfStepsFromA4.set(4, 'C#5');
    halfStepsFromA4.set(5, 'D5');
    halfStepsFromA4.set(6, 'D#5');
    halfStepsFromA4.set(7, 'E5');
    halfStepsFromA4.set(8, 'F5');
    halfStepsFromA4.set(9, 'F#5');
    halfStepsFromA4.set(10, 'G5');
    halfStepsFromA4.set(11, 'G#5');
    halfStepsFromA4.set(12, 'A5');
    halfStepsFromA4.set(13, 'A#5');
    halfStepsFromA4.set(14, 'B5');

    halfStepsFromA4.set(15, 'C6');
    halfStepsFromA4.set(16, 'C#6');
    halfStepsFromA4.set(17, 'D6');
    halfStepsFromA4.set(18, 'D#6');
    halfStepsFromA4.set(19, 'E6');
    halfStepsFromA4.set(20, 'F6');
    halfStepsFromA4.set(21, 'F#6');
    halfStepsFromA4.set(22, 'G6');
    halfStepsFromA4.set(23, 'G#6');
    halfStepsFromA4.set(24, 'A6');
    halfStepsFromA4.set(25, 'A#6');
    halfStepsFromA4.set(26, 'B6');

    halfStepsFromA4.set(27, 'C7');
    halfStepsFromA4.set(28, 'C#7');
    halfStepsFromA4.set(29, 'D7');
    halfStepsFromA4.set(30, 'D#7');
    halfStepsFromA4.set(31, 'E7');
    halfStepsFromA4.set(32, 'F7');
    halfStepsFromA4.set(33, 'F#7');
    halfStepsFromA4.set(34, 'G7');
    halfStepsFromA4.set(35, 'G#7');
    halfStepsFromA4.set(36, 'A7');
    halfStepsFromA4.set(37, 'A#7');
    halfStepsFromA4.set(38, 'B7');

    halfStepsFromA4.forEach((value, key) => {
        inverseHalfStepsFromA4.set(value,key);
    })

    targetNoteFindFromA4.set('C0', -33);
    targetNoteFindFromA4.set('C#0', -33);
    targetNoteFindFromA4.set('D0', -32);
    targetNoteFindFromA4.set('D#0', -32);
    targetNoteFindFromA4.set('E0', -31);
    targetNoteFindFromA4.set('F0', -30);
    targetNoteFindFromA4.set('F#0', -30);
    targetNoteFindFromA4.set('G0', -29);
    targetNoteFindFromA4.set('G#0', -29);
    targetNoteFindFromA4.set('A0', -28);
    targetNoteFindFromA4.set('A#0', -28);
    targetNoteFindFromA4.set('B0', -27);

    targetNoteFindFromA4.set('C1', -26);
    targetNoteFindFromA4.set('C#1', -26);
    targetNoteFindFromA4.set('D1', -25);
    targetNoteFindFromA4.set('D#1', -25);
    targetNoteFindFromA4.set('E1', -24);
    targetNoteFindFromA4.set('F1', -23);
    targetNoteFindFromA4.set('F#1', -23);
    targetNoteFindFromA4.set('G1', -22);
    targetNoteFindFromA4.set('G#1', -22);
    targetNoteFindFromA4.set('A1', -21);
    targetNoteFindFromA4.set('A#1', -21);
    targetNoteFindFromA4.set('B1', -20);

    targetNoteFindFromA4.set('C2', -19);
    targetNoteFindFromA4.set('C#2', -19);
    targetNoteFindFromA4.set('D2', -18);
    targetNoteFindFromA4.set('D#2', -18);
    targetNoteFindFromA4.set('E2', -17);
    targetNoteFindFromA4.set('F2', -16);
    targetNoteFindFromA4.set('F#2', -16);
    targetNoteFindFromA4.set('G2', -15);
    targetNoteFindFromA4.set('G#2', -15);
    targetNoteFindFromA4.set('A2', -14);
    targetNoteFindFromA4.set('A#2', -14);
    targetNoteFindFromA4.set('B2', -13);

    targetNoteFindFromA4.set('C3', -12);
    targetNoteFindFromA4.set('C#3', -12);
    targetNoteFindFromA4.set('D3', -11);
    targetNoteFindFromA4.set('D#3', -11);
    targetNoteFindFromA4.set('E3', -10);
    targetNoteFindFromA4.set('F3', -9);
    targetNoteFindFromA4.set('F#3', -9);
    targetNoteFindFromA4.set('G3', -8);
    targetNoteFindFromA4.set('G#3', -8);
    targetNoteFindFromA4.set('A3', -7);
    targetNoteFindFromA4.set('A#3', -7);
    targetNoteFindFromA4.set('B3', -6);

    targetNoteFindFromA4.set('C4', -5);
    targetNoteFindFromA4.set('C#4', -5);
    targetNoteFindFromA4.set('D4', -4);
    targetNoteFindFromA4.set('D#4', -4);
    targetNoteFindFromA4.set('E4', -3);
    targetNoteFindFromA4.set('F4', -2);
    targetNoteFindFromA4.set('F#4', -2);
    targetNoteFindFromA4.set('G4', -1);
    targetNoteFindFromA4.set('G#4', -1);
    targetNoteFindFromA4.set('A4', 0);
    targetNoteFindFromA4.set('A#4', 0);
    targetNoteFindFromA4.set('B4', 1);

    targetNoteFindFromA4.set('C5', 2);
    targetNoteFindFromA4.set('C#5', 2);
    targetNoteFindFromA4.set('D5', 3);
    targetNoteFindFromA4.set('D#5', 3);
    targetNoteFindFromA4.set('E5', 4);
    targetNoteFindFromA4.set('F5', 5);
    targetNoteFindFromA4.set('F#5', 5);
    targetNoteFindFromA4.set('G5', 6);
    targetNoteFindFromA4.set('G#5', 6);
    targetNoteFindFromA4.set('A5', 7);
    targetNoteFindFromA4.set('A#5', 7);
    targetNoteFindFromA4.set('B5', 8);

    targetNoteFindFromA4.set('C6', 9);
    targetNoteFindFromA4.set('C#6', 9);
    targetNoteFindFromA4.set('D6', 10);
    targetNoteFindFromA4.set('D#6', 10);
    targetNoteFindFromA4.set('E6', 11);
    targetNoteFindFromA4.set('F6', 12);
    targetNoteFindFromA4.set('F#6', 12);
    targetNoteFindFromA4.set('G6', 13);
    targetNoteFindFromA4.set('G#6', 13);
    targetNoteFindFromA4.set('A6', 14);
    targetNoteFindFromA4.set('A#6', 14);
    targetNoteFindFromA4.set('B6', 15);

    targetNoteFindFromA4.set('C7', 16);
    targetNoteFindFromA4.set('C#7', 16);
    targetNoteFindFromA4.set('D7', 17);
    targetNoteFindFromA4.set('D#7', 17);
    targetNoteFindFromA4.set('E7', 18);
    targetNoteFindFromA4.set('F7', 19);
    targetNoteFindFromA4.set('F#7', 19);
    targetNoteFindFromA4.set('G7', 20);
    targetNoteFindFromA4.set('G#7', 20);
    targetNoteFindFromA4.set('A7', 21);
    targetNoteFindFromA4.set('A#7', 22);
    targetNoteFindFromA4.set('B7', 23);
}


function findRelativeNote(freq){
    let halfSteps = Math.log(freq/440)/Math.log(Math.pow(2,1/12));
    let note = "A4";

    note = halfStepsFromA4.get(Math.round(halfSteps));

    return note;
}

var currentNotePosition = 200;

function calculateNotePosition(frequency, gapSize){
    let n = (12*Math.log(frequency/440))/(Math.log(2));
    let spacing = gapSize/((8/7)*3);

    //1.12246204831
    //2.5*gapSize just offsets zero being the top of the staff to the space where A4 sits in the staff
    return (2.5*gapSize)+  spacing*-n;
}
function calculateDistanceToNote(frequency){
    let n = (12*Math.log(frequency/440))/(Math.log(2));

    let decimal = Math.abs(n-Math.round(n));

    return decimal;
}
function calculateDistanceToSpecificNote(frequency, targetSemitone){
    let n = (12*Math.log(frequency/440))/(Math.log(2));

    let decimal = Math.abs(n-targetSemitone);

    return decimal;
}


// 𝅗𝅘𝅥𝅘𝅥𝅯𝅘𝅥𝅱  𝄾𝄿𝅁


function drawNote(note, type){
    var prevStyle = ctx.fillStyle;
    var prevFont = ctx.font;
    ctx.fillStyle = "rgb(0, 0, 0)";
    ctx.font = 'bold '+2.5*gap+'px serif';

    //Middle of each gap is every 0.5*gap, starting from 0.25*gap
    var a4Position = 0.25 + 5*0.5;
    var yPosition = (note*0.5 + a4Position)*gap;

    ctx.fillText("𝅘𝅥", 8*gap, offsetFromTop+yPosition);

    ctx.fillStyle = prevStyle;
    ctx.font = prevFont;
}

var targetNote = inverseHalfStepsFromA4.get("C4");

const activeNotePosition = canvasWidth - canvasWidth/8;

class NoteQueue {
    constructor() {
        this.notes = {};
        this.head = 0;
        this.tail = 0;
    }
    queue(color_, freq_){
        this.notes[this.tail] = {color: color_, freq: freq_};
        this.tail++;
    }
    preview(i){
        return this.notes[i]
    }
    deleteFirst(){
        delete this.notes[this.head];
        this.head++;
    }
    getLength(){
        return this.tail-this.head;
    }
}

const maxNotes = 1;
var pastNotes = new NoteQueue();

function drawPastNotes(){
    for (var i = 0; i < pastNotes.getLength(); i++){
        //console.log(pastNotes.preview(i).color);
    }
    if(pastNotes.getLength() > maxNotes) pastNotes.deleteFirst();
}


function draw(){
    drawVisual = requestAnimationFrame(draw);

    targetNote = -targetNoteFindFromA4.get(targetNoteElement.value);

    if(running){
        findNote();
        currentNotePosition = calculateNotePosition(heldNote, gap);

        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        ctx.fillStyle = "rgb(255, 255, 255)";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.fillStyle = "rgb(0, 0, 0)";

        ctx.drawImage(trebleClefImg, 0, offsetFromTop-1*gap, 3*gap, 6*gap);
        ctx.drawImage(bassClefImg, 10, offsetFromTop + 6*gap, 7/3*gap, 3*gap);
        ctx.beginPath();

        drawNote(targetNote, 0);


        ctx.arc(activeNotePosition, offsetFromTop+currentNotePosition, gap/4, 0, 2*Math.PI, 0); //gap*5

        //Draw Time Signature on Staff
        ctx.fillText(topTimeSignature.value, 3.2*gap, offsetFromTop+2*gap);
        ctx.fillText(btmTimeSignature.value, 3.2*gap, offsetFromTop+4*gap);

        ctx.fillText(topTimeSignature.value, 3.2*gap, offsetFromTop+8*gap);
        ctx.fillText(btmTimeSignature.value, 3.2*gap, offsetFromTop+10*gap);


        if(targetNoteElement.value == ""){
            let noteDistance = calculateDistanceToNote(heldNote);
            ctx.fillStyle = "rgb("+noteDistance*255*2+", " +Math.abs(1-noteDistance)*255+ ", 0)";
        }else{
            let accuracy = 6; // 1 being not so accuarte, the closer towards +infinity, the more exact you must be for it to turn green
            let noteDistance = 1/(accuracy*calculateDistanceToSpecificNote(heldNote, inverseHalfStepsFromA4.get(targetNoteElement.value)));
            if(noteDistance > 1){
                noteDistance = 1;
            }
            ctx.fillStyle = "rgb("+128/noteDistance + ", "+noteDistance*255+" , 0)";
        }
        //pastNotes.queue(ctx.fillStyle, currentNotePosition);
        //drawPastNotes();
        ctx.fill();
        ctx.fillStyle = "rgb(0, 0, 0)";
        //Calculate currentNotePosition from frequency and place it on the musical staff

        //Draw Staff
        ctx.stroke(staff);
    }
}


ctx.lineWidth = 2;
ctx.strokeStyle = "rgb(0, 0, 0)";
ctx.fillStyle = "rgb(255, 255, 255)";
ctx.font = 'bold '+2.5*gap+'px serif';

generateSemitoneMap();
createStaff(gap, offsetFromTop);
draw();
