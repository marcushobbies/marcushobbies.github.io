window.AudioContext = window.AudioContext || window.webkitAudioContext;


var tmpReadout = document.getElementById('frequency');
var audioDeviceReadout = document.getElementById('audioDevice');
var debugReadout = document.getElementById('debugData');

var freqCanvas = document.getElementById('freqCanvas');
var freqCtx = freqCanvas.getContext("2d", { alpha: false });

const audioCtx = new AudioContext();
const gainNode = audioCtx.createGain();
const analyserNode = audioCtx.createAnalyser();

tmpReadout.innerHTML = "- Hz";

//Bibliography
//https://developer.mozilla.org/en-US/docs/Web/API/MediaStream
//https://developer.mozilla.org/en-US/docs/Web/API/AudioContext
//https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext     Pretty Important
//https://pages.mtu.edu/~suits/NoteFreqCalcs.html

var smoothingPower = 5;
let source;

navigator.mediaDevices.getUserMedia({audio: true})
    .then((stream) => {
        console.log(stream.getAudioTracks());
        readAudio(stream);
    })

    .catch((err) => {
        console.error(err);
    });


    let dataArray = new Float32Array(analyserNode.fftSize);
    let freqArray = new Float32Array(analyserNode.frequencyBinCount);
    let sampleRate = 0;
function readAudio(stream){
    audioCtx.resume();

    source = audioCtx.createMediaStreamSource(stream);

    gainNode.connect(audioCtx.destination);
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    sampleRate = stream.getAudioTracks()[0].getSettings().sampleRate
    audioDeviceReadout.innerHTML = stream.getAudioTracks()[0].label + " @ " + sampleRate + "Hz";

    source.connect(analyserNode);

    //analyserNode.connect(audioCtx.destination);


    analyserNode.fftSize = 16384*2;
    analyserNode.minDecibels = -100;
    analyserNode.maxDecibels = -30;
    analyserNode.smoothingTimeConstant = 0;


    analyserNode.getFloatFrequencyData(dataArray);
    //console.log(freqDataArray);

}

const WIDTH = 900;
const HEIGHT = 300;

var zoomLevel = 1;

function readPitch(){
    analyserNode.getFloatTimeDomainData(dataArray);
    analyserNode.getFloatFrequencyData(freqArray);

    for(var i = 0; i < analyserNode.frequencyBinCount; i++){
        console.log(i + "Hz @ " + (freqArray[i]) + "dB");
    }

}

let viewableFrequencyMin = 0; //In Hz
let viewableFrequencyMax = 1024; //In Hz

freqCtx.lineWidth = 2;
freqCtx.strokeStyle = "rgb(200, 200, 200)";
freqCtx.fillStyle = "rgb(0, 0, 0)";

function draw() {
  drawVisual = requestAnimationFrame(draw);
  analyserNode.getFloatFrequencyData(freqArray);
  analyserNode.getFloatTimeDomainData(dataArray);

  //freqCtx.fillRect(0, 0, 1024, HEIGHT*2);
  freqCtx.clearRect(0, 0, 1024, HEIGHT*2);

  freqCtx.beginPath();


  //TODO: get average of top (10?) intensity levels and then average them using their weights
  let maxVol = Math.max(...freqArray);
  let freqIndex = freqArray.indexOf(maxVol);
  let waveform = new Path2D();

    let prevLoc = HEIGHT/2;
    for(let i = viewableFrequencyMin; i < analyserNode.fftSize; i++){
        if(i >= viewableFrequencyMax || i <= viewableFrequencyMin){
            continue;
        }

        let h = Math.pow((freqArray[i] + 130)/20, smoothingPower)/(Math.pow((maxVol + 130)/20, smoothingPower)) * HEIGHT;
        waveform.moveTo((i-1)*zoomLevel, prevLoc);
        let cLoc = (HEIGHT/2) + 200*(dataArray[i]);
        waveform.lineTo(i*zoomLevel, cLoc);

        freqCtx.moveTo(i, HEIGHT*2);
        freqCtx.lineTo(i, HEIGHT*2-h);
        prevLoc = cLoc;
    }
    freqCtx.stroke(waveform);
    freqCtx.stroke();

  let pitch = limitDecimals(mapFrequency(freqIndex), 1);
  tmpReadout.innerHTML = pitch+"Hz" + " (" + findNote(pitch) + ")";

}

function limitDecimals(number, decimalPlaces){
    let factor = Math.pow(10, decimalPlaces);
    return Math.floor((number*factor))/factor;
}

// log(2^1/12)(f/440) = n <= n being the # of half steps the note is away from A4 (440Hz)

var halfStepsFromA4 = new Map();
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


function findNote(freq){
    let halfSteps = Math.log(freq/440)/Math.log(Math.pow(2,1/12));
    let note = "A4";

    if(halfSteps > 0){
        note = halfStepsFromA4.get(Math.ceil(halfSteps));
        if(halfSteps % 1 < 0.5){
            note = halfStepsFromA4.get(Math.floor(halfSteps));
        }
    }
    if(halfSteps < 0){
        note = halfStepsFromA4.get(Math.ceil(halfSteps));
        if(halfSteps % 1 < -0.5){
            note = halfStepsFromA4.get(Math.floor(halfSteps));
        }
    }

    return note;
}

function drawWaveform() {

}

function mapFrequency(index){
    return (index)/(analyserNode.frequencyBinCount) * (sampleRate/2.175);
}

draw();
