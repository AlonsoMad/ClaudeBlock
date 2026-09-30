'use strict';
// ================= rendering =================
const SPL=[1,.8,.94,.74,.9,.82,1,.77,.92,.72,.88,.85];
function drawSpark(x,cx,cy,r,n,rot,col,lw){
  x.strokeStyle=col;x.lineWidth=lw;x.lineCap='round';x.beginPath();
  for(let i=0;i<n;i++){const a=rot+i*6.2832/n,l=r*SPL[i%12];x.moveTo(cx+Math.cos(a)*r*.12,cy+Math.sin(a)*r*.12);x.lineTo(cx+Math.cos(a)*l,cy+Math.sin(a)*l)}
  x.stroke();x.lineCap='butt';
}
const circ=(x,y,r)=>{ctx.beginPath();ctx.arc(x,y,r,0,6.2832);ctx.fill()};
function mkSpr(rgb){
  const s=Math.ceil(40*K),c=mk(s,s),x=c.getContext('2d'),h=s/2;
  if(T.glow){
    const gr=x.createRadialGradient(h,h,0,h,h,h);
    gr.addColorStop(0,'#fff');gr.addColorStop(.3,'#fff');gr.addColorStop(.42,`rgba(${rgb},1)`);gr.addColorStop(.6,`rgba(${rgb},.35)`);gr.addColorStop(1,`rgba(${rgb},0)`);
    x.fillStyle=gr;x.fillRect(0,0,s,s);
  }else{
    x.scale(K,K);
    const d=(cx,cy,r,f)=>{x.fillStyle=f;x.beginPath();x.arc(cx,cy,r,0,6.2832);x.fill()};
    d(21.5,22.5,R,'rgba(0,0,0,.18)');d(20,20,R,`rgb(${rgb})`);d(17.5,17.5,R*.35,'rgba(255,255,255,.55)');
  }
  return c;
}
const HY=440;
function buildBg(){
  bgL=mk(cv.width,cv.height);const x=bgL.getContext('2d');x.setTransform(K,0,0,K,0,0);
  let gr=x.createLinearGradient(0,0,0,H);gr.addColorStop(0,T.bg[0]);gr.addColorStop(.6,T.bg[1]);gr.addColorStop(1,T.bg[2]);
  x.fillStyle=gr;x.fillRect(0,0,W,H);
  if(T.deco==='spark'){
    const Rg=rng(7);x.fillStyle='rgba(20,20,19,.035)';for(let i=0;i<2500;i++)x.fillRect(Rg()*W,Rg()*H,1,1);
    drawSpark(x,W/2,430,300,12,.13,'rgba(217,119,87,.07)',34);
  }else if(T.deco==='sun'){
    x.save();x.beginPath();x.arc(W/2,HY,150,Math.PI,0);x.clip();
    gr=x.createLinearGradient(0,HY-150,0,HY);gr.addColorStop(0,'rgba(255,204,0,.15)');gr.addColorStop(1,'rgba(255,43,214,.15)');x.fillStyle=gr;
    for(let y=HY-150;y<HY;y+=12)x.fillRect(W/2-150,y,300,12-(y-HY+150)/150*7);
    x.restore();
    x.strokeStyle='rgba(255,43,214,.2)';x.lineWidth=1;x.beginPath();
    for(let i=-14;i<=14;i++){x.moveTo(W/2+i*18,HY);x.lineTo(W/2+i*150,H)}
    x.stroke();x.fillStyle='rgba(255,43,214,.45)';x.fillRect(0,HY,W,1.5);
  }else if(T.deco==='crt'){
    x.strokeStyle='rgba(59,91,255,.35)';x.lineWidth=3;x.strokeRect(6,6,W-12,H-12);
  }else if(T.deco==='sea'){
    x.fillStyle='rgba(144,224,239,.045)';
    for(const x0 of[80,260,470,640,820]){x.beginPath();x.moveTo(x0,0);x.lineTo(x0+60,0);x.lineTo(x0+230,H);x.lineTo(x0+110,H);x.fill()}
    x.fillStyle='rgba(0,6,12,.85)';x.beginPath();x.moveTo(0,H);
    for(let i=0;i<=24;i++)x.lineTo(i*40,H-30-Math.abs(Math.sin(i*1.7))*40-(i%5===2?30:0));
    x.lineTo(W,H);x.fill();
  }else if(T.deco==='fuji'){
    x.fillStyle='rgba(255,180,195,.45)';x.beginPath();x.arc(W*.72,250,90,0,6.2832);x.fill();
    x.fillStyle='rgba(190,160,215,.45)';x.beginPath();x.moveTo(120,H);x.lineTo(440,330);x.lineTo(500,330);x.lineTo(820,H);x.fill();
    x.fillStyle='rgba(255,255,255,.8)';x.beginPath();x.moveTo(385,395);x.lineTo(440,330);x.lineTo(500,330);x.lineTo(555,395);x.lineTo(520,380);x.lineTo(490,398);x.lineTo(455,378);x.fill();
    x.fillStyle='rgba(233,170,190,.45)';x.beginPath();x.moveTo(0,H);
    for(let i=0;i<=12;i++)x.lineTo(i*80,H-60-Math.sin(i*.9)*30);
    x.lineTo(W,H);x.fill();
  }
  if(!T.light){gr=x.createRadialGradient(W/2,H/2,H*.3,W/2,H/2,H*.85);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.55)');x.fillStyle=gr;x.fillRect(0,0,W,H)}
}
function buildOverlay(){
  ovL=null;if(!T.scan)return;
  ovL=mk(cv.width,cv.height);const x=ovL.getContext('2d');x.setTransform(K,0,0,K,0,0);
  if(T.scan===1){
    x.fillStyle='rgba(0,0,0,.28)';for(let y=0;y<H;y+=3)x.fillRect(0,y,W,1.2);
    const gr=x.createRadialGradient(W/2,H/2,H*.45,W/2,H/2,H*.95);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.55)');x.fillStyle=gr;x.fillRect(0,0,W,H);
  }else{x.fillStyle='rgba(15,56,15,.07)';for(let y=0;y<H;y+=4)x.fillRect(0,y,W,1);for(let i=0;i<W;i+=4)x.fillRect(i,0,1,H)}
}
function drawBrick(x,b){
  const X=b.x+3,Y=b.y+3,w=b.w-6,h=b.h-6,c=bcol(b),st=T.style;
  if(b.type==='s'){
    const gr=x.createLinearGradient(0,Y,0,Y+h);gr.addColorStop(0,T.steel[0]);gr.addColorStop(.5,T.steel[1]);gr.addColorStop(1,T.steel[2]);
    x.fillStyle=gr;x.fillRect(X,Y,w,h);x.strokeStyle=T.steel[0];x.lineWidth=1;x.strokeRect(X+.5,Y+.5,w-1,h-1);
    x.fillStyle=T.steel[2];for(const px of[X+5,X+w-7])for(const py of[Y+4,Y+h-6])x.fillRect(px,py,2,2);
    return;
  }
  let fill=c;
  if(b.type==='q'){const gr=x.createLinearGradient(X,0,X+w,0);T.q.forEach((s,i)=>gr.addColorStop(i/3,s));fill=gr}
  if(st==='neon'){ // glow without shadowBlur: wide faint stroke + sharp stroke
    x.globalAlpha=.25;x.strokeStyle=c;x.lineWidth=6;x.strokeRect(X,Y,w,h);
    x.fillStyle=fill;x.globalAlpha=b.type==='q'?.55:.12+.2*(b.hp/b.max);x.fillRect(X,Y,w,h);x.globalAlpha=1;
    x.strokeStyle=c;x.lineWidth=2;x.strokeRect(X,Y,w,h);
    x.fillStyle='rgba(255,255,255,.3)';x.fillRect(X+2,Y+2,w-4,2);
  }else if(st==='soft'){
    x.fillStyle='rgba(0,0,0,.10)';x.beginPath();x.roundRect(X,Y+2,w,h,5);x.fill();
    x.fillStyle=fill;x.beginPath();x.roundRect(X,Y,w,h,5);x.fill();
    x.fillStyle='rgba(255,255,255,.28)';x.fillRect(X+4,Y+2,w-8,2);
    if(b.hp<b.max){x.fillStyle=`rgba(255,255,255,${.45*(1-b.hp/b.max)})`;x.beginPath();x.roundRect(X,Y,w,h,5);x.fill()}
  }else{
    x.fillStyle=fill;x.fillRect(X,Y,w,h);
    x.fillStyle='rgba(255,255,255,.4)';x.fillRect(X,Y,w,3);x.fillRect(X,Y,3,h);
    x.fillStyle='rgba(0,0,0,.35)';x.fillRect(X,Y+h-3,w,3);x.fillRect(X+w-3,Y,3,h);
    x.strokeStyle='rgba(0,0,0,.55)';x.lineWidth=1;x.strokeRect(X+.5,Y+.5,w-1,h-1);
    if(b.hp<b.max){x.beginPath();x.moveTo(X+w*.3,Y);x.lineTo(X+w*.45,Y+h*.6);x.lineTo(X+w*.36,Y+h);x.stroke()}
  }
  const ink=st==='neon'?c:st==='soft'?'rgba(255,255,255,.92)':'rgba(0,0,0,.65)';
  if(b.type==='x')drawSpark(x,X+w/2,Y+h/2,h*.45,8,0,st==='neon'?T.gold:ink,1.8);
  else if(b.type==='q'){x.fillStyle=st==='pixel'?'rgba(0,0,0,.7)':'#fff';x.font=`900 14px ${T.body}`;x.textAlign='center';x.fillText('?',X+w/2,Y+h-3)}
  else if(b.type==='d'||b.type==='m'||b.type==='e'){
    x.fillStyle=st==='pixel'?'rgba(0,0,0,.7)':'#fff';x.font=`900 14px ${T.body}`;x.textAlign='center';
    x.fillText(b.type==='d'?'$':b.type==='m'?'×2':'!',X+w/2,Y+h-3);
  }
  else if(b.max>1&&w>30){x.fillStyle=ink;for(let i=0;i<b.hp;i++)x.fillRect(X+w/2-b.hp*4+i*8+1,Y+h/2-1.5,6,3)}
}
function buildBricks(){
  dirty=false;const x=brL.getContext('2d');x.setTransform(1,0,0,1,0,0);x.clearRect(0,0,brL.width,brL.height);x.setTransform(K,0,0,K,0,0);
  game.cacheY=game.scrollY;
  for(const b of game.bricks)if(!b.dead&&!b.dyn)drawBrick(x,b);
}
function txt(s,x,y,size,c=T.text,al='left',glow=0,wt=700,fam=T.body){
  ctx.font=`${wt} ${size}px ${fam}`;ctx.textAlign=al;ctx.fillStyle=c;
  const gl=glow&&T.glow;if(gl){ctx.shadowColor=c;ctx.shadowBlur=glow}ctx.fillText(s,x,y);if(gl)ctx.shadowBlur=0;
}
const head=(s,x,y,size,c,glow=24)=>txt(s,x,y,size,c,'center',glow,T.hw,T.head);
const label=(s,x,y,al='left')=>txt(s,x,y,11,T.label,al);
function wrap(s,x,y,mw,lh,size,c,al='left'){
  ctx.font=`500 ${size}px ${T.body}`;let line='';
  for(const w of s.split(' ')){const t=line?line+' '+w:w;if(ctx.measureText(t).width>mw&&line){txt(line,x,y,size,c,al,0,500);y+=lh;line=w}else line=t}
  if(line){txt(line,x,y,size,c,al,0,500);y+=lh}return y;
}
function capsule(x,y,d){
  const c=T[d.k];ctx.fillStyle=c;if(T.glow){ctx.shadowColor=c;ctx.shadowBlur=10}
  ctx.beginPath();ctx.roundRect(x-18,y-8,36,16,8);ctx.fill();ctx.shadowBlur=0;
  ctx.fillStyle='rgba(255,255,255,.4)';ctx.fillRect(x-12,y-6,24,2);
  txt(d.l,x,y+5,13,T.bg[0],'center',0,900);
}
function paddleShape(cx,y,w,h,col,gl){
  const x=cx-w/2;
  if(T.glow){ctx.shadowColor=col;ctx.shadowBlur=gl;const gr=ctx.createLinearGradient(0,y,0,y+h);gr.addColorStop(0,'#fff');gr.addColorStop(.35,col);gr.addColorStop(.8,col);gr.addColorStop(1,'#000');ctx.fillStyle=gr}
  else{ctx.fillStyle='rgba(0,0,0,.16)';ctx.beginPath();ctx.roundRect(x+1,y+3,w,h,7);ctx.fill();ctx.fillStyle=col}
  ctx.beginPath();ctx.roundRect(x,y,w,h,T.style==='pixel'?2:7);ctx.fill();ctx.shadowBlur=0;
  ctx.fillStyle='rgba(255,255,255,.3)';ctx.fillRect(x+6,y+2,w-12,2);
}
function panel(x,y,w,h,title,ck){
  const c=T[ck]||ck;ctx.fillStyle=T.panel;ctx.fillRect(x,y,w,h);
  ctx.strokeStyle=c;ctx.globalAlpha=.6;ctx.lineWidth=1.5;ctx.strokeRect(x+.5,y+.5,w-1,h-1);ctx.globalAlpha=1;
  if(title)txt(title,x+w/2,y+30,15,c,'center',8);
}
// ---------- ambient layer ----------
const GLY='アカサタナハマヤラワｦｱｳｴｵｶｷｸｹｺ0123456789',glyph=()=>GLY[Math.random()*GLY.length|0];
let amb=[],gridT=0;
function ambNew(init){
  const a={x:rand(0,W),y:init?rand(0,H):0,z:rand(.2,1),ph:rand(0,6.28),rot:rand(0,6.28)};
  if(T.amb==='dust'||T.amb==='bubbles')a.y=init?rand(0,H):H+10;
  if(T.amb==='petals'){a.y=init?rand(0,H):-10;a.x=init?rand(0,W):rand(-150,W)}
  if(T.amb==='rain'){a.x=Math.floor(rand(0,W/16))*16+8;a.y=init?rand(-200,H):rand(-200,-20);a.chars=Array.from({length:8},glyph)}
  return a;
}
function ambInit(){amb=Array.from({length:{stars:70,dust:45,bubbles:34,petals:28,rain:22,none:0}[T.amb]},()=>ambNew(true))}
function drawBackdrop(dt){
  const boost=game&&state==='play'&&game.odT>0?4:1;
  ctx.drawImage(bgL,0,0,W,H);
  if(T.grid){
    gridT=(gridT+dt*.5*boost)%1;ctx.strokeStyle=boost>1?'rgba(255,122,0,.35)':T.grid;ctx.lineWidth=1;ctx.beginPath();
    for(let i=0;i<14;i++){const f=(i+gridT)/14,y=HY+(H-HY)*f*f;ctx.moveTo(0,y);ctx.lineTo(W,y)}
    ctx.stroke();
  }
  if(T.amb==='rain')ctx.font=`14px ${MONO}`,ctx.textAlign='center';
  for(let i=0;i<amb.length;i++){
    const a=amb[i];
    switch(T.amb){
      case'stars':a.y+=a.z*25*dt*boost;if(a.y>H)amb[i]=ambNew();ctx.globalAlpha=a.z*.7;ctx.fillStyle='#fff';ctx.fillRect(a.x,a.y,a.z*2,a.z*2);break;
      case'dust':a.y-=a.z*12*dt*boost;a.x+=Math.sin(a.ph+=dt*.8)*.2;if(a.y<-5)amb[i]=ambNew();ctx.globalAlpha=.22*a.z;ctx.fillStyle=T.a1;circ(a.x,a.y,1+a.z*2);break;
      case'bubbles':a.y-=(20+a.z*40)*dt*boost;a.x+=Math.sin(a.ph+=dt*2)*.4;if(a.y<-10)amb[i]=ambNew();ctx.globalAlpha=.35;ctx.strokeStyle=T.cool;ctx.lineWidth=1;ctx.beginPath();ctx.arc(a.x,a.y,1.5+a.z*4,0,6.2832);ctx.stroke();break;
      case'petals':a.y+=(25+a.z*35)*dt*boost;a.x+=(18+Math.sin(a.ph+=dt)*25)*dt;a.rot+=dt*(1+a.z);if(a.y>H+10||a.x>W+20)amb[i]=ambNew();ctx.globalAlpha=.65;ctx.fillStyle='#f7a1b5';ctx.beginPath();ctx.ellipse(a.x,a.y,4+a.z*4,2+a.z*2,a.rot,0,6.2832);ctx.fill();break;
      case'rain':
        a.y+=(60+a.z*120)*dt*boost;if(a.y-128>H){amb[i]=ambNew();break}
        if(Math.random()<.03)a.chars[Math.random()*8|0]=glyph();
        for(let j=0;j<8;j++){const cy=a.y-j*16;if(cy<0||cy>H)continue;ctx.globalAlpha=(1-j/8)*.35*a.z+.03;ctx.fillStyle=j?T.a1:'#e6ffe6';ctx.fillText(a.chars[j],a.x,cy)}
        break;
    }
  }
  ctx.globalAlpha=1;
}

