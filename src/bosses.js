'use strict';
const BOSSINFO={
  overseer:{name:'THE OVERSEER',secret:0,hint:'Guards the end of the Campaign and returns every 4th round of a Run. Its eye never leaves you. Its shots stun your paddle.',riddle:''},
  mirror:{name:'THE MIRROR',secret:1,hint:'Summoned by 8 PERFECT hits in a row. A pong duel: score 6 goals past its paddle into the ceiling.',riddle:'Strike the heart, again and again and again... and something will strike back.'},
  spark:{name:'THE SPARK',secret:1,hint:'Wakes when a chain reaches 60 hits. Break its spinning rays to reach the core.',riddle:'Keep the fire going long enough and it takes a shape.'},
  dealer:{name:'THE DEALER',secret:0,hint:'Waits at Round 25 of every Run. The house itself. Beat it and the run is yours.',riddle:''},
};

// ---------- bosses ----------
const BOSS={
  overseer:{
    init:lv=>{const hp=30+lv*12;return{hp,max:hp,x:W/2,y:-60,w:220,h:56,fireT:3,droneT:5}},
    update(b,dt){
      const g=game;b.t+=dt;
      if(b.enter>0){b.enter-=dt;b.y+=(150-b.y)*Math.min(1,dt*2.5);return}
      const p2=b.hp<b.max/2;
      b.x=W/2+Math.sin(b.t*(p2?.95:.6))*(W/2-b.w/2-30);b.y=150+Math.sin(b.t*1.3)*10;
      if((b.fireT-=dt)<=0){
        b.fireT=p2?1.5:2.3;const n=p2?5:3,a0=Math.atan2(g.p.x-b.x,g.p.y-b.y);
        for(let i=0;i<n;i++){const a=a0+(i-(n-1)/2)*.22;g.shots.push({x:b.x,y:b.y+b.h/2,vx:Math.sin(a)*230,vy:Math.cos(a)*230})}
        sfx.laser();
      }
      if((b.droneT-=dt)<=0){
        b.droneT=1;
        if(g.bricks.length<10&&!g.balls.some(ba=>ba.y>220&&ba.y<290)){
          b.droneT=p2?7:10;for(let c=3;c<=10;c++)g.bricks.push(mkBrick(c,240,p2?'2':'1',400));dirty=true;
        }
      }
    },
  },
  mirror:{
    init:()=>({hp:6,max:6,x:W/2,y:TOP-40,w:130,h:14,err:0,vx:0}),
    update(b,dt){
      const g=game;b.t+=dt;
      if(b.enter>0){b.enter-=dt;b.y+=((TOP+34)-b.y)*Math.min(1,dt*3);return}
      let tgt=W/2,bb=null;
      for(const ba of g.balls)if(!ba.stuck&&ba.dy<0&&ba.y<450&&(!bb||ba.y<bb.y))bb=ba;
      if(bb){ // predict where the ball crosses our line, unfolding wall bounces
        const t=(bb.y-(b.y+b.h))/(-bb.dy*bb.s),span=W-2*R;
        let px=bb.x+bb.dx*bb.s*t-R;px=((px%(2*span))+2*span)%(2*span);if(px>span)px=2*span-px;
        tgt=px+R+b.err;
      }
      const maxV=300+(b.max-b.hp)*30,want=clamp((tgt-b.x)*6,-maxV,maxV);
      b.vx+=(want-b.vx)*Math.min(1,dt*8);b.x=clamp(b.x+b.vx*dt,b.w/2,W-b.w/2);
      if(b.hp<=3)b.w+=(160-b.w)*Math.min(1,dt);
    },
  },
  spark:{
    init(){
      const b={hp:24,max:24,x:W/2,y:-80,r:34,rot:0,spin:.6,regrowT:6,fireT:3,arms:[]};
      for(let i=0;i<8;i++)for(let j=0;j<2;j++)b.arms.push(mkArm(i,j));
      return b;
    },
    update(b,dt){
      const g=game;b.t+=dt;b.rot+=b.spin*dt;
      if(b.enter>0){b.enter-=dt;b.y+=(250-b.y)*Math.min(1,dt*2.5)}
      else{
        const p2=b.hp<=b.max/2;if(p2&&b.spin>0)b.spin=-1.1;
        b.x=W/2+Math.sin(b.t*.45)*200;b.y=250+Math.sin(b.t*.8)*35;
        if((b.fireT-=dt)<=0){b.fireT=p2?2:3.2;for(let i=0;i<10;i++){const a=b.rot+i*.6283;g.shots.push({x:b.x,y:b.y,vx:Math.cos(a)*170,vy:Math.sin(a)*170})}}
        if((b.regrowT-=dt)<=0){
          b.regrowT=p2?5:7;const i=b.arms.findIndex(a=>a.dead);
          if(i>=0){const a=mkArm(b.arms[i].ray,b.arms[i].seg);b.arms[i]=a;g.bricks.push(a)}
        }
      }
      for(const a of b.arms){const ang=b.rot+a.ray*Math.PI/4,d=b.r+26+a.seg*26;a.x=b.x+Math.cos(ang)*d-11;a.y=b.y+Math.sin(ang)*d-11}
    },
  },
  // ponytail: Overseer reskin for now; the card-tally Phase 1/2 from GAME_DESIGN.md is a follow-up
  dealer:{shape:'overseer',
    init:lv=>{const hp=60+lv*20;return{hp,max:hp,x:W/2,y:-60,w:240,h:60,fireT:3,droneT:5}},
    update(b,dt){BOSS.overseer.update(b,dt)},
  },
};
function mkArm(i,j){const hp=j===0?2:1;return{x:-99,y:-99,w:22,h:22,hp,max:hp,type:'n',r:1e4+i*9,c:1e4+j*9,dyn:true,ray:i,seg:j}}
function startBoss(kind){
  const g=game;
  g.saved=g.bricks.filter(b=>!b.dead);g.bricks=[];g.caps=[];g.booms=[];g.shots=[];g.bolts=[];
  const b=BOSS[kind].init(g.endless?Math.floor(g.wave/4):1);
  b.hp=b.max=Math.round(b.hp*g.mods.bossHpMult);
  Object.assign(b,{k:kind,shape:BOSS[kind].shape||kind,name:BOSSINFO[kind].name,enter:2.2,flash:0,icd:0,t:0,final:kind==='dealer'});g.boss=b;
  if(kind==='spark')g.bricks=b.arms.slice();
  if(kind==='mirror')for(const c of[2,5,8,11])g.bricks.push(mkBrick(c,330,'S',500));
  if(kind!=='overseer')g.met[kind]=true;
  const cx=store.codex[kind]||(store.codex[kind]={seen:0,beat:0});cx.seen++;save();
  g.banner={text:'WARNING',sub:b.name+' APPROACHES',t:2.2,c:'bad'};sfx.alarm();g.shake=10;dirty=true;
}
const bossCenter=b=>b.k==='mirror'?[b.x,b.y+b.h/2]:[b.x,b.y];
function hurtBoss(n,x,y){
  const g=game,b=g.boss;if(!b||b.enter>0||b.hp<=0)return;
  b.hp-=n;b.flash=.08;addScore(150*n);if(once('bh',50))sfx.bossHit();
  if(x!==undefined)burst(x,y,T.a2,10,220,.4,3);
  if(n>=1){g.combo++;g.comboT=2+g.mods.comboTimeBonus;g.bestCombo=Math.max(g.bestCombo,g.combo)}
  if(b.hp<=0)bossDown();
}
function bossDown(){
  const g=game,b=g.boss,mult=g.endless?Math.max(1,Math.floor(g.wave/4)):1,bonus=(b.k==='overseer'?15000:25000)*mult,[bx,by]=bossCenter(b);
  addScore(bonus);store.codex[b.k].beat++;save();g.stats.bosses++;g.beaten[b.k]=1;fire('bossDefeated',b);
  for(const c of[T.a1,T.a2,T.gold])burst(bx,by,c,60,520,1.1,4,120);
  g.shake=26;g.slow=1.2;sfx.bossDie();
  g.bricks=g.saved||[];g.saved=null;g.shots=[];g.boss=null;dirty=true;
  if(b.final){g.victory=3.2;g.banner={text:'VICTORY',sub:(g.endless?'the house falls':'the campaign is yours')+'  ·  +'+fmt(bonus),t:3.2,c:'good'}}
  else g.banner={text:'DEFEATED',sub:b.name+'  ·  +'+fmt(bonus),t:2.6,c:'good'};
  if(!b.final&&!g.endless&&!g.bricks.some(k=>k.type!=='s'))levelClear();
}
// moving rect: resolve by least penetration, not by ball direction
function rectBounce(b,x,y,w,h){
  if(b.x+R<=x||b.x-R>=x+w||b.y+R<=y||b.y-R>=y+h)return false;
  const ox=Math.min(b.x+R-x,x+w-(b.x-R)),oy=Math.min(b.y+R-y,y+h-(b.y-R));
  if(ox<oy){if(b.x<x+w/2){b.x=x-R;b.dx=-Math.abs(b.dx)}else{b.x=x+w+R;b.dx=Math.abs(b.dx)}}
  else{if(b.y<y+h/2){b.y=y-R;b.dy=-Math.abs(b.dy)}else{b.y=y+h+R;b.dy=Math.abs(b.dy)}}
  return true;
}
function bossBall(b,bs,fire){
  if(bs.shape==='overseer'){if(rectBounce(b,bs.x-bs.w/2,bs.y-bs.h/2,bs.w,bs.h)&&bs.icd<=0){bs.icd=.06;hurtBoss(fire?2:1,b.x,b.y)}}
  else if(bs.k==='spark'){
    const dx=b.x-bs.x,dy=b.y-bs.y,d=Math.hypot(dx,dy),rr=bs.r+R;
    if(d<rr&&d>0){const nx=dx/d,ny=dy/d,dot=b.dx*nx+b.dy*ny;if(dot<0){b.dx-=2*dot*nx;b.dy-=2*dot*ny}b.x=bs.x+nx*rr;b.y=bs.y+ny*rr;hurtBoss(fire?3:2,b.x,b.y)}
  }else if(b.dy<0&&b.y-R<=bs.y+bs.h&&b.y>bs.y+bs.h/2&&b.x+R>=bs.x-bs.w/2&&b.x-R<=bs.x+bs.w/2){
    const a=clamp((b.x-bs.x)/(bs.w/2),-1,1);b.dx=Math.sin(a);b.dy=Math.cos(a);b.y=bs.y+bs.h+R;bs.err=rand(-50,50);bs.flash=.08;sfx.paddle();
  }
}
function bossHasPoint(bs,x,y){
  if(bs.shape==='overseer')return Math.abs(x-bs.x)<bs.w/2&&Math.abs(y-bs.y)<bs.h/2;
  if(bs.k==='spark')return Math.hypot(x-bs.x,y-bs.y)<bs.r;
  return false;
}
