'use strict';
// ================= levels =================
const LEVELS=[
 ['WARM UP',['..............','.111111111111.','.122222222221.','.12?111111?21.','.122222222221.','.111111111111.']],
 ['PYRAMID',['......33......','.....2222.....','....111111....','...11X11X11...','..1111111111..','.111111111111.','11111111111111']],
 ['INVADER',['...2.....2....','....2...2.....','...2222222....','..22.222.22...','.33333?33333..','.2.2222222.2..','.2.2.....2.2..','....22.22.....']],
 ['FORTRESS',['33333333333333','3............3','3.2222222222.3','3.2X111111X2.3','3.2222222222.3','3............3','SSSSSS..SSSSSS']],
 ['CHECKMATE',['4.4.4.4.4.4.4.','.3.3.3.3.3.3.3','2.2.2.X.2.2.2.','.1.1.1.1.1.1.1','1.1.?.1.1.?.1.','.2.2.2.2.2.2.2']],
 ['HEARTBREAKER',['...333..333...','..3333333333..','.322222222223.','.32222XX22223.','..3222222223..','...32222223...','....322223....','.....3223.....','......33......']],
];
LEVELS.forEach(([n,l])=>l.forEach(r=>console.assert(r.length===COLS,'bad row in',n,r)));

// procedural sectors beyond the handcrafted ones; seeded so sector N is always the same
function genLevel(n,seed=n){
  const Rn=rng(seed*7919),rows=Math.min(12,6+Math.floor(n/3)),maxHp=Math.min(4,1+Math.floor(n/4));
  const shape=Math.floor(Rn()*5),dens=.55+Rn()*.3,mid=(rows-1)/2,grid=[];let count=0;
  for(let r=0;r<rows;r++){
    const row=Array(COLS).fill('.');
    for(let c=0;c<7;c++){
      let on=[Rn()<dens,r%3!==2,(6.5-c)+Math.abs(r-mid)*1.3<=7,(c+r)%2===0,c%3!==1][shape];
      if(shape&&Rn()<.12)on=!on;
      if(!on)continue;
      let ch=String(clamp(maxHp-Math.floor(r*maxHp/rows)+(Rn()<.3?-1:0),1,4));
      const x=Rn();
      // ponytail: steel only as isolated singletons (never at the mirror seam) so nothing can be sealed off
      const steelOk=c<6&&[[r-1,c-1],[r-1,c],[r-1,c+1],[r,c-1]].every(([a,b])=>!(grid[a]&&grid[a][b]==='S')&&!(a===r&&row[b]==='S'));
      if(x<.04)ch='X';else if(x<.06)ch='?';else if(n>=8&&steelOk&&x<.06+Math.min(.1,n*.006))ch='S';
      row[c]=row[13-c]=ch;if(ch!=='S')count+=c===6?1:2;
    }
    grid.push(row);
  }
  if(count<16)return genLevel(n,seed+1000);
  return['SECTOR '+n,grid.map(r=>r.join(''))];
}
function mkBrick(c,y,ch,r){
  const b={x:BX+c*BW,y,w:BW,h:BH,r,c,type:'n',hp:1};
  if(ch==='S'){b.type='s';b.hp=1e9}else if(ch==='X')b.type='x';else if(ch==='?')b.type='q';else b.hp=+ch;
  b.max=b.hp;return b;
}
