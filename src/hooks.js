'use strict';
// ================= hooks, filters & mods =================
// the three ways relics touch the engine: fire() side-effect events, filter() value chains, game.mods numbers
const HOOKS=['runStart','roundStart','brickDestroyed','paddleHit','ballLost','lifeLost','breach','bossDefeated','capsulePicked','casinoEntered','runEnd'];
const FILTERS=['capsuleWeight','rouletteItemOdds','chipPayout','breachLifeCost','ballLostCounts','stunApplied','nextCapsuleId'];
let hooks={},filters={};
const on=(name,fn)=>(hooks[name]??=[]).push(fn);
const fire=(name,...args)=>(hooks[name]||[]).forEach(fn=>fn(...args));
const onFilter=(name,fn)=>(filters[name]??=[]).push(fn);
const filter=(name,value,...args)=>(filters[name]||[]).reduce((v,fn)=>fn(v,...args),value);
const clearHooks=()=>{hooks={};filters={}};
// read directly at each existing computation site; defaults are identity so a fresh run is untouched
const MOD_DEFAULTS={paddleWidthMult:1,paddleAccelMult:1,wallDescentMult:1,overdriveFillMult:1,
  catchDurationMult:1,capDurationMult:1,shrinkDurationMult:1,capFallMult:1,dropChanceMult:1,dropChanceBonus:0,
  comboTimeBonus:0,comboMultCap:8,shieldHits:1,ballDamageMult:1,startBallCount:1,splitCount:3,steelHp:0,
  bossHpMult:1,hudMinimal:false,markedDeck:false,firstShelfDiscount:0};
