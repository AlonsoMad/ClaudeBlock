'use strict';

function newGame(mode){
  lastMode=mode;parts=[];
  game={mode,endless:mode!=='campaign',score:0,lives:3,level:1,wave:1,combo:0,comboT:0,bestCombo:0,od:0,odT:0,nextLife:30000,
    shake:0,slow:0,pflash:0,stun:0,fx:{},banner:null,bricks:[],balls:[],caps:[],bolts:[],booms:[],shots:[],flashes:[],texts:[],
    t:0,playT:0,laserCd:0,shield:false,clearT:0,victory:0,won:false,boss:null,saved:null,pendingBoss:null,met:{},perfStreak:0,
    stats:{bricks:0,perfects:0,bosses:0},scrollY:0,cacheY:0,waitLaunch:true,
    mods:Object.assign({},MOD_DEFAULTS),rs:{},beaten:{},bestPerf:0,coinChips:0,nextCap:null,dbl:false,key:false,result:null,
    seed:mode==='daily'?hashStr(today()):(Math.random()*1e9)|0,p:{x:W/2,w:110,y:672,h:14,vx:0}};
  clearHooks();
  if(mode==='endless')runSetup();
  if(game.endless)startEndless();else loadLevel(1);
  fire('runStart',game);
  state='play';
}
function loadLevel(n){
  const g=game;
  Object.assign(g,{level:n,t:0,caps:[],bolts:[],booms:[],shots:[],fx:{},odT:0,clearT:0,bricks:[]});
  resetBall();dirty=true;
  if(n>=CAMPAIGN_LEN){startBoss('overseer');g.boss.final=true;return}
  const[name,rows]=n<=LEVELS.length?LEVELS[n-1]:genLevel(n);
  rows.forEach((row,r)=>[...row].forEach((ch,c)=>{if(ch!=='.')g.bricks.push(mkBrick(c,BY+r*BH,ch,r))}));
  g.banner={text:'SECTOR '+String(n).padStart(2,'0'),sub:name,t:2};
}
const speed=()=>{const g=game,lv=g.endless?Math.min(15,g.wave+1):g.level;return Math.min(640,410+lv*10)*(1+Math.min(.3,g.t*.004))*(g.fx.S>0?.7:1)};
function resetBall(){
  const g=game,n=g.mods.startBallCount;g.waitLaunch=true;g.balls=[];
  for(let i=0;i<n;i++)g.balls.push({x:g.p.x,y:g.p.y-R,dx:0,dy:-1,stuck:true,off:n>1?(i-(n-1)/2)*30:rand(-15,15),trail:[],s:speed()});
}
const comboMult=()=>Math.min(game.mods.comboMultCap,1+Math.floor(game.combo/5))*(game.odT>0?2:1);
const bcol=k=>k.type==='x'?T.bx:k.type==='q'?T.q[0]:k.type==='s'?T.steel[1]:T.hp[Math.min(4,k.max)];

function addScore(n){
  const g=game;g.score+=Math.round(n);
  while(g.score>=g.nextLife){g.nextLife+=30000;g.lives++;sfx.life();pop(W/2,H/2+100,'EXTRA LIFE',T.text,24)}
}
function pop(x,y,s,c,size=16){if(game.texts.length<40)game.texts.push({x,y,s,c,size,t:1})}
function burst(x,y,c,n,sp=220,life=.5,size=3,grav=400){
  for(let i=0;i<n&&parts.length<700;i++){const a=rand(0,6.283),v=rand(.2,1)*sp;parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:life*rand(.6,1),m:life,c,s:size*rand(.6,1.3),g:grav})}
}
function launch(){
  const g=game;let any=false;
  for(const b of g.balls)if(b.stuck){const a=clamp(b.off/(g.p.w/2),-1,1);b.dx=Math.sin(a);b.dy=-Math.cos(a);b.stuck=false;any=true}
  if(any){sfx.paddle();g.waitLaunch=false}
}
function overdrive(){
  const g=game;if(g.od<100||g.odT>0)return;
  g.od=0;g.odT=7;g.shake=8;sfx.od();g.banner={text:'OVERDRIVE',sub:'fire balls · double points',t:1.2,c:'hot'};
}

