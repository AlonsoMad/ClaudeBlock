'use strict';
// ================= audio (all synthesized) =================
let ac=null,master,sfxG,musG,noiseBuf,muted=!!store.muted;
function audioInit(){
  if(ac){if(ac.state==='suspended')ac.resume();return}
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
  ac=new AC();master=ac.createGain();sfxG=ac.createGain();musG=ac.createGain();musG.gain.value=.8;
  sfxG.connect(master);musG.connect(master);master.connect(ac.destination);master.gain.value=muted?0:.5;
  noiseBuf=ac.createBuffer(1,ac.sampleRate*.5,ac.sampleRate);
  const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
}
function toggleMute(){muted=!muted;store.muted=muted;save();if(master)master.gain.value=muted?0:.5}
const busOn=b=>ac&&!muted&&(b===musG?store.opt.music:store.opt.sfx);
function tone(f,dur,type='square',vol=.06,slide=1,when=0,bus=sfxG){
  if(!busOn(bus))return;const t=ac.currentTime+when,o=ac.createOscillator(),g=ac.createGain();
  o.type=type;o.frequency.setValueAtTime(f,t);if(slide!==1)o.frequency.exponentialRampToValueAtTime(f*slide,t+dur);
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(g).connect(bus);o.start(t);o.stop(t+dur+.02);
}
function noise(dur,vol=.2,freq=1200,when=0,type='lowpass',bus=sfxG){
  if(!busOn(bus))return;const t=ac.currentTime+when,s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();
  s.buffer=noiseBuf;f.type=type;f.frequency.setValueAtTime(freq,t);if(type==='lowpass')f.frequency.exponentialRampToValueAtTime(80,t+dur);
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  s.connect(f).connect(g).connect(bus);s.start(t);s.stop(t+dur);
}
const PENTA=[0,3,5,7,10];
const note=i=>220*Math.pow(2,(PENTA[i%5]+12*Math.floor(i/5))/12);
const sfx={
  brick:c=>{const f=note(Math.min(c,19));tone(f,.12,'square',.045);tone(f*2,.08,'sine',.03)},
  hit:()=>tone(200,.05,'triangle',.08),
  steel:()=>tone(1100,.07,'square',.025,.5),
  paddle:()=>tone(140,.08,'triangle',.12,1.6),
  perfect:()=>{tone(880,.15,'sine',.08,1.5);tone(1320,.2,'sine',.05,1.5,.05)},
  wall:()=>tone(320,.03,'sine',.035),
  power:()=>[0,4,7,12].forEach((s,i)=>tone(440*2**(s/12),.1,'square',.035,1,i*.05)),
  bad:()=>tone(300,.3,'sawtooth',.05,.4),
  laser:()=>tone(1500,.07,'sawtooth',.018,.3),
  boom:()=>{noise(.4,.3,2200);tone(90,.3,'sine',.2,.4)},
  lose:()=>{tone(440,.7,'sawtooth',.06,.25);noise(.5,.15,900)},
  clear:()=>[0,3,7,12,15,19,24].forEach((s,i)=>tone(330*2**(s/12),.18,'square',.04,1,i*.07)),
  od:()=>{tone(110,.8,'sawtooth',.08,4);noise(.6,.15,5000)},
  life:()=>[0,7,12,19].forEach((s,i)=>tone(523*2**(s/12),.15,'triangle',.08,1,i*.08)),
  alarm:()=>{for(let i=0;i<3;i++){tone(660,.18,'square',.04,1,i*.36);tone(440,.18,'square',.04,1,i*.36+.18)}},
  bossHit:()=>{tone(90,.12,'square',.08,.5);noise(.08,.1,1500)},
  bossDie:()=>{noise(1.2,.35,3000);tone(220,1.2,'sawtooth',.08,.1);[0,4,7,12,16,19,24].forEach((s,i)=>tone(262*2**(s/12),.2,'triangle',.06,1,.6+i*.08))},
  zap:()=>tone(900,.2,'sawtooth',.05,.2),
  goal:()=>[0,7,12].forEach((s,i)=>tone(392*2**(s/12),.12,'square',.05,1,i*.06)),
  menu:()=>tone(520,.04,'square',.03),
  select:()=>{tone(660,.06,'square',.04);tone(990,.08,'square',.03,1,.05)},
};
// tiny lookahead sequencer; darker & faster during boss fights
const PROG=[[57,60,64],[53,57,60],[48,52,55],[55,59,62]],PROGB=[[52,55,59],[53,57,60],[50,53,57],[52,56,59]],mtof=m=>440*2**((m-69)/12);
let mNext=0,mStep=0;
setInterval(()=>{
  if(!busOn(musG)||state!=='play')return;
  const boss=game&&game.boss,spb=60/(boss?138:112)/4;if(mNext<ac.currentTime)mNext=ac.currentTime+.05;
  while(mNext<ac.currentTime+.12){
    const s=mStep%16,ch=(boss?PROGB:PROG)[Math.floor(mStep/16)%4],w=mNext-ac.currentTime;
    if(s%4===0)tone(mtof(ch[0]-24),.22,'triangle',.09,1,w,musG);
    if(s%4===2)tone(mtof(ch[0]-12),.1,'triangle',.045,1,w,musG);
    if(s%2===0)tone(mtof(ch[(s/2)%3]+12),.08,'square',.011,1,w,musG);
    if((game.odT>0||boss)&&s%2===1)noise(.03,.05,7000,w,'highpass',musG);
    mNext+=spb;mStep++;
  }
},30);
