'use strict';
// ================= casino: HTML/CSS overlay on top of the canvas (state==='casino'), lives inside a run =================
// ponytail: the roulette/blackjack table numbers (STAR_BET, wager range, itemChance curve) predate this spec and
// aren't Run-loop tuning — left inline rather than folded into config.js's RUN/PRICES/BANDS.
const cov=document.getElementById('casino');

// ---------- items: pools, pulls, grants ----------
const TIERN=['','COMMON','UNCOMMON','RARE','LEGENDARY'];
const TIER_W={roulette:[0,6,3,1,.3],blackjack:[0,1,2,4,3]}; // roulette leans common, blackjack leans rare
const isUnlocked=it=>store.meta.unlocked.includes(it.id);
const isOwned=it=>!!(store.codex.items[it.id]||{}).owned;
const eligible=pool=>ITEMS.filter(it=>(!pool||it.pool.includes(pool))&&isUnlocked(it)&&!isOwned(it));
function pullItem(pool){
  let c=eligible(pool);if(!c.length)c=eligible();if(!c.length)return null;
  const w=c.map(it=>pool&&TIER_W[pool]?TIER_W[pool][it.tier]:1);let t=Math.random()*w.reduce((a,b)=>a+b,0);
  return c.find((_,i)=>(t-=w[i])<0)||c[c.length-1];
}
function grant(it){
  const m=store.meta,g=game;(store.codex.items[it.id]??={}).owned=1;
  if(it.kind==='relic'){
    m.relicsOwned.push(it.id);
    if(g&&g.relicsEquipped&&g.relicsEquipped.length<m.relicSlots){g.relicsEquipped.push(it.id);equipRelics(g.relicsEquipped,g.mods)}
  }else if(it.kind==='capsule')m.unlockedCapsules.push(it.cap);
  else it.apply();
  save();sfx.life();
}
function unlockNote(){const f=checkUnlocks(null);if(f.length)cMsg+='  ·  NEW AT THE CASINO: '+f.map(i=>i.name).join(', ')}

// ---------- shelf: priced offers drawn from unlocked-but-not-owned items, + one mystery box (§9.1) ----------
function genShelf(){
  const g=game,bnd=band(g.level),disc=(g.mods.firstShelfDiscount&&!g.shelfDiscounted)?1-g.mods.firstShelfDiscount:1;
  g.shelfDiscounted=true;
  const pool=ITEMS.filter(it=>isUnlocked(it)&&!isOwned(it)),picked=pool.slice().sort(()=>g.casinoRng()-.5).slice(0,RUN.shelfSize);
  const offers=picked.map(it=>({id:it.id,price:Math.round(PRICES[it.tier]*bnd.priceMult*disc),bought:false}));
  offers.push({mystery:true,price:Math.round(PRICES[1]*bnd.priceMult*RUN.mysteryPriceMult*disc),bought:false});
  return offers;
}
function rerollShelf(){
  const g=game,cost=RUN.rerollBase+RUN.rerollStep*g.rerolls;
  if(g.chips<cost){cMsg='Not enough chips.';sfx.bad();return}
  g.chips-=cost;g.rerolls++;g.shelf=genShelf();sfx.menu();cMsg='Rerolled the shelf.';
}
function buyShelf(idx){
  const g=game,offer=g.shelf[+idx];if(!offer||offer.bought)return;
  if(g.chips<offer.price){cMsg='Not enough chips.';sfx.bad();return}
  g.chips-=offer.price;offer.bought=true;
  if(offer.mystery){
    if(Math.random()<RUN.mysteryHitChance){const it=pullItem();if(it){grant(it);cMsg='Mystery box: '+it.name+'!'}else{g.chips+=offer.price;cMsg='Mystery box: nothing left in the pool, refunded.'}}
    else{const refund=Math.round(offer.price*RUN.mysteryDudRefund);g.chips+=refund;cMsg='Mystery box: a dud. +'+refund+' chips.'}
  }else{const it=ITEM[offer.id];grant(it);cMsg='Bought '+it.name+'.'}
  unlockNote();
}
function sellRelic(id){
  const m=store.meta,g=game,it=ITEM[id];if(!it)return;
  const oi=m.relicsOwned.indexOf(id);if(oi<0)return;
  m.relicsOwned.splice(oi,1);(store.codex.items[id]||{}).owned=0;
  const ei=g.relicsEquipped.indexOf(id);if(ei>=0){g.relicsEquipped.splice(ei,1);equipRelics(g.relicsEquipped,g.mods)}
  const refund=Math.round(PRICES[it.tier]*RUN.sellRefund);g.chips+=refund;save();
  cMsg='Sold '+it.name+' for +'+refund+' chips.';
}

