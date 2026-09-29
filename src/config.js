'use strict';
// ================= run config: every tuning number lives here (RUN_LOOP_SPEC.md) =================
const RUN={
  finalLevel:25,        // FINAL BOSS stage follows this level; Victory ends the run
  bossEvery:5,           // boss stage after every Nth level
  casinoEvery:10,        // casino stage after every Nth level...
  casinoAfterBoss:true,  // ...after that level's boss stage
  startLives:3,maxLives:5,sweepAt:3,rewardPickEvery:1,
  shelfSize:4,rerollBase:20,rerollStep:15,sellRefund:.25,
  levelPayBase:80,levelPayPerLevel:12,parBonus:30,chipBrickPay:20,capsuleCoinPay:10,rewardChipsBase:60,
  bossPayBase:150,mysteryPriceMult:.6,mysteryDudRefund:.5,mysteryHitChance:.7,
};
// the whole stage sequencer: one pure function, easy to assert
function stagesAfter(level){
  const s=[];
  if(level===RUN.finalLevel)return['final'];
  if(level%RUN.bossEvery===0)s.push('boss');
  if(level%RUN.casinoEvery===0){if(RUN.casinoAfterBoss)s.push('casino');else s.unshift('casino')}
  return s;
}
{ // self-check: default config produces exactly 4 boss stages, 2 casino stages, 1 final across levels 1-25
  let bosses=0,casinos=0,finals=0;
  for(let lv=1;lv<=RUN.finalLevel;lv++)for(const s of stagesAfter(lv)){bosses+=s==='boss';casinos+=s==='casino';finals+=s==='final'}
  console.assert(bosses===4&&casinos===2&&finals===1,'stagesAfter schedule',bosses,casinos,finals);
}

// bands scale the economy (prices/payouts/boss HP), not the physics
const BANDS=[
  {from:1, priceMult:1,  payoutMult:1,   bossHpMult:1},
  {from:11,priceMult:1.3,payoutMult:1.15,bossHpMult:1.2},
  {from:21,priceMult:1.6,payoutMult:1.3, bossHpMult:1.4},
  {from:31,priceMult:2,  payoutMult:1.45,bossHpMult:1.6},
];
const band=level=>BANDS.reduce((a,b)=>level>=b.from?b:a);

// difficulty(level): pure function over piecewise-linear anchor tables, all placeholders to tune later
const DIFF_ANCHORS=[
  {lv:1, rowBudget:10,density:.50,maxHp:1,descent:8, steelChance:0,  specialBudget:1,templateTier:1,par:60},
  {lv:10,rowBudget:16,density:.65,maxHp:3,descent:18,steelChance:.04,specialBudget:2,templateTier:2,par:75},
  {lv:20,rowBudget:20,density:.75,maxHp:4,descent:26,steelChance:.08,specialBudget:3,templateTier:3,par:90},
  {lv:30,rowBudget:24,density:.80,maxHp:4,descent:30,steelChance:.10,specialBudget:4,templateTier:3,par:90},
];
function difficulty(level){
  let lo=DIFF_ANCHORS[0],hi=DIFF_ANCHORS[DIFF_ANCHORS.length-1];
  for(let i=0;i<DIFF_ANCHORS.length-1;i++)if(level>=DIFF_ANCHORS[i].lv){lo=DIFF_ANCHORS[i];hi=DIFF_ANCHORS[i+1]}
  const t=hi.lv===lo.lv?1:clamp((level-lo.lv)/(hi.lv-lo.lv),0,1),lerp=k=>lo[k]+(hi[k]-lo[k])*t;
  return{rowBudget:Math.round(lerp('rowBudget')),density:lerp('density'),maxHp:Math.round(lerp('maxHp')),
    descent:lerp('descent'),steelChance:lerp('steelChance'),specialBudget:Math.round(lerp('specialBudget')),
    templateTier:Math.round(lerp('templateTier')),par:Math.round(lerp('par'))};
}
{ // self-check: monotonic on every numeric axis
  let prev=difficulty(1);
  for(let lv=2;lv<=40;lv++){
    const d=difficulty(lv);
    for(const k in d)console.assert(d[k]>=prev[k]-1e-9,'difficulty not monotonic',k,lv);
    prev=d;
  }
}
const PRICES={1:120,2:200,3:320,4:500};
