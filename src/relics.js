'use strict';
// ================= relics & upgrades =================
// tier = unlock difficulty, NOT power. No unlock => eligible from the start. hint => shown on the Codex while locked.
// effects: mods(m) tweaks game.mods at run start; on:{hook:fn} reacts to events; filter:{name:fn} reshapes a value.
// per-run relic state lives in game.rs (fresh every run), never in closures.
const RELICS=[
  // ---- tier 1 · common ----
  {id:'magnet_paddle',name:'MAGNET PADDLE',tier:1,pool:['roulette'],info:'Multi capsules 20% more likely to drop.',filter:{capsuleWeight:w=>(w.M&&(w.M*=1.2),w)}},
  {id:'deep_pockets',name:'DEEP POCKETS',tier:1,pool:['roulette','blackjack'],info:'+15% Chips from this run.',filter:{chipPayout:n=>n*1.15}},
  {id:'steady_grip',name:'STEADY GRIP',tier:1,pool:['roulette'],info:'Chain timer lasts 0.5s longer.',mods:m=>{m.comboTimeBonus+=.5}},
  {id:'light_fingers',name:'LIGHT FINGERS',tier:1,pool:['roulette'],info:'Capsules fall 15% slower.',mods:m=>{m.capFallMult*=.85}},
  {id:'cushioned_corners',name:'CUSHIONED CORNERS',tier:1,pool:['roulette','blackjack'],info:'Your first breach each run costs bricks, not a life.',
    filter:{breachLifeCost:n=>game.rs.cushion?n:(game.rs.cushion=1,0)}},
  {id:'early_bird',name:'EARLY BIRD',tier:1,pool:['roulette','blackjack'],info:'Start every run with Expand active for 10s.',on:{runStart:g=>{g.fx.E=10}}},
  {id:'shattered_nerve',name:'SHATTERED NERVE',tier:1,pool:['roulette'],info:'Curse: paddle 25% narrower — but Overdrive fills 40% faster.',mods:m=>{m.paddleWidthMult*=.75;m.overdriveFillMult*=1.4}},
  {id:'heavy_hands',name:'HEAVY HANDS',tier:1,pool:['roulette'],info:'Curse: paddle 30% slower to reach full speed — but 25% wider.',mods:m=>{m.paddleAccelMult/=1.3;m.paddleWidthMult*=1.25}},
  // ---- tier 2 · uncommon ----
  {id:'overcharge',name:'OVERCHARGE',tier:2,pool:['roulette'],info:'Overdrive fills 25% faster.',unlock:runsPlayed(5),mods:m=>{m.overdriveFillMult*=1.25}},
  {id:'sticky_fingers',name:'STICKY FINGERS',tier:2,pool:['roulette'],info:'Catch lasts 50% longer.',unlock:perfectStreak(5),mods:m=>{m.catchDurationMult*=1.5}},
  {id:'backup_battery',name:'BACKUP BATTERY',tier:2,pool:['roulette'],info:'Shield absorbs 2 hits instead of 1.',unlock:reachRound(8),mods:m=>{m.shieldHits=2}},
  {id:'night_owl',name:'NIGHT OWL',tier:2,pool:['roulette'],info:'The wall always descends 5% slower.',unlock:runsPlayed(8),mods:m=>{m.wallDescentMult*=.95}},
  {id:'lucky_foot',name:"LUCKY RABBIT'S FOOT",tier:2,pool:['roulette','blackjack'],info:'+3% capsule drop chance from bricks.',unlock:comboStreak(40),mods:m=>{m.dropChanceBonus+=.03}},
  {id:'loaded_dice',name:'LOADED DICE',tier:2,pool:['roulette'],info:'While equipped, roulette ★ bets land 3% more often.',unlock:spinsPlayed(15),
    hint:'Spin long enough and the wheel starts to remember you.',filter:{rouletteItemOdds:p=>p+.03}},
  {id:'second_wind',name:'SECOND WIND',tier:2,pool:['roulette','blackjack'],info:'Your first lost life is refunded once your chain reaches 10 again.',unlock:beatBossCount(3,{cumulative:true}),
    on:{lifeLost:()=>{const g=game;if(!g.rs.wind)g.rs.wind=1},
        brickDestroyed:()=>{const g=game;if(g.rs.wind===1&&g.combo>=10){g.rs.wind=2;g.lives++;sfx.life();pop(W/2,H/2+100,'SECOND WIND',T.good,24)}}}},
  {id:'second_chances',name:'SECOND CHANCES',tier:2,pool:['roulette','blackjack'],info:'+1 life every 8 rounds survived (max 3 per run).',unlock:reachRound(9),
    on:{roundStart:w=>{const g=game;if(w%8===0&&(g.rs.chances||0)<3){g.rs.chances=(g.rs.chances||0)+1;g.lives++;sfx.life();pop(W/2,H/2+100,'+1 LIFE',T.good,24)}}}},
  {id:'loan_shark',name:'LOAN SHARK',tier:2,pool:['roulette'],info:'Curse: +100 Chips the moment the run starts. −200 at the next Casino if you haven’t reached it yet.',unlock:spinsPlayed(10),
    on:{runStart:g=>{g.chips+=100},casinoEntered:g=>{if(!g.rs.loanPaid){g.rs.loanPaid=1;g.chips-=200}}}},
  {id:'cursed_coin',name:'CURSED COIN',tier:2,pool:['roulette'],info:'Curse: capsule effects last twice as long — each pickup costs 1% of your score.',unlock:runsPlayed(7),
    mods:m=>{m.capDurationMult*=2},on:{capsulePicked:()=>{const g=game;g.score=Math.floor(g.score*.99)}}},
  {id:'butterfingers',name:'BUTTERFINGERS',tier:2,pool:['roulette','blackjack'],info:'Curse: double capsule drops — but 15% of them turn into Shrink.',unlock:comboStreak(50),
    mods:m=>{m.dropChanceMult*=2},filter:{nextCapsuleId:id=>Math.random()<.15?'H':id}},
  // ---- tier 3 · rare ----
  {id:'glass_cannon',name:'GLASS CANNON',tier:3,pool:['blackjack'],info:'Balls deal double damage — but a breach costs 2 lives.',unlock:reachRound(15),
    mods:m=>{m.ballDamageMult*=2},filter:{breachLifeCost:n=>n*2}},
  {id:'twin_fangs',name:'TWIN FANGS',tier:3,pool:['blackjack'],info:'Multi splits every ball into 4 instead of 3.',unlock:comboStreak(80),mods:m=>{m.splitCount=4}},
  {id:'iron_lung',name:'IRON LUNG',tier:3,pool:['blackjack'],info:'Immune to boss-shot stun — but Shrink lasts twice as long.',unlock:beatBossCount(10,{cumulative:true}),
    mods:m=>{m.shrinkDurationMult*=2},filter:{stunApplied:()=>false}},
  {id:'counter_weight',name:'COUNTER WEIGHT',tier:3,pool:['blackjack'],info:'25% chance a lost ball does not cost a life.',unlock:beatBossCount(15,{cumulative:true}),
    filter:{ballLostCounts:v=>v&&Math.random()>=.25}},
  {id:'vulture',name:'VULTURE',tier:3,pool:['blackjack'],info:'Boss kills pay double Chips — but bosses have 25% more HP.',unlock:beatBossCount(20,{cumulative:true}),
    mods:m=>{m.bossHpMult*=1.25},filter:{chipPayout:(n,ctx)=>ctx&&ctx.source==='boss'?n*2:n}},
  {id:'marked_deck',name:'MARKED DECK',tier:3,pool:['blackjack'],directBuy:500,info:'Shows the next capsule in the HUD before it drops.',unlock:runsPlayed(30),mods:m=>{m.markedDeck=true}},
  {id:'twin_strike',name:'TWIN STRIKE',tier:3,pool:['blackjack'],info:'Every life starts with 2 balls — each deals half damage.',unlock:reachRound(20),
    mods:m=>{m.startBallCount=2;m.ballDamageMult*=.5}},
  {id:'cracked_lens',name:'CRACKED LENS',tier:3,pool:['blackjack'],info:'Curse: no danger line, no score popups — but the chain multiplier caps at x12.',unlock:scoreThreshold(250000),
    mods:m=>{m.hudMinimal=true;m.comboMultCap=12}},
  // ---- tier 4 · legendary ----
  {id:'house_edge',name:'HOUSE EDGE',tier:4,pool:['blackjack'],info:'Once per run, the first Shrink that would drop is rerolled.',unlock:runsPlayed(75),
    filter:{nextCapsuleId:id=>{const g=game;if(id!=='H'||g.rs.edge)return id;g.rs.edge=1;let n;do n=rollCap();while(n==='H');return n}}},
  {id:'all_in',name:'ALL IN',tier:4,pool:['blackjack'],info:'Start with Overdrive full — but it fills at half rate all run.',unlock:beatBossCount(40,{cumulative:true}),
    mods:m=>{m.overdriveFillMult*=.5},on:{runStart:g=>{g.od=100}}},
  {id:'house_always_wins',name:'THE HOUSE ALWAYS WINS',tier:4,pool:['blackjack'],info:'Your first Casino visit each run: the shelf is 50% off.',unlock:runsPlayed(100),
    hint:'Nobody beats the house. So become it.',mods:m=>{m.firstShelfDiscount=.5}},
  {id:'dead_mans_hand',name:"DEAD MAN'S HAND",tier:4,pool:['blackjack'],info:'The first time you would lose your last life, survive — chain and Overdrive reset.',unlock:reachRound(RUN_LEN,{win:true}),
    hint:'Aces and eights. Play the last hand all the way.',
    filter:{ballLostCounts:v=>v&&!deadMansHand(1),breachLifeCost:n=>deadMansHand(n)?Math.max(0,game.lives-1):n}},
  {id:'glass_jaw',name:'GLASS JAW',tier:4,pool:['blackjack'],info:'Curse: steel breaks in 3 hits — but one breach costs ALL your lives.',unlock:scoreThreshold(3000000,{cumulative:true}),
    mods:m=>{m.steelHp=3},filter:{breachLifeCost:()=>game.lives}},
];
function deadMansHand(cost){
  const g=game;if(g.rs.dmh||g.lives-cost>0)return false;
  g.rs.dmh=1;g.combo=0;g.od=0;g.odT=0;pop(W/2,H/2+100,"DEAD MAN'S HAND",T.gold,26);sfx.life();return true;
}
const UPGRADES=[
  {id:'slot4',name:'RELIC SLOT IV',kind:'upgrade',tier:2,pool:['roulette','blackjack'],directBuy:400,info:'A 4th relic slot.',
    unlock:reachRound(RUN_LEN,{win:true}),apply:()=>{store.meta.relicSlots++}},
  {id:'slot5',name:'RELIC SLOT V',kind:'upgrade',tier:3,pool:['roulette','blackjack'],directBuy:600,info:'A 5th relic slot.',
    unlock:beatAllBossTypes(),hint:'Some guardians only show up for the precise... or the relentless.',apply:()=>{store.meta.relicSlots++}},
];
RELICS.forEach(r=>r.kind='relic');
const ITEMS=[...RELICS,...CAP_ITEMS,...UPGRADES],ITEM=Object.fromEntries(ITEMS.map(i=>[i.id,i]));
// self-check: every declared hook/filter exists, ids unique, tiers 1-4
ITEMS.forEach(i=>{
  for(const k in i.on||{})console.assert(HOOKS.includes(k),'unknown hook',k,i.id);
  for(const k in i.filter||{})console.assert(FILTERS.includes(k),'unknown filter',k,i.id);
  console.assert(i.tier>=1&&i.tier<=4&&i.pool.length,'bad item',i.id);
});
console.assert(Object.keys(ITEM).length===ITEMS.length,'duplicate item id');

// clears and re-registers from the equipped list; m=null outside a run (the casino only needs filters).
// Re-derives mods from MOD_DEFAULTS every call so re-equipping mid-run never compounds multipliers.
function equipRelics(ids,m){
  clearHooks();
  if(m)Object.assign(m,MOD_DEFAULTS);
  for(const id of ids){
    const r=ITEM[id];if(!r||r.kind!=='relic')continue;
    if(r.mods&&m)r.mods(m);
    for(const k in r.on||{})on(k,r.on[k]);
    for(const k in r.filter||{})onFilter(k,r.filter[k]);
  }
}
