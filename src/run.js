'use strict';
// ================= Run mode (mode==='endless' internally) + Daily's endless wall =================
// the wall scrolls down forever, new rows are born under the HUD; a Run ends at Round 25 with THE DEALER
const isRun=g=>g.mode==='endless';
function startEndless(){
  const g=game;g.rowR=rng(g.seed);g.topY=BY+4*BH;g.rowsSpawned=0;g.lastRow=null;
  while(g.topY>=TOP){g.topY-=BH;spawnRow(g.topY)}
  resetBall();g.banner={text:g.mode==='daily'?'DAILY RUN':'RUN',sub:g.mode==='daily'?today():'25 rounds  ·  beat the house',t:2};
}
function spawnRow(y){
  const g=game,Rn=g.rowR,i=g.rowsSpawned++;
  if(i>0&&i%25===0)nextWave();
  const w=g.wave,maxHp=Math.min(4,1+Math.floor((w+1)/2));
  if(i%5===0){g.pat=Math.floor(Rn()*4);g.dens=.45+Rn()*.4}
  const row=Array(COLS).fill('.'),prev=g.lastRow||row;
  for(let c=0;c<7;c++){
    const on=[Rn()<g.dens,(c+i)%2===0,c%3!==1&&Rn()<.9,Rn()<g.dens*(i%2?1:.3)][g.pat];
    if(!on)continue;
    let ch=String(1+Math.floor(Rn()*maxHp));
    const x=Rn(),steelOk=w>=3&&c<6&&prev[c]!=='S'&&prev[c-1]!=='S'&&prev[c+1]!=='S'&&row[c-1]!=='S';
    if(x<.04)ch='X';else if(x<.065)ch='?';else if(steelOk&&x<.065+Math.min(.06,w*.008))ch='S';
    row[c]=row[13-c]=ch;
  }
  g.lastRow=row;
  row.forEach((ch,c)=>{if(ch!=='.')g.bricks.push(mkBrick(c,y,ch,-i))});
  dirty=true;
}
function nextWave(){
  const g=game,run=isRun(g);g.wave++;g.t=0;const bonus=500*g.wave;addScore(bonus);
  g.banner={text:(run?'ROUND ':'WAVE ')+g.wave,sub:'+'+fmt(bonus),t:1.6,c:'a1'};sfx.clear();
  if(run&&g.wave===RUN_LEN)g.pendingBoss='dealer';
  else if(g.wave%4===0)g.pendingBoss='overseer';
  if(run&&g.wave%8===1)setTheme(THEMES[(THEMES.indexOf(T)+1)%THEMES.length]); // cosmetic rotation, not saved
  fire('roundStart',g.wave);
}

// ---------- run start / end ----------
function runSetup(){
  const g=game;
  if(T!==baseTheme())setTheme(baseTheme());
  equipRelics(store.meta.relicsEquipped,g.mods);
  if(g.mods.markedDeck)g.nextCap=rollCap();
}
// ponytail: placeholder formula from GAME_DESIGN.md — tune after playtesting
const VICTORY_BONUS=250;
const runPayout=r=>Math.floor(r.score/500)+r.bosses*40+r.round*15+(r.won?VICTORY_BONUS:0);
console.assert(runPayout({score:0,bosses:0,round:1})===15&&runPayout({score:1000,bosses:2,round:25,won:true})===2+80+375+250,'runPayout');
const ENDINGS={
  bust:{title:'EARLY BUST',line:'The house barely looked up.'},
  fold:{title:'FOLDED',line:'A respectable hand, played out.'},
  deep:{title:'DEEP RUN',line:'The pit boss knows your name now.'},
  victory:{title:'VICTORY',line:'You broke the house.'},
};
const endingOf=g=>g.won?'victory':g.wave<5?'bust':g.wave<15?'fold':'deep';
function runEnd(g){
  const m=store.meta,rs={score:g.score,bosses:g.stats.bosses,round:g.wave,won:g.won};
  const pay=Math.round(filter('chipPayout',runPayout(rs),rs))+g.coinChips,end=endingOf(g); // Loan Shark can push this negative
  m.chips=Math.max(0,m.chips+pay);m.runsPlayed++;m.bestRound=Math.max(m.bestRound,g.wave);m.totalScore+=g.score;if(g.won)m.wins++;
  m.endingsSeen[end]=(m.endingsSeen[end]||0)+1;
  g.result={pay,ending:ENDINGS[end],secret:Object.keys(g.beaten).some(k=>BOSSINFO[k].secret),fresh:checkUnlocks(g)};
  if(T!==baseTheme())setTheme(baseTheme());
}
