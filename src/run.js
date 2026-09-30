'use strict';
// ================= Run orchestration: stage sequencing, level lifecycle, economy =================
function runSetup(){
  const g=game;
  if(T!==baseTheme())setTheme(baseTheme());
  g.relicsEquipped=[]; // every run starts with nothing equipped, regardless of what's owned (§3.2)
  equipRelics(g.relicsEquipped,g.mods);
  g.casinoRng=rng((g.seed^0x9e3779b9)|0);
  g.shelf=null;g.rerolls=0;g.shelfDiscounted=false;
  if(g.mods.markedDeck)g.nextCap=rollCap();
}
// ---------- level lifecycle ----------
function startLevel(n){
  const g=game,gen=genRunLevel(n,g.seed);
  let total=0;for(const row of gen.rows)for(const ch of row)if(ch!=='.'&&ch!=='S')total++;
  Object.assign(g,{level:n,t:0,caps:[],bolts:[],booms:[],shots:[],fx:{},odT:0,clearT:0,bricks:[],
    rows:gen.rows,rowsSpawned:0,levelDescent:gen.descent,levelPar:gen.par,pendingReward:false,
    levelTotal:total,levelDestroyed:0,topY:BY+4*BH,scrollY:0,cacheY:0});
  resetBall();dirty=true;
  const rowsVisible=clamp(gen.rows.length,5,7);
  while(g.rowsSpawned<rowsVisible&&g.topY>=TOP){g.topY-=BH;spawnLevelRow(g.topY)}
  g.banner={text:'LEVEL '+n,sub:g.mode==='daily'?today():'',t:2};
  fire('roundStart',n);
}
function spawnLevelRow(y){
  const g=game;if(g.rowsSpawned>=g.rows.length)return;
  const row=g.rows[g.rowsSpawned++];
  [...row].forEach((ch,c)=>{if(ch!=='.')g.bricks.push(mkBrick(c,y,ch,-g.rowsSpawned))});
  dirty=true;
}
function levelComplete(){
  const g=game;
  for(const k of g.bricks)if(!k.dead&&k.type!=='s')damage(k,99,true); // sweep: remaining bricks detonate for points
  const secs=Math.floor(g.t),onPar=secs<=g.levelPar,bnd=band(g.level);
  const base=Math.round((RUN.levelPayBase+g.level*RUN.levelPayPerLevel)*bnd.payoutMult),parBonus=onPar?Math.round(RUN.parBonus*bnd.payoutMult):0;
  const x2=g.fx.X2>0?2:1,pay=Math.round(filter('chipPayout',(base+parBonus)*x2,{source:'level'}));
  g.chips+=pay;g.clearT=1.2;g.slow=.9;sfx.clear();
  g.banner={text:'LEVEL CLEAR',sub:'+'+fmt(pay)+' CHIPS'+(onPar?'  ·  PAR':''),t:1.2,c:'good'};
}
function afterLevelTransition(){
  const g=game,due=g.justBeatBoss||g.pendingReward||(g.level%RUN.rewardPickEvery===0);
  g.justBeatBoss=false;g.pendingReward=false;
  if(g.mode!=='daily'&&due)openRewardPick();else nextStage();
}
function nextStage(){
  const g=game;
  if(g.pendingStages==null)g.pendingStages=stagesAfter(g.level).filter(s=>!(s==='casino'&&g.mode==='daily'));
  if(g.pendingStages.length){
    const s=g.pendingStages.shift();
    if(s==='boss')return startBoss(pickBossFor(g.level,g));
    if(s==='casino')return openCasino();
    if(s==='final')return startBoss('dealer');
  }
  g.pendingStages=null;
  startLevel(g.level+1);
}

// ---------- run end ----------
const ENDINGS={
  bust:{title:'EARLY BUST',line:'The house barely looked up.'},
  fold:{title:'FOLDED',line:'A respectable hand, played out.'},
  deep:{title:'DEEP RUN',line:'The pit boss knows your name now.'},
  victory:{title:'VICTORY',line:'You broke the house.'},
};
const endingOf=g=>g.won?'victory':g.level<5?'bust':g.level<15?'fold':'deep';
function runEnd(g){
  const m=store.meta,end=endingOf(g);
  // ponytail: Daily is the same seeded challenge for everyone — it doesn't touch the persistent collection
  if(g.mode!=='daily'){
    m.runsPlayed++;m.bestRound=Math.max(m.bestRound,g.level);m.totalScore+=g.score;if(g.won)m.wins++;
    m.endingsSeen[end]=(m.endingsSeen[end]||0)+1;
  }
  g.result={chips:g.chips,ending:ENDINGS[end],fresh:g.mode!=='daily'?checkUnlocks(g):[]};
  if(T!==baseTheme())setTheme(baseTheme());
}