function damage(k,amt,boom){
  if(k.dead)return;const g=game;
  g.flashes.push({x:k.x,y:k.y,w:k.w,h:k.h,t:.12});
  if(k.type==='s'&&!boom){if(once('steel',40))sfx.steel();if(g.mods.steelHp&&(k.sh=(k.sh||0)+1)>=g.mods.steelHp)destroy(k);return}
  k.hp-=amt;
  if(k.hp>0){addScore(10);if(!k.dyn)dirty=true;if(once('hit',20))sfx.hit();burst(k.x+k.w/2,k.y+k.h/2,bcol(k),5,120,.3,2);return}
  destroy(k);
}
function destroy(k){
  const g=game;k.dead=true;if(!k.dyn)dirty=true;
  g.combo++;g.comboT=2+g.mods.comboTimeBonus;g.bestCombo=Math.max(g.bestCombo,g.combo);g.stats.bricks++;
  const mult=comboMult(),pts=(k.type==='x'?100:k.type==='s'?250:50*k.max)*mult,cx=k.x+k.w/2,cy=k.y+k.h/2;
  addScore(pts);if(!g.mods.hudMinimal&&(mult>1||pts>=200))pop(cx,cy,'+'+fmt(pts),mult>=4?T.gold:T.text,mult>=4?18:14);
  if(g.odT<=0)g.od=Math.min(100,g.od+3*g.mods.overdriveFillMult);
  burst(cx,cy,bcol(k),14,240,.55,3);
  if(once('brick',15))sfx.brick(g.combo);
  if(k.type==='x')g.booms.push({k,t:.07});
  if((k.type==='q'||Math.random()<(k.type==='s'?.3:.1)*g.mods.dropChanceMult+g.mods.dropChanceBonus)&&g.caps.length<6){
    let t=pickCap();if(k.type==='q'&&g.key){g.key=false;while(t==='H')t=rollCap()}
    const vy=150*g.mods.capFallMult;g.caps.push({x:cx,y:cy,t,vy});
    if(g.dbl){g.dbl=false;g.caps.push({x:cx+26,y:cy,t,vy})}
  }
  fire('brickDestroyed',k);
  if(g.combo>=g.mods.sparkCombo&&!g.met.spark&&!g.boss)g.pendingBoss='spark'; // secret
  if(!g.endless&&!g.boss&&!g.clearT&&!g.bricks.some(b=>!b.dead&&b.type!=='s'))levelClear();
}
function explode(k){
  const g=game,cx=k.x+k.w/2,cy=k.y+k.h/2;
  g.shake=Math.max(g.shake,10);if(once('boom',60))sfx.boom();
  burst(cx,cy,T.bx,30,420,.7,4,0);burst(cx,cy,T.gold,16,200,.5,3,0);
  for(const b of g.bricks)if(!b.dead&&Math.abs(b.r-k.r)<=1&&Math.abs(b.c-k.c)<=1)damage(b,99,true);
}
function levelClear(){
  const g=game,secs=Math.floor(g.t),bonus=1000*g.level+Math.max(0,90-secs)*50;
  addScore(bonus);g.clearT=2.8;g.slow=.9;sfx.clear();
  g.banner={text:'SECTOR CLEAR',sub:`+${fmt(bonus)} bonus  ·  ${secs}s`,t:2.8,c:'good'};
}
function loseLife(){
  const g=game;
  if(!filter('ballLostCounts',true)){resetBall();g.banner={text:'SAVED',sub:"that one didn't count",t:1.3,c:'good'};return}
  g.lives--;g.shake=18;sfx.lose();fire('lifeLost');
  Object.assign(g,{combo:0,fx:{},odT:0,caps:[],bolts:[],shots:[],perfStreak:0});
  burst(g.p.x,H-10,T.bad,40,400,.8,3);
  if(g.lives<=0){gameOver();return}
  resetBall();g.banner={text:'BALL LOST',sub:g.lives+(g.lives>1?' lives left':' life left'),t:1.3,c:'bad'};
}
function breach(){
  const g=game,cut=DANGER-4*BH,cost=filter('breachLifeCost',1);g.lives=Math.max(0,g.lives-cost);g.shake=20;g.combo=0;sfx.lose();sfx.boom();fire('breach');if(cost)fire('lifeLost');
  for(const k of g.bricks)if(k.y+k.h>cut){k.dead=true;burst(k.x+k.w/2,k.y+k.h/2,bcol(k),4,260,.6,3)}
  dirty=true;
  if(g.lives<=0){gameOver();return}
  g.banner={text:'BREACH',sub:'the wall got through  ·  '+(cost?'':'no life lost  ·  ')+g.lives+(g.lives>1?' lives left':' life left'),t:1.5,c:'bad'};
}
function gameOver(){
  if(state==='over')return;
  const g=game,s=store.stats;state='over';overT=1.2;
  s.games++;s.time+=Math.round(g.playT);s.bricks+=g.stats.bricks;s.perfects+=g.stats.perfects;s.bosses+=g.stats.bosses;s.bestChain=Math.max(s.bestChain,g.bestCombo);
  fire('runEnd',g);if(g.mode==='endless')runEnd(g);save();
}

