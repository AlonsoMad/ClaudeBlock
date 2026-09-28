'use strict';
// ================= unlock-condition primitives =================
// each builder returns (run)=>bool; run is the finished game object, or null outside a run (load, casino)
const reachRound=(n,o={})=>r=>!!r&&r.mode==='endless'&&r.wave>=n&&(!o.win||r.won);
const beatBossCount=(n,o={})=>r=>o.cumulative?store.stats.bosses>=n:!!r&&r.stats.bosses>=n;
const comboStreak=n=>r=>!!r&&r.bestCombo>=n;
const perfectStreak=n=>r=>!!r&&r.bestPerf>=n;
const scoreThreshold=(n,o={})=>r=>o.cumulative?store.meta.totalScore>=n:!!r&&r.score>=n;
const runsPlayed=n=>()=>store.meta.runsPlayed>=n;
const spinsPlayed=n=>()=>store.meta.casino.spins>=n;
const blackjackHandsPlayed=n=>()=>store.meta.casino.blackjackHands>=n;
const beatSecretBoss=()=>()=>Object.keys(BOSSINFO).some(k=>BOSSINFO[k].secret&&(store.codex[k]||{}).beat>0);

// items with no unlock condition are eligible from the start; returns the ones that just fired
function checkUnlocks(run){
  const m=store.meta,fresh=[];
  for(const it of ITEMS)if(!m.unlocked.includes(it.id)&&(!it.unlock||it.unlock(run))){
    m.unlocked.push(it.id);(store.codex.items[it.id]??={}).unlocked=1;if(it.unlock)fresh.push(it);
  }
  save();return fresh;
}
