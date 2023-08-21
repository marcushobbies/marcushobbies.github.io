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

function getLocalStream() {
  navigator.mediaDevices.getUserMedia({ video: false, audio: true }).then((stream) => {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      analyser.minDecibels = -100;
      analyser.maxDecibels = -10;
      analyser.smoothingTimeConstant = 0.85;

      source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      running = true;
    })
    .catch((err) => {
      console.error(`you got an error: ${err}`);
    });
}

var noteThreshold = 0.1; //How accurate should it be updating? Default is it will only update for a 0.1Hz difference or more
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
        return;
    }
    pitchElement.innerHTML = value.toPrecision(5) + "Hz";
    heldNote = value;


}

var staff = new Path2D();
const trebleClefImg = document.getElementById("trebleClef");
const bassClefImg = document.getElementById("bassClef");

var offsetFromTop = 50;
var gap = 25;

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


function draw(){
    drawVisual = requestAnimationFrame(draw);

    if(running){
        findNote();
        currentNotePosition = calculateNotePosition(heldNote, gap);

        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        ctx.fillStyle = "rgb(255, 255, 255)";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.fillStyle = "rgb(0, 0, 0)";

        ctx.drawImage(trebleClefImg, 0, 30, 3*gap, 6*gap);
        ctx.drawImage(bassClefImg, 10, 50 + 6*gap, 7/3*gap, 3*gap);
        ctx.beginPath();


        let noteDistance = calculateDistanceToNote(heldNote);

        ctx.arc(160, offsetFromTop+currentNotePosition, gap/4, 0, 2*Math.PI, 0);

        ctx.fillStyle = "rgb("+noteDistance*255*2+", " +Math.abs(1-noteDistance)*255+ ", 0)";
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
ctx.font = '24px serif';
createStaff(gap, offsetFromTop);

draw();