function applyCap(t){
  const g=game,d=CAPS[t],c=T[d.k],m=g.mods,anchored=t==='H'&&g.fx.A>0;
  if(t==='E')g.fx.H=0;if(t==='H'&&!anchored)g.fx.E=0;
  if(d.d&&!anchored)g.fx[t]=d.d*m.capDurationMult*(t==='C'?m.catchDurationMult:t==='H'?m.shrinkDurationMult:1);
  if(t==='M')split();else if(t==='B')g.shield=m.shieldHits;else if(t==='U'){g.lives++;sfx.life()}
  else if(t==='N')nuke();else if(t==='V')g.shots=[];else if(t==='O')g.coinChips+=10;else if(t==='D')g.dbl=true;else if(t==='K')g.key=true;
  if(t==='H')sfx.bad();else if(t!=='U')sfx.power();
  pop(g.p.x,g.p.y-24,anchored?'ANCHORED':d.n,c,18);addScore(50);burst(g.p.x,g.p.y,c,20,250,.5,3);
  fire('capsulePicked',t);
}
function nuke(){
  const g=game;let low=0;for(const k of g.bricks)if(!k.dead&&!k.dyn)low=Math.max(low,k.y+k.h);
  for(const k of g.bricks)if(!k.dead&&!k.dyn&&k.y+k.h>low-2*BH+1)damage(k,99,true);
  g.shake=Math.max(g.shake,14);sfx.boom();
}
function split(){
  const g=game,add=[];
  for(const b of g.balls){
    if(g.balls.length+add.length>=24)break;
    const a=Math.atan2(b.dx,-b.dy);
    for(const da of[-.4,.4,.8].slice(0,g.mods.splitCount-1))add.push({...b,dx:Math.sin(a+da),dy:-Math.cos(a+da),stuck:false,trail:[]});
  }
  g.balls.push(...add);if(add.length)g.waitLaunch=false;
}
function paddleHit(b){
  const g=game,p=g.p,off=clamp((b.x-p.x)/(p.w/2),-1,1);
  const a=clamp(off*1.1+p.vx/PSPD*.2,-1.2,1.2);
  b.dx=Math.sin(a);b.dy=-Math.cos(a);b.y=p.y-R;g.pflash=.15;
  if(Math.abs(off)<.12){
    g.perfStreak++;g.stats.perfects++;g.bestPerf=Math.max(g.bestPerf,g.perfStreak);
    g.od=Math.min(100,g.od+(g.odT>0?0:8*g.mods.overdriveFillMult));addScore(25*(g.endless?g.wave:g.level));
    pop(b.x,p.y-20,g.perfStreak>1?'PERFECT ×'+g.perfStreak:'PERFECT',T.good,16);
    burst(b.x,p.y,T.good,16,260,.5,2);sfx.perfect();
    if(g.perfStreak>=g.mods.mirrorStreak&&!g.met.mirror&&!g.boss)g.pendingBoss='mirror'; // secret
  }else{g.perfStreak=0;sfx.paddle()}
  if(g.fx.C>0){b.stuck=true;b.off=clamp(b.x-p.x,-p.w/2+R,p.w/2-R)}
  fire('paddleHit',b,Math.abs(off)<.12);
}


