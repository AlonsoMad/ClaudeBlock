'use strict';
let last=performance.now(),acc=0;
// casino & codex draw as an HTML overlay
const SCREENS={menu:drawMenu,themes:drawThemes,options:drawOptionsMenu,'opt-audio':drawOptAudio,'opt-video':drawOptVideo,
  'opt-controls':drawControls,records:drawRecords,reward:drawReward,casino:()=>{},codex:()=>{}};
function frame(now){
  const dt=Math.min(.1,(now-last)/1000),tm=now/1000;last=now;
  if(state==='play'){acc+=dt;while(acc>=STEP&&state==='play'){update(STEP);acc-=STEP}}else acc=0;
  if(state==='over')overT-=dt;
  cov.hidden=state!=='casino'&&state!=='codex';
  ctx.setTransform(K,0,0,K,0,0);
  drawBackdrop(dt);
  if(SCREENS[state])SCREENS[state](tm);else{drawGame(tm);if(state!=='play')drawOverlay(tm)}
  if(ovL)ctx.drawImage(ovL,0,0,W,H);
  requestAnimationFrame(frame);
}

function rebuild(){buildBg();buildOverlay();brL=mk(cv.width,cv.height);dirty=true;sprBall=mkSpr(T.ball);sprFire=mkSpr(T.fire);ambInit()}
function setTheme(t){T=t;document.body.style.background=t.bg[2];rebuild()}
function resize(){
  const s=Math.min(innerWidth/W,innerHeight/H)*.98,dpr=devicePixelRatio||1;
  cv.style.width=W*s+'px';cv.style.height=H*s+'px';cov.style.transform=`scale(${s})`;
  K=Math.min(2,s*dpr);cv.width=Math.round(W*K);cv.height=Math.round(H*K);
  rebuild();
}
addEventListener('resize',resize);
document.body.style.background=T.bg[2];
checkUnlocks(null); // tier-1 items are eligible from the first launch
resize();requestAnimationFrame(frame);