function drawBoss(tm){
  const g=game,b=g.boss,fl=b.flash>0,p2=b.hp<b.max/2;
  if(b.shape==='overseer'){
    const x=b.x-b.w/2,y=b.y-b.h/2,col=fl?'#fff':p2?T.bad:b.k==='dealer'?T.gold:T.a2;
    if(T.glow){ctx.shadowColor=col;ctx.shadowBlur=24}
    ctx.fillStyle=col;ctx.beginPath();ctx.roundRect(x,y,b.w,b.h,14);ctx.fill();ctx.shadowBlur=0;
    ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.roundRect(x+10,y+10,b.w-20,b.h-20,8);ctx.fill();
    if(b.k==='dealer')for(const[sx,su]of[[x+40,'♠'],[x+b.w-40,'♦']])txt(su,sx,b.y+11,30,'rgba(255,255,255,.75)','center',0,900);
    else{ctx.fillStyle='rgba(255,255,255,.35)';for(let i=0;i<3;i++){ctx.fillRect(x+18+i*10,y+14,4,b.h-28);ctx.fillRect(x+b.w-22-i*10,y+14,4,b.h-28)}}
    const dx=g.p.x-b.x,dy=g.p.y-b.y,d=Math.hypot(dx,dy)||1;
    ctx.fillStyle='#fff';circ(b.x,b.y,17);ctx.fillStyle=p2&&Math.sin(tm*12)>0?T.bad:'#111';circ(b.x+dx/d*7,b.y+dy/d*7,8);
    ctx.fillStyle='#fff';circ(b.x+dx/d*7-2,b.y+dy/d*7-3,2.5);
  }else if(b.k==='mirror'){
    paddleShape(b.x,b.y,b.w,b.h,fl?'#fff':T.a2,24);
    ctx.fillStyle='rgba(255,255,255,.6)';ctx.fillRect(b.x-b.w/2+8+((b.t*110)%(b.w-22)),b.y+3,6,b.h-6);
    ctx.fillStyle=T.bg[0];circ(b.x-12,b.y+b.h/2,2.5);circ(b.x+12,b.y+b.h/2,2.5);
  }else{
    drawSpark(ctx,b.x,b.y,b.r*1.3,12,-b.rot*1.5,fl?'#fff':p2?T.bad:T.a1,7);
    ctx.fillStyle=fl?'#fff':p2?T.bad:T.a1;circ(b.x,b.y,b.r*.62);
    ctx.fillStyle='rgba(255,255,255,.45)';circ(b.x-6,b.y-7,b.r*.18);
  }
}
function drawGame(tm){
  const g=game,p=g.p,fire=g.fx.F>0||g.odT>0,blend=T.light?'source-over':'lighter';
  ctx.save();
  if(g.shake>0&&store.opt.shake)ctx.translate(rand(-1,1)*g.shake*.6,rand(-1,1)*g.shake*.6);
  if(!g.boss&&!g.mods.hudMinimal){
    let low=0;for(const k of g.bricks)if(k.type!=='s')low=Math.max(low,k.y+k.h);
    const near=clamp((low-(DANGER-220))/220,0,1);
    ctx.strokeStyle=T.bad;ctx.lineWidth=2;ctx.globalAlpha=.2+.7*near*(.5+.5*Math.sin(tm*10));ctx.setLineDash([12,8]);
    ctx.beginPath();ctx.moveTo(0,DANGER);ctx.lineTo(W,DANGER);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;
  }
  if(dirty)buildBricks();
  ctx.drawImage(brL,0,g.scrollY-g.cacheY,W,H);
  for(const k of g.bricks)if(k.dyn&&!k.dead)drawBrick(ctx,k);
  if(g.boss)drawBoss(tm);
  ctx.globalCompositeOperation=blend;
  for(const f of g.flashes){ctx.fillStyle=`rgba(255,255,255,${f.t*5})`;ctx.fillRect(f.x+3,f.y+3,f.w-6,f.h-6)}
  ctx.fillStyle=T.bad;for(const b of g.bolts)ctx.fillRect(b.x-1.5,b.y-10,3,14);
  for(const s of g.shots){ctx.fillStyle=T.bad;circ(s.x,s.y,5);ctx.fillStyle='#fff';circ(s.x,s.y,2)}
  for(const q of parts){ctx.globalAlpha=q.l/q.m;ctx.fillStyle=q.c;ctx.fillRect(q.x-q.s/2,q.y-q.s/2,q.s,q.s)}
  ctx.globalAlpha=1;
  const tc=fire?T.fire:T.ball,ta=T.glow?.35:.22;
  for(const b of g.balls)b.trail.forEach((t,i)=>{const a=i/b.trail.length;ctx.fillStyle=`rgba(${tc},${a*ta})`;ctx.beginPath();ctx.arc(t[0],t[1],R*a,0,7);ctx.fill()});
  for(const b of g.balls)ctx.drawImage(fire?sprFire:sprBall,b.x-20,b.y-20,40,40);
  ctx.globalCompositeOperation='source-over';
  if(g.shield){ctx.fillStyle=T.gold;ctx.globalAlpha=.6+.4*Math.sin(tm*8);ctx.fillRect(0,H-6,W,3);ctx.globalAlpha=1}
  for(const c of g.caps)capsule(c.x,c.y,CAPS[c.t]);
  const pc=g.stun>0?T.label:g.odT>0?T.hot:g.fx.C>0?T.good:g.fx.H>0?T.label:T.paddle;
  if(g.fx.L>0){ctx.fillStyle=T.bad;ctx.fillRect(p.x-p.w/2+4,p.y-6,6,8);ctx.fillRect(p.x+p.w/2-10,p.y-6,6,8)}
  if(!(g.stun>0&&Math.sin(tm*40)>0))paddleShape(p.x,p.y,p.w,p.h,pc,g.pflash>0?36:18);
  ctx.fillStyle='rgba(255,255,255,.6)';ctx.fillRect(p.x-p.w*.06,p.y+p.h-4,p.w*.12,2); // PERFECT sweet spot
  for(const t of g.texts){ctx.globalAlpha=Math.min(1,t.t*2);txt(t.s,t.x,t.y,t.size,t.c,'center',0,900)}
  ctx.globalAlpha=1;
  ctx.restore();
  drawHUD(tm);
  if(g.boss){
    const b=g.boss,x=W/2-250,y=TOP+6;
    ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(x,y,500,6);ctx.fillStyle=b.hp<b.max/2?T.bad:T.a2;ctx.fillRect(x,y,500*Math.max(0,b.hp)/b.max,6);
    txt(b.name,W/2,y+20,11,T.sub,'center');
  }
  if(g.banner){const b=g.banner;ctx.globalAlpha=Math.min(1,b.t*2);head(b.text,W/2,H/2+30,54,T[b.c]||T.text);if(b.sub)txt(b.sub,W/2,H/2+64,17,T.sub,'center');ctx.globalAlpha=1}
  else if(g.balls.some(b=>b.stuck)&&Math.floor(tm*2.5)%2===0)txt('SPACE TO LAUNCH',p.x,p.y-26,12,T.text,'center');
}
function drawHUD(tm){
  const g=game,pulse=Math.floor(tm*6)%2===0;
  ctx.fillStyle=T.hud;ctx.fillRect(0,0,W,TOP);
  ctx.fillStyle=T.line;ctx.globalAlpha=.5;ctx.fillRect(0,TOP-2,W,2);ctx.globalAlpha=1;
  const odF=g.odT>0?g.odT/7:g.od/100;
  ctx.fillStyle=g.odT>0||g.od>=100?(pulse?T.text:T.hot):T.hot;ctx.fillRect(0,TOP-3,W*odF,3);
  label('SCORE',20,22);txt(fmt(g.score),20,50,26);
  label('LIVES',250,22);
  for(let i=0;i<Math.min(g.lives,8);i++){ctx.fillStyle=T.a1;ctx.beginPath();ctx.roundRect(250+i*26,36,20,7,3);ctx.fill()}
  label(g.mode==='daily'?'DAILY LEVEL':'LEVEL',W/2,22,'center');
  txt(String(g.level).padStart(2,'0')+'/'+RUN.finalLevel,W/2,50,26,T.text,'center');
  label('CHAIN',610,22);
  if(g.combo>1){
    const m=comboMult();txt('x'+m,610,50,26,m>=6?T.bad:m>=3?T.gold:T.good);
    txt(g.combo+' hits',670,50,13,T.sub);ctx.fillStyle=T.label;ctx.fillRect(670,54,60*(g.comboT/(2+g.mods.comboTimeBonus)),2);
  }
  label('CHIPS',W-20,22,'right');txt(fmt(g.chips),W-20,50,26,T.gold,'right');
  // progress strip: segment pips toward the next boss, and levels until the next Casino
  const segLen=RUN.bossEvery,posInSeg=((g.level-1)%segLen)+1,pipW=9,gap=4,totalW=segLen*pipW+(segLen-1)*gap;
  let px=W/2-totalW/2;
  for(let i=1;i<=segLen;i++){ctx.fillStyle=i<=posInSeg?T.a2:T.label;ctx.globalAlpha=i<=posInSeg?1:.35;ctx.fillRect(px,TOP+3,pipW,3);px+=pipW+gap}
  ctx.globalAlpha=1;
  const casinoPos=((g.level-1)%RUN.casinoEvery)+1;
  txt('CASINO '+casinoPos+'/'+RUN.casinoEvery,W-20,TOP+12,10,T.label,'right');
  if(!g.boss&&g.levelTotal){ // level clear bar: destroyed / total destructible this level
    txt((g.levelDestroyed||0)+' / '+g.levelTotal,20,TOP+12,10,T.label);
    ctx.fillStyle=T.label;ctx.fillRect(20,TOP+16,80*Math.min(1,(g.levelDestroyed||0)/g.levelTotal),2);
  }
  let ex=12;
  for(const k of['E','H','L','C','F','S','T','I','A','G'])if(g.fx[k]>0){const d=CAPS[k],c=T[d.k];txt(d.n,ex,H-16,10,c);ctx.fillStyle=c;ctx.fillRect(ex,H-11,64*Math.min(1,g.fx[k]/d.d),2);ex+=80}
  if(g.fx.L>0)txt('HOLD SPACE',ex,H-11,10,T.bad);
  if(g.mods.markedDeck&&g.nextCap){txt('NEXT',W-62,H-11,10,T.label,'right');capsule(W-34,H-16,CAPS[g.nextCap])}
  if(g.od>=100&&g.odT<=0)txt('OVERDRIVE READY  —  PRESS SHIFT',W/2,H-14,14,pulse?T.text:T.hot,'center');
  let rx=W-20; // relic icons: one glyph per equipped relic
  for(const id of(g.relicsEquipped||[])){const it=ITEM[id];if(!it)continue;txt(it.name[0],rx,H-30,13,T.a1,'right',0,900);rx-=20}
}

