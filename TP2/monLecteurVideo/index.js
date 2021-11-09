
import './lib/webaudio-controls.js';

const getBaseURL = () => {
    return new URL('.', import.meta.url);
};

let ctx = window.AudioContext || window.webkitAudioContext;
let audioContext, FreqContext;
let player, pannerSlider, pannerNode;
let sourceNode, filters;


let vol1 = 0.5;
let style = `
#player {
    width: 50%;
    display: block;
    margin: 0 auto;

}
#play{
    margin-left : 30%
}
`;


let template = /*html*/`
  <video id="player" crossorigin="anonymous">
      <br>
  </video>
  <br>
    <div>
        <button id="play" title="ESPACE">PLAY</button>
        <button id="info" title="I">INFO</button>
        <button id="recule10" title="Feche de gauche">-10s</button>
        <button id="avance10" title="Feche de droite">+10s</button>
        <button id="recommence"><<</button>
        <button id="vitesse4" >Vitesse x4</button>
        <button id="mute" >MUTE</button>
        <webaudio-knob id="volume" min=0 max=1 value=0.5 step="0.01" 
            tooltip="%s" diameter="40" src="./assets/btndl.svg" sprites="100"></webaudio-knob>
    </div>
    <br>
    <div>
        <h4>Marre de la souris utilise le clavier </h4>
        Espace  = Play/Pause <br>
        M = Mute <br>
        Droite/Gauche = Avancer/Reculer<br>
        I = Info
        R = Début
    </div>
    <br>
    <div class="infoControls">
        <p id="infotxt"></p>
        <label for="pannerSlider">Balance</label>
        <input type="range" min="-1" max="1" step="0.1" value="0" id="pannerSlider" />
        <br>
        <label>60Hz</label>
        <input type="range" value="0" step="1" min="-30" max="30" id="frequence0"></input>
        <br>
        <label>170Hz</label>
        <input type="range" value="0" step="1" min="-30" max="30" id="frequence1"></input>
        <br>
        <label>350Hz</label>
        <input type="range" value="0" step="1" min="-30" max="30" id="frequence2"></input>
        <br>
        <label>1000Hz</label>
        <input type="range" value="0" step="1" min="-30" max="30" id="frequence3"></input>
    </div>
   `;

class MyVideoPlayer extends HTMLElement {
    constructor() {
        super();


        console.log("BaseURL = " + getBaseURL());

        this.attachShadow({ mode: "open" });
    }

    fixRelativeURLs() {
        let knobs = this.shadowRoot.querySelectorAll('webaudio-knob, webaudio-switch, webaudio-slider');
        knobs.forEach((e) => {
            let path = e.getAttribute('src');
            e.src = getBaseURL() + '/' + path;
        });
    }
    connectedCallback() {
        this.shadowRoot.innerHTML = `<style>${style}</style>${template}`;

        this.fixRelativeURLs();

        this.player = this.shadowRoot.querySelector("#player");
        this.player.src = this.getAttribute("src");
        this.definitEcouteurs();


        audioContext = new ctx();
        sourceNode = audioContext.createMediaElementSource(this.player);


        player = this.shadowRoot.querySelector('#player');
        player.onplay = (e) => { audioContext.resume(); }

        this.buildAudioGraphPanner();

        pannerSlider = this.shadowRoot.querySelector('#pannerSlider');
        pannerSlider.oninput = function (evt) {
            console.log(evt.target.value);
            pannerNode.pan.value = evt.target.value;
        };
        /* BALANCE */


        /* FREQUENCE */

        filters = [];
        [60, 170, 350, 1000].forEach(function (freq, i) {
            var eq = audioContext.createBiquadFilter();
            eq.frequency.value = freq;
            eq.type = "peaking";
            eq.gain.value = 0;
            filters.push(eq);
        });

        this.buildFrequence();

    }

