'use strict';
// ================= power-ups =================
// base 9 drop everywhere; entries with x:{} are Run-only unlocks bought at the Casino (see CAP_ITEMS)
const CAPS={
  E:{n:'EXPAND',l:'E',k:'a1',w:14,d:15,info:'Wider paddle'},
  M:{n:'MULTI',l:'M',k:'a2',w:14,d:0,info:'Every ball splits in three'},
  L:{n:'LASER',l:'L',k:'bad',w:10,d:12,info:'Hold SPACE to shoot'},
  C:{n:'CATCH',l:'C',k:'good',w:9,d:15,info:'Ball sticks, aim & release'},
  F:{n:'FIRE',l:'F',k:'hot',w:6,d:8,info:'Balls pierce bricks'},
  S:{n:'SLOW',l:'S',k:'cool',w:10,d:10,info:'Slower balls'},
  B:{n:'SHIELD',l:'B',k:'gold',w:9,d:0,info:'Floor saves one ball'},
  U:{n:'1UP',l:'+',k:'text',w:3,d:0,info:'Extra life'},
  H:{n:'SHRINK',l:'-',k:'label',w:8,d:12,info:'Smaller paddle. Dodge it!'},
  T:{n:'TIME',l:'T',k:'cool',w:6,d:8,info:'Wall descends at half speed',x:{tier:1,pool:['roulette']}},
  V:{n:'VOID',l:'V',k:'a2',w:5,d:0,info:'Erases every boss shot on screen',x:{tier:1,pool:['roulette']}},
  K:{n:'KEY',l:'K',k:'a1',w:5,d:0,info:'Next ? brick drops a good capsule',x:{tier:1,pool:['roulette','blackjack']}},
  O:{n:'COIN',l:'$',k:'gold',w:4,d:0,info:'+10 Chips, banked when the run ends',x:{tier:1,pool:['roulette']}},
  G:{n:'GHOST',l:'G',k:'sub',w:5,d:6,info:'Balls pass through steel',x:{tier:2,pool:['roulette'],unlock:runsPlayed(6)}},
  D:{n:'DOUBLE',l:'D',k:'good',w:5,d:0,info:'Next capsule drops as a pair',x:{tier:2,pool:['roulette','blackjack'],unlock:comboStreak(30)}},
  A:{n:'ANCHOR',l:'A',k:'gold',w:5,d:12,info:'Immune to Shrink & stun',x:{tier:2,pool:['roulette','blackjack'],unlock:beatBossCount(2,{cumulative:true})}},
  N:{n:'NUKE',l:'N',k:'bad',w:3,d:0,info:'Clears the bottom two rows',x:{tier:2,pool:['blackjack'],unlock:reachRound(10)}},
  I:{n:'ICE',l:'I',k:'cool',w:3,d:3,info:'Freezes the wall solid',x:{tier:3,pool:['blackjack'],unlock:reachRound(18),hint:'Cold hands, warm heart. Go deeper.'}},
};
const BASE_CAPS=Object.keys(CAPS).filter(k=>!CAPS[k].x);
const CAP_ITEMS=Object.keys(CAPS).filter(k=>CAPS[k].x).map(k=>({id:'cap_'+k,kind:'capsule',cap:k,name:CAPS[k].n+' CAPSULE',info:CAPS[k].info,...CAPS[k].x}));
// Run mode draws from the capsules you've unlocked; Campaign/Daily keep the base 9
function capWeights(){const w={},pool=game.mode==='endless'?store.meta.unlockedCapsules:BASE_CAPS;for(const k in CAPS)if(pool.includes(k))w[k]=CAPS[k].w;return w}
function rollCap(){const w=filter('capsuleWeight',capWeights());let t=Math.random()*Object.values(w).reduce((a,b)=>a+b,0);for(const k in w){t-=w[k];if(t<0)return k}return'E'}
// one-deep lookahead so Marked Deck can reveal what's coming
function pickCap(){const g=game,t=g.nextCap||rollCap();g.nextCap=rollCap();return filter('nextCapsuleId',t)}