// ---------- ball physics ----------
function collide(b,fire){
  let hit=null,bd=1e9;
  for(const k of game.bricks){
    if(k.dead||(k.type==='s'&&game.fx.G>0)||b.x+R<=k.x||b.x-R>=k.x+k.w||b.y+R<=k.y||b.y-R>=k.y+k.h)continue;
    const d=Math.abs(b.x-k.x-k.w/2)+Math.abs(b.y-k.y-k.h/2);if(d<bd){bd=d;hit=k}
  }
  if(!hit)return;
  if(fire&&hit.type!=='s'){damage(hit,99);return}
  // least-penetration resolve: correct for moving bricks too (endless wall, spark arms)
  const ox=Math.min(b.x+R-hit.x,hit.x+hit.w-(b.x-R)),oy=Math.min(b.y+R-hit.y,hit.y+hit.h-(b.y-R));
  if(ox<oy){if(b.x<hit.x+hit.w/2){b.x=hit.x-R;b.dx=-Math.abs(b.dx)}else{b.x=hit.x+hit.w+R;b.dx=Math.abs(b.dx)}}
  else if(b.y<hit.y+hit.h/2&&hit.y>=TOP+2*R){b.y=hit.y-R;b.dy=-Math.abs(b.dy)}
  else{b.y=hit.y+hit.h+R;b.dy=Math.abs(b.dy)}
  if(hit.type==='s'){const a=Math.atan2(b.dx,-b.dy)+rand(-.06,.06);b.dx=Math.sin(a);b.dy=-Math.cos(a)} // anti-loop jitter
  damage(hit,game.mods.ballDamageMult);
}
function stepBall(b,dt){
  const g=game,p=g.p,bs=g.boss&&g.boss.enter<=0?g.boss:null;
  if(b.stuck){b.x=p.x+clamp(b.off,-p.w/2+R,p.w/2-R);b.y=p.y-R;b.trail.length=0;return}
  b.s+=(speed()-b.s)*Math.min(1,dt*2);
  const pierce=g.fx.F>0||g.odT>0,n=Math.ceil(b.s*dt/4),sd=dt/n;
  for(let i=0;i<n&&!b.dead&&!b.stuck;i++){
    b.x+=b.dx*b.s*sd;
    if(b.x<R){b.x=R;b.dx=Math.abs(b.dx);if(once('wall',30))sfx.wall()}
    else if(b.x>W-R){b.x=W-R;b.dx=-Math.abs(b.dx);if(once('wall',30))sfx.wall()}
    else collide(b,pierce);
    b.y+=b.dy*b.s*sd;
    if(b.y<TOP+R){
      b.y=TOP+R;b.dy=Math.abs(b.dy);
      if(bs&&bs.k==='mirror'){hurtBoss(1,b.x,TOP+4);pop(b.x,TOP+70,'GOAL!',T.good,22);sfx.goal();g.shake=8}
      else if(once('wall',30))sfx.wall();
    }
    else collide(b,pierce);
    if(bs&&g.boss)bossBall(b,bs,pierce);
    if(b.dy>0&&b.y+R>=p.y&&b.y<p.y+p.h/2&&b.x+R>=p.x-p.w/2&&b.x-R<=p.x+p.w/2)paddleHit(b);
    if(g.shield&&b.dy>0&&b.y+R>=H-6){b.y=H-6-R;b.dy=-Math.abs(b.dy);g.shield--;burst(b.x,H-6,T.gold,30,300,.6,3);sfx.steel()}
    if(b.y>H+R){b.dead=true;fire('ballLost',b)}
  }
  if(Math.abs(b.dy)<.28){b.dy=b.dy<0?-.28:.28;b.dx=(b.dx<0?-1:1)*Math.sqrt(1-.28*.28)} // never too horizontal
  b.trail.push([b.x,b.y]);if(b.trail.length>10)b.trail.shift();
}