    definitEcouteurs() {
        console.log("ecouteurs définis")
        let play = this.shadowRoot.querySelector("#play");
        let PP = 1;
        let mute = this.shadowRoot.querySelector("#mute");
        let vitesseF4 = this.shadowRoot.querySelector("#vitesse4");
        let v = 1;
        let vitesseF = 1;
        window.onkeyup = (e) => {
            if (e.keyCode == 32) {
                if (PP == 1) {
                    play.innerHTML = "PAUSE";
                    PP = 0;
                    this.play();
                }
                else {
                    play.innerHTML = "PLAY";
                    PP = 1;
                    this.pause();
                }
            }
            if (e.keyCode == 77) {
                if (v == 1) {
                    mute.innerHTML = "MUTE";
                    v = 0;
                    this.mute();
                }
                else {
                    mute.innerHTML = "UNMUTE";
                    v = 1;
                    this.unmute();
                }
            }
            if (e.keyCode == 39) {
                this.avance10();
            }
            if (e.keyCode == 37) {
                this.recule10();
            }
            if (e.keyCode == 38) {
                this.sonplus();
            }
            if (e.keyCode == 40) {
                this.sonmoins();
            }
            if (e.keyCode == 73) {
                this.getInfo();
            }
            if (e.keyCode == 82) {
                this.recommence();
            }
        }

        this.shadowRoot.querySelector("#play").onclick = () => {
            console.log(PP)
            if (PP == 1) {
                play.innerHTML = "PAUSE";
                PP = 0;
                this.play();
            }
            else {
                play.innerHTML = "PLAY";
                PP = 1;
                this.pause();
            }

        }

        this.shadowRoot.querySelector("#volume").oninput = (event) => {
            const vol = parseFloat(event.target.value);
            this.player.volume = vol;
            this.vol1 = vol;
        }
        this.shadowRoot.querySelector("#avance10").onclick = () => {
            this.avance10();
        };
        this.shadowRoot.querySelector("#recule10").onclick = () => {
            this.recule10();
        };
        this.shadowRoot.querySelector("#recommence").onclick = () => {
            this.recommence();
        };
        this.shadowRoot.querySelector("#vitesse4").onclick = () => {
            if (vitesseF == 1) {
                this.vitesse(4);
                vitesseF4.innerHTML = " Vitesse x1"
                vitesseF = 0;
            }
            else {
                this.vitesse(1);
                vitesseF4.innerHTML = " Vitesse x4"
                vitesseF = 1;
            }
        }
        this.shadowRoot.querySelector("#mute").onclick = () => {

            console.log(v)
            if (v == 1) {
                mute.innerHTML = "MUTE";
                v = 0;
                this.mute();
            }
            else {
                mute.innerHTML = "UNMUTE";
                v = 1;
                this.unmute();
            }
        };
        this.shadowRoot.querySelector("#frequence0").oninput = (event) => {
            this.changeGain(event.target.value, 0);
        };

        this.shadowRoot.querySelector("#frequence1").oninput = (event) => {
            this.changeGain(event.target.value, 1);
        };

        this.shadowRoot.querySelector("#frequence2").oninput = (event) => {
            this.changeGain(event.target.value, 2);
        };

        this.shadowRoot.querySelector("#frequence3").oninput = (event) => {
            this.changeGain(event.target.value, 3);
        };

        this.shadowRoot.querySelector("#info").onclick = () => {
            this.getInfo();
        };

    }

    play() {
        this.player.play();
    }
    pause() {
        this.player.pause();
    }

    avance10() {
        this.player.currentTime += 10;
    }

    recule10() {
        this.player.currentTime -= 10;
    }

    recommence() {
        this.player.currentTime = 0;
    }
    mute() {
        this.player.volume = 0;
    }
    unmute() {
        this.player.volume = vol1;
    }
    sonplus() {
        this.player.volume += 0.05;
        console.log(this.player.volume)
    }
    sonmoins() {
        this.player.volume -= 0.05;
        console.log(this.player.volume)
    }

    vitesse(speed) {
        this.player.playbackRate = speed;
    }

    getInfo() {
        let texte = this.shadowRoot.querySelector("#infotxt");
        texte.innerHTML = "";
        texte.innerHTML = "Durée de la vidéo : " + this.player.duration + "<br>Temps courant : " + this.player.currentTime + "<br>Vitesse de lecture : " + this.player.playbackRate;
    }


    buildAudioGraphPanner() {
        pannerNode = audioContext.createStereoPanner();

        sourceNode.connect(pannerNode);
        pannerNode.connect(audioContext.destination);
    }

    buildFrequence() {
        sourceNode.connect(filters[0]);
        for (var i = 0; i < filters.length - 1; i++) {
            filters[i].connect(filters[i + 1]);
        }
        filters[filters.length - 1].connect(audioContext.destination);

    }

    changeGain(sliderVal, nbFilter) {
        var value = parseFloat(sliderVal);
        filters[nbFilter].gain.value = value;
    }

}

customElements.define("my-player", MyVideoPlayer);
