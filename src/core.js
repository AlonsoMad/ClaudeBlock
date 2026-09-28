'use strict';
// ================= constants & helpers =================
const W=960,H=720,TOP=64,COLS=14,BW=64,BH=24,BX=(W-COLS*BW)/2,BY=110,R=8,PSPD=900,STEP=1/120,DANGER=622,CAMPAIGN_LEN=10,RUN_LEN=25;
const MONO='ui-monospace,SFMono-Regular,Menlo,Consolas,monospace';
const SERIF='"Tiempos Headline","Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif';
const SANS='"Styrene B",-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif';
const cv=document.getElementById('c'),ctx=cv.getContext('2d');
const rand=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>v<a?a:v>b?b:v;
const mk=(w,h)=>Object.assign(document.createElement('canvas'),{width:w,height:h});
const fmt=n=>Math.round(n).toLocaleString('en-US');
function rng(s){return()=>{s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const th={};
function once(k,ms){const n=performance.now();if(th[k]>n-ms)return false;th[k]=n;return true}
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const hashStr=s=>{let h=2166136261;for(const ch of s)h=Math.imul(h^ch.charCodeAt(0),16777619);return h>>>0};

// ================= storage =================
const SKEY='neonbreaker.v1';
let store;try{store=JSON.parse(localStorage.getItem(SKEY))||{}}catch(e){store={}}
if(!store.hs)store.hs={campaign:Array.isArray(store.scores)?store.scores:[],endless:[],daily:[]};
delete store.scores;
store.opt=Object.assign({music:true,sfx:true,shake:true},store.opt);
store.stats=Object.assign({games:0,time:0,bricks:0,perfects:0,bosses:0,bestChain:0},store.stats);
store.codex=store.codex||{};store.codex.items=store.codex.items||{};store.name=store.name||'';store.theme=store.theme||'claude';
// meta-progression for Run mode + Casino; additive merge, same as opt/stats — no migrations
store.meta=Object.assign({
  chips:0,
  unlocked:[],            // item ids whose unlock condition has fired — gates pool/directBuy eligibility
  unlockedCapsules:['E','M','L','C','F','S','B','U','H'],
  relicsOwned:[],relicsEquipped:[],relicSlots:3,
  runsPlayed:0,bestRound:0,wins:0,totalScore:0,
  endingsSeen:{},
}, store.meta);
store.meta.casino=Object.assign({spins:0,blackjackHands:0,blackjackWins:0,blackjackNet:0},store.meta.casino);
const save=()=>{try{localStorage.setItem(SKEY,JSON.stringify(store))}catch(e){}};
const MODES=['campaign','endless','daily'];
const table=m=>m==='daily'?store.hs.daily.filter(e=>e.date===today()):store.hs[m];
const best=m=>(table(m)[0]||{score:0}).score;
const qualifies=(m,s)=>{const t=table(m);return s>0&&(t.length<10||s>t[9].score)};
function addEntry(m,e){const t=table(m).concat(e).sort((a,b)=>b.score-a.score).slice(0,10);store.hs[m]=t;save();return t.indexOf(e)}

// ================= game state =================
let state='menu',game=null,K=1,dirty=true,bgL,brL,ovL,sprBall,sprFire,overT=0,entryName='',lastRank=-1;
let parts=[],menuIdx=0,themeIdx=0,optIdx=0,recTab=0,afterGame=false,lastMode='campaign';
