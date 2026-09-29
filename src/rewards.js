'use strict';
// ================= reward picks: automatic level pay lives in run.js; this is the pick-1-of-3 (§8) =================
function buildRewardOptions(){
  const g=game,opts=[],relicPool=RELICS.filter(r=>store.meta.unlocked.includes(r.id)&&!store.meta.relicsOwned.includes(r.id));
  if(relicPool.length)opts.push({kind:'relic',item:relicPool[Math.floor(Math.random()*relicPool.length)]});
  opts.push(g.lives<RUN.maxLives&&Math.random()<.6?{kind:'life'}:{kind:'shield'});
  opts.push(Math.random()<.5?{kind:'chips',amount:Math.round(RUN.rewardChipsBase*band(g.level).payoutMult)}:{kind:'capsule',cap:rollCap()});
  return opts;
}
function openRewardPick(){game.rewardOptions=buildRewardOptions();game.rewardSel=0;state='reward'}
function rewardLabel(opt){
  if(opt.kind==='relic')return{name:opt.item.name,info:opt.item.info,tier:opt.item.tier};
  if(opt.kind==='life')return{name:'+1 LIFE',info:'Recover a life (max '+RUN.maxLives+').'};
  if(opt.kind==='shield')return{name:'SHIELD CHARGE',info:'The floor saves your next lost ball.'};
  if(opt.kind==='chips')return{name:'+'+fmt(opt.amount)+' CHIPS',info:'A lump of Chips, banked now.'};
  return{name:CAPS[opt.cap].n+' NEXT',info:'Start the next level with '+CAPS[opt.cap].n+' queued up.'};
}
function pickReward(i){
  const g=game,opt=g.rewardOptions&&g.rewardOptions[i];if(!opt)return;
  if(opt.kind==='relic'){
    const m=store.meta;(store.codex.items[opt.item.id]??={}).owned=1;
    if(!m.relicsOwned.includes(opt.item.id))m.relicsOwned.push(opt.item.id);
    if(g.relicsEquipped.length<m.relicSlots){g.relicsEquipped.push(opt.item.id);equipRelics(g.relicsEquipped,g.mods)}
    save();
  }else if(opt.kind==='life'){g.lives=Math.min(RUN.maxLives,g.lives+1);sfx.life()}
  else if(opt.kind==='shield')g.shield=(g.shield||0)+g.mods.shieldHits;
  else if(opt.kind==='chips')g.chips+=opt.amount;
  else if(opt.kind==='capsule')g.nextCap=opt.cap;
  g.rewardOptions=null;state='play';nextStage();
}