function update(dt){
  const g=game,real=dt;g.playT+=real;
  if(g.slow>0){g.slow-=real;dt*=.3}
  if(g.victory>0&&(g.victory-=real)<=0){addScore(g.lives*5000);g.won=true;gameOver();return}
  if(g.clearT>0&&(g.clearT-=real)<=0){loadLevel(g.level+1);return}
  if(g.pendingBoss&&!g.boss&&!(g.clearT>0)&&!(g.victory>0)){startBoss(g.pendingBoss);g.pendingBoss=null}
  if(g.banner&&(g.banner.t-=real)<=0)g.banner=null;
  g.shake=Math.max(0,g.shake-real*40);g.pflash-=real;g.t+=dt;
  for(const k in g.fx)g.fx[k]-=dt;
  if(g.odT>0)g.odT-=dt;
  if(g.stun>0)g.stun-=dt;
  if(g.comboT>0&&(g.comboT-=dt)<=0)g.combo=0;
  // paddle: eased keyboard movement
  const p=g.p,dir=g.stun>0?0:(keys.ArrowRight||keys.KeyD?1:0)-(keys.ArrowLeft||keys.KeyA?1:0);
  p.vx+=(dir*PSPD-p.vx)*Math.min(1,dt*20*g.mods.paddleAccelMult);
  const tw=110*g.mods.paddleWidthMult*(g.fx.E>0?1.55:1)*(g.fx.H>0?.6:1);p.w+=(tw-p.w)*Math.min(1,dt*10);
  p.x+=p.vx*dt;if(p.x<p.w/2||p.x>W-p.w/2){p.x=clamp(p.x,p.w/2,W-p.w/2);p.vx=0}
  // lasers
  g.laserCd-=dt;
  if(g.fx.L>0&&keys.Space&&g.laserCd<=0&&!g.balls.some(b=>b.stuck)){g.laserCd=.2;g.bolts.push({x:p.x-p.w/2+7,y:p.y-6},{x:p.x+p.w/2-7,y:p.y-6});sfx.laser()}
  for(const b of g.bolts){
    b.y-=950*dt;if(b.y<TOP){b.dead=true;continue}
    if(g.boss&&g.boss.enter<=0&&bossHasPoint(g.boss,b.x,b.y)){hurtBoss(.25,b.x,b.y);b.dead=true;continue}
    for(const k of g.bricks)if(!k.dead&&b.x>k.x&&b.x<k.x+k.w&&b.y>k.y&&b.y<k.y+k.h){damage(k,1);b.dead=true;burst(b.x,b.y,T.bad,5,120,.3,2);break}
  }
  g.bolts=g.bolts.filter(b=>!b.dead);
  // boss & its shots (shots stun the paddle, never kill)
  if(g.boss){const b=g.boss;b.flash-=dt;b.icd-=dt;BOSS[b.k].update(b,dt)}
  for(const s of g.shots){
    s.x+=s.vx*dt;s.y+=s.vy*dt;
    if(s.y>H+10||s.y<TOP-10||s.x<-10||s.x>W+10)s.dead=true;
    else if(s.y+5>=p.y&&s.y-5<=p.y+p.h&&s.x+5>=p.x-p.w/2&&s.x-5<=p.x+p.w/2){s.dead=true;if(!(g.fx.A>0)&&filter('stunApplied',true))g.stun=.9;g.shake=Math.max(g.shake,7);sfx.zap();burst(s.x,s.y,T.bad,12,200,.4,2)}
  }
  g.shots=g.shots.filter(s=>!s.dead);
  // balls
  for(const b of g.balls)stepBall(b,dt);
  if(state!=='play')return;
  g.balls=g.balls.filter(b=>!b.dead);
  if(!g.balls.length&&!(g.clearT>0)&&!(g.victory>0)){loseLife();if(state!=='play')return}
  // capsules
  for(const c of g.caps){
    c.y+=c.vy*dt;
    if(c.y>H+20)c.dead=true;
    else if(c.y+8>=p.y&&c.y-8<=p.y+p.h&&c.x+18>=p.x-p.w/2&&c.x-18<=p.x+p.w/2){c.dead=true;applyCap(c.t)}
  }
  g.caps=g.caps.filter(c=>!c.dead);
  // chained explosions
  for(const e of g.booms)e.t-=dt;
  const ready=g.booms.filter(e=>e.t<=0);g.booms=g.booms.filter(e=>e.t>0);
  for(const e of ready)explode(e.k);
  // endless: the wall descends
  if(g.endless&&!g.boss&&!(g.victory>0)){
    let low=0;for(const k of g.bricks)if(!k.dead&&k.type!=='s')low=Math.max(low,k.y+k.h);
    let v=g.waitLaunch?0:Math.min(30,8+g.wave*1.3);
    if(!g.waitLaunch&&low<280)v=70; // catch-up when the board runs thin
    v*=g.mods.wallDescentMult*(g.fx.T>0?.5:1)*(g.fx.I>0?0:1);
    if(v){const d=v*dt;for(const k of g.bricks)k.y+=d;g.topY+=d;g.scrollY+=d}
    while(g.topY>=TOP&&!g.pendingBoss){g.topY-=BH;spawnRow(g.topY)}
    for(const k of g.bricks)if(k.type==='s'&&k.y>DANGER)k.dead=true;
    if(low>=DANGER){breach();if(state!=='play')return}
  }
  g.bricks=g.bricks.filter(b=>!b.dead);
  // fx
  let j=0;for(const q of parts){q.l-=dt;if(q.l<=0)continue;q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=q.g*dt;q.vx*=.99;parts[j++]=q}parts.length=j;
  for(const f of g.flashes)f.t-=dt;g.flashes=g.flashes.filter(f=>f.t>0);
  for(const t of g.texts){t.t-=dt;t.y-=40*dt}g.texts=g.texts.filter(t=>t.t>0);
}