// ---------- roulette: 0-36 + three ★ pockets on a 40-pocket wheel ----------
const STAR=-1,STAR_BET=15;
const POCKETS=[0,32,15,19,4,21,2,25,17,34,6,27,13,STAR,36,11,30,8,23,10,5,24,16,33,1,20,STAR,14,31,9,22,18,29,7,28,12,35,3,26,STAR];
const REDS=[1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
const BETS={
  red:['RED',1,n=>REDS.includes(n)],black:['BLACK',1,n=>n>0&&!REDS.includes(n)],
  odd:['ODD',1,n=>n>0&&n%2===1],even:['EVEN',1,n=>n>0&&n%2===0],
  low:['1–18',1,n=>n>=1&&n<=18],high:['19–36',1,n=>n>=19],
  d1:['1st 12',2,n=>n>=1&&n<=12],d2:['2nd 12',2,n=>n>=13&&n<=24],d3:['3rd 12',2,n=>n>=25],
};
const betOf=v=>BETS[v]||[String(v),35,n=>n===+v]; // anything else is a straight-up number
// self-check: 40 pockets, 3 stars, every cash bet returns exactly 90% (0 + the stars are the house edge)
console.assert(POCKETS.length===40&&POCKETS.filter(n=>n===STAR).length===3&&new Set(POCKETS).size===38,'wheel');
for(const v of[...Object.keys(BETS),'0','17','36']){const[,pay,win]=betOf(v);console.assert(Math.abs(POCKETS.filter(win).length*(pay+1)/40-.9)<1e-9,'roulette odds',v)}
const pocketCol=n=>n===STAR?'#d4a017':n===0?'#1e8449':REDS.includes(n)?'#b8322a':'#1d1d1d';

let cTab='shelf',cMsg='',stake=25,wheelRot=0,spinLast=null,busy=false;
function spin(v){
  const g=game,cost=v==='star'?STAR_BET:stake;
  if(g.chips<cost){cMsg='Not enough chips.';sfx.bad();return}
  g.chips-=cost;store.meta.casino.spins++;save();
  let i=Math.random()*40|0;
  if(v==='star'){ // Loaded Dice reaches in here; at 3/40 this is exactly a fair uniform spin
    const hit=Math.random()<filter('rouletteItemOdds',3/40),c=POCKETS.map((_,j)=>j).filter(j=>(POCKETS[j]===STAR)===hit);
    i=c[Math.random()*c.length|0];
  }
  busy=true;spinLast=null;cMsg='The wheel spins…';renderCasino();
  const from=wheelRot,wh=cov.querySelector('.wheel');
  wheelRot+=1440+((-(i*9+4.5)-wheelRot)%360+360)%360; // pocket i centred under the pointer
  wh.style.transform=`rotate(${from}deg)`;wh.offsetWidth;wh.style.transform=`rotate(${wheelRot}deg)`;
  for(let k=0;k<14;k++)tone(1300,.02,'square',.02,1,k*k*.016);
  setTimeout(()=>{busy=false;settleSpin(v,POCKETS[i],cost);renderCasino()},3100);
}
function settleSpin(v,n,cost){
  const g=game,lbl=n===STAR?'★':n+(n===0?' GREEN':REDS.includes(n)?' RED':' BLACK');spinLast=n;
  if(v==='star'){
    if(n!==STAR){cMsg=lbl+' — no star this time.';sfx.bad()}
    else{const it=pullItem('roulette');if(it){grant(it);cMsg=`★ — you won ${it.name}!`}else{g.chips+=STAR_BET*10;cMsg='★ — nothing left in the pool, +150 chips.';sfx.clear()}}
  }else{
    const[name,pay,win]=betOf(v);
    if(win(n)){const w=cost*(pay+1);g.chips+=w;cMsg=`${lbl} — ${name} pays ${fmt(w)} chips!`;sfx.clear()}
    else{cMsg=`${lbl} — ${name} loses.`;sfx.bad()}
  }
  unlockNote();save();
}

// ---------- blackjack: single deck, dealer stands on 17, 3:2 naturals ----------
let shoe=[],hand=null,wager=50;
const itemChance=w=>clamp(w/400,.05,.5); // bigger bet, better shot at an item; a natural always pulls
const handVal=h=>{let s=0,ace=false;for(const c of h){s+=Math.min(10,c.r);if(c.r===1)ace=true}return ace&&s+10<=21?s+10:s};
const natural=h=>h.length===2&&handVal(h)===21;
console.assert(handVal([{r:1},{r:13}])===21&&handVal([{r:1},{r:1},{r:9}])===21&&handVal([{r:10},{r:6},{r:1}])===17,'handVal');
function drawCard(){
  if(shoe.length<15){shoe=[];for(const s of'♠♥♦♣')for(let r=1;r<=13;r++)shoe.push({r,s});
    for(let i=shoe.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[shoe[i],shoe[j]]=[shoe[j],shoe[i]]}}
  return shoe.pop();
}
function deal(){
  const g=game;if(g.chips<wager){cMsg='Not enough chips.';sfx.bad();return}
  g.chips-=wager;save();hand={w:wager,p:[drawCard(),drawCard()],d:[drawCard(),drawCard()],done:false};
  if(natural(hand.p)||natural(hand.d))settle();else cMsg='Hit or stand?';
}
function hit(){hand.p.push(drawCard());const v=handVal(hand.p);if(v>21)settle();else if(v===21)stand()}
function stand(){while(handVal(hand.d)<17)hand.d.push(drawCard());settle()}
function settle(){
  const g=game,c=store.meta.casino,w=hand.w,p=handVal(hand.p),d=handVal(hand.d),pn=natural(hand.p),dn=natural(hand.d);
  let back=0,pull=false,why;
  if(p>21)why='Bust.';
  else if(pn&&!dn){back=w*2.5;pull=true;why='BLACKJACK!'}
  else if(dn&&!pn)why='Dealer blackjack.';
  else if(d>21||p>d){back=w*2;pull=Math.random()<itemChance(w);why=d>21?'Dealer busts — you win!':'You win!'}
  else if(p===d){back=w;why='Push.'}
  else why='Dealer wins.';
  back=Math.floor(back);hand.done=true;g.chips+=back;c.blackjackHands++;c.blackjackNet+=back-w;if(back>w)c.blackjackWins++;
  cMsg=why+' '+(back>w?'+'+fmt(back-w)+' chips.':back===w?'Wager returned.':'−'+fmt(w)+' chips.');
  const it=pull&&pullItem('blackjack');
  if(it){grant(it);cMsg+=`  ·  and ${it.name}!`}else if(back>w)sfx.clear();else if(back<w)sfx.bad();
  unlockNote();save();
}

// ---------- rendering ----------
const card=(it,cls='',act='',extra='')=>`<div class="item t${it.tier} ${cls}" ${act?`data-act="${act}" data-v="${it.id}"`:''}>
  <b>${it.name}</b><i>${TIERN[it.tier]} ${it.kind.toUpperCase()}</i><p>${it.info}</p>${extra}</div>`;
const CTABS={
  shelf(){
    const g=game;
    const offers=g.shelf.map((o,i)=>{
      if(o.mystery)return`<div class="item t2 ${o.bought?'dim':''}"><b>MYSTERY BOX</b><i>UNKNOWN</i><p>A random item you don't own yet. Sometimes a dud.</p>
        ${o.bought?'<em>BOUGHT</em>':`<button data-act="buyshelf" data-v="${i}">BUY · ${o.price}</button>`}</div>`;
      const it=ITEM[o.id];
      return card(it,o.bought?'dim':'','',o.bought?'<em>BOUGHT</em>':`<button data-act="buyshelf" data-v="${i}">BUY · ${o.price}</button>`);
    }).join('');
    const rerollCost=RUN.rerollBase+RUN.rerollStep*g.rerolls;
    return`<div class="panel wide"><div class="lbl">THE SHELF · resets every visit</div><div class="grid">${offers}</div>
      <div class="row"><button data-act="reroll">REROLL SHELF · ${rerollCost}</button><span class="dim">Reroll only touches these priced offers, not your Loadout.</span></div></div>`;
  },
  roulette(){
    let felt=`<button data-act="spin" data-v="0" class="grn" style="grid-column:1;grid-row:1/4">0</button>`;
    for(let c=0;c<12;c++)for(let r=0;r<3;r++){const n=3*c+3-r;felt+=`<button data-act="spin" data-v="${n}" class="${REDS.includes(n)?'red':'blk'}" style="grid-column:${c+2};grid-row:${r+1}">${n}</button>`}
    ['d1','d2','d3'].forEach((v,i)=>felt+=`<button data-act="spin" data-v="${v}" style="grid-column:${2+i*4}/span 4;grid-row:4">${BETS[v][0]}</button>`);
    ['low','even','red','black','odd','high'].forEach((v,i)=>felt+=`<button data-act="spin" data-v="${v}" class="${v==='red'?'red':v==='black'?'blk':''}" style="grid-column:${2+i*2}/span 2;grid-row:5">${BETS[v][0]}</button>`);
    const grad=POCKETS.map((n,i)=>`${pocketCol(n)} ${i*9}deg ${i*9+9}deg`).join(',');
    return `<div class="panel wheelcol">
      <div class="wheelbox"><div class="pointer"></div><div class="wheel" style="background:conic-gradient(${grad});transform:rotate(${wheelRot}deg)"></div>
      <div class="hub" style="color:${spinLast===null?'inherit':pocketCol(spinLast)}">${spinLast===null?'':spinLast===STAR?'★':spinLast}</div></div>
      <p class="dim">Numbers pay 35:1 · dozens 2:1 · colours, odd/even, halves 1:1.<br>The three <b class="gold">★</b> pockets lose every chip bet — but a ★ bet pulls an item.</p></div>
    <div class="panel tablecol">
      <div class="row">STAKE ${[10,25,50,100].map(v=>`<button data-act="stake" data-v="${v}" class="${stake===v?'on':''}">${v}</button>`).join('')}<span class="dim">click any bet to spin</span></div>
      <div class="felt">${felt}</div>
      <button data-act="spin" data-v="star" class="star">★  BET FOR AN ITEM  ·  ${STAR_BET} CHIPS</button>
      <p class="dim">${eligible('roulette').length} items left in the roulette pool · leans Common & Uncommon.</p></div>`;
  },
  blackjack(){
    const h=hand,live=h&&!h.done,dis=b=>b?'disabled':'';
    const cards=(cs,hide)=>cs.map((c,i)=>hide&&i===1?'<div class="card back"></div>':
      `<div class="card ${'♥♦'.includes(c.s)?'red':''}">${'A23456789'[c.r-1]||['10','J','Q','K'][c.r-10]}<small>${c.s}</small></div>`).join('');
    return `<div class="panel bj">
      <div class="lbl">DEALER ${h&&!live?'· '+handVal(h.d):''}</div><div class="hand">${h?cards(h.d,live):''}</div>
      <div class="lbl">YOU ${h?'· '+handVal(h.p):''}</div><div class="hand">${h?cards(h.p):''}</div>
      <div class="row">WAGER <button data-act="wager" data-v="-10" ${dis(live)}>−</button><b class="wager">${wager}</b><button data-act="wager" data-v="10" ${dis(live)}>+</button>
        <button data-act="deal" ${dis(live)}>DEAL</button><button data-act="hit" ${dis(!live)}>HIT</button><button data-act="stand" ${dis(!live)}>STAND</button></div>
      <p class="dim">Dealer stands on 17 · wins pay 1:1 · Blackjack pays 3:2 and always pulls an item.<br>
        Item chance on a regular win at this wager: <b class="gold">${Math.round(itemChance(wager)*100)}%</b> · ${eligible('blackjack').length} items left in the blackjack pool · leans Rare & Legendary.</p></div>`;
  },
  loadout(){
    const g=game,owned=store.meta.relicsOwned.map(id=>ITEM[id]).filter(Boolean);
    return `<div class="panel wide"><div class="lbl">RELICS EQUIPPED ${g.relicsEquipped.length} / ${store.meta.relicSlots} · click to equip or unequip, free and instant</div>
      <div class="grid">${owned.length?owned.map(it=>card(it,g.relicsEquipped.includes(it.id)?'on':'','equip',
        `<button data-act="sell" data-v="${it.id}">SELL · +${Math.round(PRICES[it.tier]*RUN.sellRefund)}</button>`)).join(''):'<p class="dim">No relics yet. Win some at the tables or the shelf.</p>'}</div>
      <div class="lbl">CAPSULES IN YOUR RUN DROP POOL</div>
      <div class="caps">${store.meta.unlockedCapsules.map(k=>`<span><i class="cap" style="background:${T[CAPS[k].k]}">${CAPS[k].l}</i>${CAPS[k].n}</span>`).join('')}</div></div>`;
  },
  codex(){
    const u=ITEMS.filter(isUnlocked).length,o=ITEMS.filter(isOwned).length;
    return `<div class="panel wide"><div class="lbl">CODEX · FOUND ${u} / ${ITEMS.length} · OWNED ${o}</div><div class="grid codex">${ITEMS.map(it=>
      !isUnlocked(it)?`<div class="item locked"><b>?</b><p>${it.hint||''}</p></div>`:
      card(it,isOwned(it)?'':'dim','',isOwned(it)?'<em class="good">OWNED</em>':`<em>IN ${it.pool.join(' / ').toUpperCase()}</em>`)).join('')}</div></div>`;
  },
};
function renderCasino(){
  const g=game,tab=(id,n)=>`<button data-act="tab" data-v="${id}" class="${cTab===id?'on':''}">${n}</button>`;
  cov.classList.toggle('busy',busy);
  cov.innerHTML=`<div class="top"><h1>CASINO</h1>${tab('shelf','SHELF')}${tab('roulette','ROULETTE')}${tab('blackjack','BLACKJACK')}${tab('loadout','LOADOUT')}${tab('codex','CODEX')}
    <div class="chips">◉ ${fmt(g.chips)} <small>CHIPS</small></div></div>
    <div class="body">${CTABS[cTab]()}</div>
    <div class="foot"><div class="msg">${cMsg}</div><button class="go" data-act="leave">LEAVE  ·  LEVEL ${g.level+1} ▶</button></div>`;
}
const ACT={
  tab:v=>{cTab=v},stake:v=>{stake=+v},spin,deal,hit,stand,
  wager:v=>{wager=clamp(wager+ +v,10,200)},
  buyshelf:buyShelf,reroll:rerollShelf,sell:sellRelic,
  equip:id=>{
    const g=game,e=g.relicsEquipped,i=e.indexOf(id);
    if(i>=0)e.splice(i,1);else if(e.length<store.meta.relicSlots)e.push(id);else{cMsg='All relic slots are full — unequip one first.';return}
    equipRelics(e,g.mods);
  },
  leave:()=>{state='play';nextStage()},
};
cov.addEventListener('click',e=>{
  const el=e.target.closest('[data-act]');if(!el||busy||el.disabled)return;
  audioInit();sfx.menu();ACT[el.dataset.act](el.dataset.v);
  if(state==='casino'&&!busy)renderCasino();
});
// Codex is reachable from Options too (Casino itself is in-run only) — reuses the codex tab's markup
function openCodex(){
  state='codex';
  const s=cov.style;
  for(const k of['text','sub','label','a1','a2','gold','good','bad','panel'])s.setProperty('--'+k,T[k]);
  s.setProperty('--bg',T.bg[0]);s.setProperty('--head',T.head);s.setProperty('--body',T.body);s.setProperty('--hw',T.hw);
  cov.innerHTML=`<div class="top"><h1>CODEX</h1><div class="chips"></div></div><div class="body">${CTABS.codex()}</div>
    <div class="foot"><div class="msg"></div><button class="go" data-act="codexback">BACK · ESC</button></div>`;
}
const ACT_CODEX={codexback:()=>{state='options'}};
cov.addEventListener('click',e=>{
  if(state!=='codex')return;
  const el=e.target.closest('[data-act]');if(!el)return;
  audioInit();sfx.menu();(ACT_CODEX[el.dataset.act]||(()=>{}))();
});
function openCasino(){
  const g=game;state='casino';g.shelf=genShelf();g.rerolls=0;cTab='shelf';
  fire('casinoEntered',g);
  const s=cov.style;
  for(const k of['text','sub','label','a1','a2','gold','good','bad','panel'])s.setProperty('--'+k,T[k]);
  s.setProperty('--bg',T.bg[0]);s.setProperty('--head',T.head);s.setProperty('--body',T.body);s.setProperty('--hw',T.hw);
  cMsg=`Welcome to the house. ${g.relicsEquipped.length} relic${g.relicsEquipped.length===1?'':'s'} equipped.`;
  renderCasino();
}
