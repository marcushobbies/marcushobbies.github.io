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


    let dataArray = new Float32Array(analyserNode.frequencyBinCount);
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
    analyserNode.fftSize = 16384*2;
    analyserNode.minDecibels = -100;
    analyserNode.maxDecibels = -30;
    analyserNode.smoothingTimeConstant = 0;


    analyserNode.getFloatFrequencyData(dataArray);
    //console.log(freqDataArray);

}

const WIDTH = 900;
const HEIGHT = 300;

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
//freqCtx.fillStyle = "rgb(200, 200, 200)";
function draw() {
  drawVisual = requestAnimationFrame(draw);
  analyserNode.getFloatTimeDomainData(dataArray);
  analyserNode.getFloatFrequencyData(freqArray);
  freqCtx.fillRect(0, 0, 1024, HEIGHT*2);



  freqCtx.beginPath();

  //canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
  //canvasCtx.beginPath();


  //TODO: get average of top (10?) intensity levels and then average them using their weights
  let maxVol = Math.max(...freqArray);
  let freqIndex = freqArray.indexOf(maxVol);
  let waveform = new Path2D();

    let prevLoc = HEIGHT/2;
    for(let i = viewableFrequencyMin; i < analyserNode.frequencyBinCount; i++){
        if(i >= viewableFrequencyMax || i <= viewableFrequencyMin){
            continue;
        }

        let h = Math.pow((freqArray[i] + 130)/20, smoothingPower)/(Math.pow((maxVol + 130)/20, smoothingPower)) * HEIGHT;
        waveform.moveTo(i-1, prevLoc);
        let cLoc = (HEIGHT/2) + Math.floor(200*(dataArray[i]));
        waveform.lineTo(i, cLoc);
        freqCtx.moveTo(i, HEIGHT*2);
        freqCtx.lineTo(i, HEIGHT*2-h);
        prevLoc = cLoc;
    }
    freqCtx.stroke(waveform);
    freqCtx.stroke();


  tmpReadout.innerHTML = mapFrequency(freqIndex)+"Hz";

}

function drawWaveform() {

}

function mapFrequency(index){
    return (index)/(analyserNode.frequencyBinCount) * ((sampleRate)/2);
}

draw();