// ================= screens =================
const MENU=[
  ['PLAY','25 levels, no checkpoints, THE DEALER at the end. Every level pays Chips.'],
  ['DAILY RUN',"Today's seeded run. The same levels, bosses & shelf for everyone."],
  ['OPTIONS','Audio, Video, Controls & the Codex.'],
  ['RECORDS','High scores, boss codex & lifetime stats.'],
];
function drawLogo(tm,y){
  if(T.logo)drawSpark(ctx,W/2,y-92,26,12,tm*.3,T.a1,6);
  head(T.title,W/2,y,88,T[T.lc[0]],30);head(T.t2,W/2,y+82,88,T[T.lc[1]],30);
  txt(T.tag.toUpperCase(),W/2,y+118,13,T.sub,'center');
}
function footer(s){txt(s,W/2,700,12,T.label,'center')}
function drawMenu(tm){
  drawLogo(tm,150);
  MENU.forEach(([s],i)=>{
    const y=304+i*33,sel=i===menuIdx;
    if(sel){ctx.fillStyle=T.a1;ctx.globalAlpha=.14;ctx.fillRect(W/2-170,y-24,340,34);ctx.globalAlpha=1;txt('›',W/2-150,y,22,T.a1);txt('‹',W/2+150,y,22,T.a1,'right')}
    txt(s,W/2,y,sel?22:19,sel?T.a1:T.sub,'center',sel?10:0);
  });
  txt(MENU[menuIdx][1],W/2,578,14,T.sub,'center',0,500);
  const m=MODES[menuIdx];
  if(m){const e=table(m)[0];txt(e?`BEST  ${fmt(e.score)}  —  ${e.name}`:'NO RECORD YET',W/2,608,13,T.gold,'center')}
  if(menuIdx===0||menuIdx===1)txt(`RELIC SLOTS ${store.meta.relicSlots}`,W/2,632,13,T.a1,'center');
  footer('↑ ↓  SELECT        ENTER  CONFIRM        M  MUTE');
}
function drawControls(){
  head('CONTROLS',W/2,70,44,T.a1,16);
  panel(60,95,410,330,'','a1');
  [['← → / A D','Move paddle'],['SPACE','Launch · fire laser'],['SHIFT / ↑','Unleash OVERDRIVE'],['P / ESC','Pause'],['M','Mute']]
    .forEach(([k,d],i)=>{txt(k,85,160+i*30,14,T.a1);txt(d,235,160+i*30,14,T.text,'left',0,500)});
  wrap('Where the ball meets the paddle sets its angle. Moving while you hit adds spin.',85,330,370,19,13,T.sub);
  panel(490,95,410,330,'RULES','a2');
  let y=150;
  for(const s of['CHAIN: break bricks within 2s of each other to multiply points, up to x8.','PERFECT: hit with the mark in the paddle center for bonus points and meter.','OVERDRIVE: fill the top bar, press SHIFT. Piercing fire balls, x2 points.','A Run descends through 25 levels. Crossing the red line costs a life.','Every level pays Chips automatically — spend them at the Casino, every 10 levels.'])
    y=wrap('• '+s,510,y,370,18,13,T.text)+6;
  panel(60,440,840,215,'POWER-UPS','gold');
  BASE_CAPS.forEach((k,i)=>{const d=CAPS[k],x=110+(i%3)*280,yy=500+Math.floor(i/3)*50;capsule(x,yy,d);txt(d.n,x+30,yy-2,13,T[d.k]==='#ffffff'?T.text:T[d.k]);txt(d.info,x+30,yy+15,11,T.sub,'left',0,500)});
  footer('ESC  BACK');
}
const SAMPLE=[['1','1','1','1','1'],['2','2','X','2','2'],['3','?','3','S','3'],['4','4','4','4','4']].flatMap((r,ri)=>r.map((ch,c)=>{const b=mkBrick(0,0,ch,0);b.x=526+c*68;b.y=176+ri*30;return b}));
SAMPLE[10].hp=2;
function drawThemes(tm){
  head('THEMES',W/2,72,44,T.a1,16);
  THEMES.forEach((t,i)=>{
    const y=108+i*72,sel=i===themeIdx;
    if(sel){ctx.fillStyle=T.a1;ctx.globalAlpha=.13;ctx.fillRect(60,y,410,64);ctx.globalAlpha=1;ctx.strokeStyle=T.a1;ctx.lineWidth=1.5;ctx.strokeRect(60.5,y+.5,409,63)}
    [t.bg[0],t.a1,t.a2,t.hp[3],t.gold].forEach((c,j)=>{ctx.fillStyle=c;circ(84+j*17,y+22,7);ctx.strokeStyle='rgba(128,128,128,.5)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(84+j*17,y+22,7,0,6.2832);ctx.stroke()});
    txt(t.name,180,y+28,18,sel?T.a1:T.text,'left',0,800);
    if(t.id===store.theme)txt('✓ ACTIVE',455,y+28,11,T.good,'right');
    txt(t.desc,78,y+50,11,T.sub,'left',0,500);
  });
  panel(490,108,410,500,'PREVIEW','a2');
  for(const b of SAMPLE)drawBrick(ctx,b);
  ['E','M','L','C','F'].forEach((k,i)=>capsule(560+i*68,330,CAPS[k]));
  for(let i=1;i<=8;i++){ctx.fillStyle=`rgba(${T.ball},${i/8*(T.glow?.35:.22)})`;circ(620+i*9,470-i*7,R*i/8)}
  ctx.drawImage(sprBall,692-20,414-20,40,40);
  paddleShape(700,500,120,14,T.paddle,18);
  head(T.name,695,562,26,T.a1,10);
  txt(T.tag,695,588,12,T.sub,'center',0,500);
  footer('↑ ↓  BROWSE (LIVE PREVIEW)        ENTER  APPLY        ESC  CANCEL');
}
const OPTIONS_MENU=[['AUDIO','opt-audio'],['VIDEO','opt-video'],['CONTROLS','opt-controls'],['CODEX','codex'],['BACK',null]];
function drawOptionsMenu(){
  head('OPTIONS',W/2,110,44,T.a1,16);
  panel(W/2-220,170,440,290,'','a1');
  OPTIONS_MENU.forEach(([n],i)=>{
    const y=225+i*50,sel=i===optIdx;
    if(sel){ctx.fillStyle=T.a1;ctx.globalAlpha=.13;ctx.fillRect(W/2-200,y-26,400,40);ctx.globalAlpha=1}
    txt(n,W/2,y,18,sel?T.a1:T.text,'center');
  });
  footer('↑ ↓  SELECT        ENTER  OPEN        ESC  BACK');
}
function optToggleList(title,opts,idx){
  head(title,W/2,110,44,T.a1,16);
  panel(W/2-260,150,520,56+opts.length*56,'','a1');
  opts.forEach(([n,k],i)=>{
    const y=215+i*56,sel=i===idx;
    if(sel){ctx.fillStyle=T.a1;ctx.globalAlpha=.13;ctx.fillRect(W/2-240,y-28,480,42);ctx.globalAlpha=1}
    txt(n,W/2-210,y,18,sel?T.a1:T.text);
    if(k==='theme')txt(T.name,W/2+210,y,18,T.a1,'right');
    else if(k)txt(store.opt[k]?'ON':'OFF',W/2+210,y,18,store.opt[k]?T.good:T.bad,'right');
  });
  footer('↑ ↓  SELECT        ← → / ENTER  TOGGLE        ESC  BACK');
}
const OPTS_AUDIO=[['MUSIC','music'],['SOUND FX','sfx'],['BACK',null]];
const OPTS_VIDEO=[['THEME','theme'],['SCREEN SHAKE','shake'],['BACK',null]];
function drawOptAudio(){optToggleList('AUDIO',OPTS_AUDIO,optIdx)}
function drawOptVideo(){optToggleList('VIDEO',OPTS_VIDEO,optIdx)}
const TABS=['RUN','DAILY','CODEX'];
const hms=s=>`${Math.floor(s/3600)}h ${String(Math.floor(s/60)%60).padStart(2,'0')}m`;
function drawRecords(tm){
  head('RECORDS',W/2,70,44,T.gold,16);
  TABS.forEach((t,i)=>{const x=W/2+(i-1)*170,sel=i===recTab;txt(t,x,112,15,sel?T.a1:T.label,'center');if(sel){ctx.fillStyle=T.a1;ctx.fillRect(x-45,120,90,2)}});
  if(recTab<2){
    const m=MODES[recTab],rows=table(m),hl=afterGame&&recTab===MODES.indexOf(lastMode)?lastRank:-1;
    panel(80,135,800,505,m==='daily'?'TODAY  ·  '+today():'HALL OF FAME','gold');
    const cols=[[110,'#','left'],[160,'NAME','left'],[520,'SCORE','right'],[620,'LEVEL','right'],[710,'CHAIN','right'],[850,'DATE','right']];
    cols.forEach(([x,s,a])=>label(s,x,190,a));
    if(!rows.length)txt('No scores yet. Go make history.',W/2,360,16,T.sub,'center');
    rows.forEach((e,i)=>{
      const y=226+i*40,hi=i===hl;
      if(hi){ctx.fillStyle=T.gold;ctx.globalAlpha=.14+.08*Math.sin(tm*6);ctx.fillRect(96,y-25,768,36);ctx.globalAlpha=1}
      const c=hi?T.text:i===0?T.gold:T.text;
      [String(i+1),e.name,fmt(e.score),(e.win?'★ ':'')+e.level,String(e.combo),e.date].forEach((s,j)=>txt(s,cols[j][0],y,17,c,cols[j][2],0,j===1||j===2?700:500));
    });
  }else{
    const bk=Object.keys(BOSSINFO),pw=(840-(bk.length-1)*16)/bk.length;
    bk.forEach((k,i)=>{
      const info=BOSSINFO[k],cx=store.codex[k],known=!info.secret||(cx&&cx.seen),x=60+i*(pw+16),mid=x+pw/2;
      panel(x,140,pw,300,'','a2');
      bossIcon(k,mid,215,known);
      txt(known?info.name:'???',mid,285,17,known?T.text:T.label,'center');
      txt(cx&&cx.beat?`DEFEATED ×${cx.beat}`:cx&&cx.seen?'ENCOUNTERED':info.secret?'UNDISCOVERED':'NOT YET MET',mid,308,11,cx&&cx.beat?T.good:T.label,'center');
      wrap(known?info.hint:info.riddle,mid,340,pw-30,17,12,T.sub,'center');
    });
    panel(60,460,840,185,'LIFETIME','a1');
    const s=store.stats;
    [['GAMES',fmt(s.games)],['TIME PLAYED',hms(s.time)],['BRICKS BROKEN',fmt(s.bricks)],['PERFECT HITS',fmt(s.perfects)],['BOSSES DEFEATED',fmt(s.bosses)],['BEST CHAIN',fmt(s.bestChain)]]
      .forEach(([l,v],i)=>{const x=200+(i%3)*280,y=530+Math.floor(i/3)*62;label(l,x,y,'center');txt(v,x,y+28,24,T.text,'center')});
  }
  footer('← →  TAB        ESC  BACK'+(afterGame?'        R  PLAY AGAIN':''));
}
function bossIcon(k,cx,cy,known){
  if(!known){head('?',cx,cy+24,68,T.label,0);return}
  if(k==='overseer'){ctx.fillStyle=T.a2;ctx.beginPath();ctx.roundRect(cx-60,cy-20,120,40,10);ctx.fill();ctx.fillStyle='#fff';circ(cx,cy,12);ctx.fillStyle='#111';circ(cx+3,cy+3,5)}
  else if(k==='dealer'){ctx.fillStyle=T.gold;ctx.beginPath();ctx.roundRect(cx-60,cy-20,120,40,10);ctx.fill();txt('♠',cx,cy+11,30,'#fff','center',0,900)}
  else if(k==='mirror'){paddleShape(cx,cy-30,100,11,T.a2,12);paddleShape(cx,cy+20,100,11,T.paddle,12);ctx.fillStyle=`rgb(${T.ball})`;circ(cx+16,cy-4,6)}
  else{drawSpark(ctx,cx,cy,44,12,0,T.a1,6);ctx.fillStyle=T.a1;circ(cx,cy,14)}
}
function drawReward(){
  const g=game,opts=g.rewardOptions||[];
  head('CHOOSE ONE',W/2,120,40,T.gold,16);
  txt('LEVEL '+g.level+' CLEAR',W/2,158,14,T.sub,'center');
  const n=opts.length,cw=260,gap=30,totalW=n*cw+(n-1)*gap,x0=W/2-totalW/2;
  opts.forEach((opt,i)=>{
    const x=x0+i*(cw+gap),y=220,h=340,sel=i===g.rewardSel,lbl=rewardLabel(opt);
    panel(x,y,cw,h,'',sel?'a1':'label');
    if(sel){ctx.strokeStyle=T.a1;ctx.lineWidth=2.5;ctx.strokeRect(x+1.5,y+1.5,cw-3,h-3)}
    txt(String(i+1),x+16,y+34,20,T.label);
    head(lbl.name,x+cw/2,y+120,20,T.text,10);
    wrap(lbl.info,x+cw/2,y+170,cw-40,18,13,T.sub,'center');
  });
  footer('← →  CHOOSE        ENTER / 1-'+n+'  TAKE IT');
}
function drawOverlay(tm){
  const g=game;ctx.fillStyle=T.dimBg;ctx.fillRect(0,0,W,H);
  if(state==='pause'){
    head('PAUSED',W/2,H/2-10,64,T.a1);
    txt('P  RESUME        Q  QUIT',W/2,H/2+40,16,T.text,'center');
  }else if(state==='over'&&g.result){ // Run results: ending flavor + chips earned this run (they don't persist)
    const r=g.result,q=qualifies(g.mode,g.score),f=r.fresh.map(i=>i.name);
    head(r.ending.title,W/2,H/2-120,64,g.won?T.good:T.a1,30);
    txt(r.ending.line,W/2,H/2-82,15,T.sub,'center',0,500);
    txt(fmt(g.score),W/2,H/2-30,36,T.text,'center');
    txt(`LEVEL ${g.level}/${RUN.finalLevel}  ·  BOSSES ${g.stats.bosses}  ·  BEST CHAIN ${g.bestCombo}${g.won?'  ·  +'+fmt(g.lives*5000)+' lives bonus':''}`,W/2,H/2+2,14,T.sub,'center');
    txt(fmt(r.chips)+' CHIPS EARNED',W/2,H/2+50,28,T.gold,'center',12,800);
    txt('HI  '+fmt(Math.max(best(g.mode),g.score)),W/2,H/2+74,12,T.label,'center');
    if(f.length)txt('NEW AT THE CASINO:  '+f.slice(0,4).join('  ·  ')+(f.length>4?`  +${f.length-4} more`:''),W/2,H/2+104,13,T.good,'center');
    if(q)txt('NEW HIGH SCORE!',W/2,H/2+138,20,Math.floor(tm*4)%2?T.gold:T.text,'center',16);
    if(overT<=0)txt(q?'PRESS ANY KEY':'R  RETRY        ANY KEY  RECORDS',W/2,H/2+174,14,T.text,'center');
  }else if(state==='over'){
    head(g.won?'VICTORY':'GAME OVER',W/2,H/2-40,72,g.won?T.good:T.bad,30);
    txt(fmt(g.score),W/2,H/2+20,36,T.text,'center');
    txt(`LEVEL ${g.level}  ·  BEST CHAIN ${g.bestCombo}${g.won?'  ·  +'+fmt(g.lives*5000)+' lives bonus':''}`,W/2,H/2+55,14,T.sub,'center');
    const q=qualifies(g.mode,g.score);
    if(q)txt('NEW HIGH SCORE!',W/2,H/2+100,22,Math.floor(tm*4)%2?T.gold:T.text,'center',16);
    if(overT<=0)txt(q?'PRESS ANY KEY':'R  RETRY        ANY KEY  RECORDS',W/2,H/2+150,14,T.text,'center');
  }else if(state==='entry'){
    const rank=table(g.mode).filter(e=>e.score>=g.score).length+1;
    head('NEW HIGH SCORE',W/2,200,54,T.gold);
    txt(`#${rank}  ·  ${fmt(g.score)}  ·  ${g.mode.toUpperCase()}`,W/2,250,22,T.text,'center');
    txt('ENTER YOUR NAME',W/2,330,14,T.sub,'center');
    panel(W/2-220,350,440,80,'','a1');
    txt(entryName+(Math.floor(tm*2)%2?'_':' '),W/2,402,32,T.text,'center',10);
    txt('ENTER  SAVE',W/2,470,14,T.text,'center');
  }
}
