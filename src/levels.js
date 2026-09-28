'use strict';
// ================= levels =================
// The 6 handcrafted layouts below no longer back a Campaign mode — they're one of the
// generator's template families (a "handcrafted" chunk), reused verbatim or mirrored/shifted.
const LEVELS=[
 ['WARM UP',['..............','.111111111111.','.122222222221.','.12?111111?21.','.122222222221.','.111111111111.']],
 ['PYRAMID',['......33......','.....2222.....','....111111....','...11X11X11...','..1111111111..','.111111111111.','11111111111111']],
 ['INVADER',['...2.....2....','....2...2.....','...2222222....','..22.222.22...','.33333?33333..','.2.2222222.2..','.2.2.....2.2..','....22.22.....']],
 ['FORTRESS',['33333333333333','3............3','3.2222222222.3','3.2X111111X2.3','3.2222222222.3','3............3','SSSSSS..SSSSSS']],
 ['CHECKMATE',['4.4.4.4.4.4.4.','.3.3.3.3.3.3.3','2.2.2.X.2.2.2.','.1.1.1.1.1.1.1','1.1.?.1.1.?.1.','.2.2.2.2.2.2.2']],
 ['HEARTBREAKER',['...333..333...','..3333333333..','.322222222223.','.32222XX22223.','..3222222223..','...32222223...','....322223....','.....3223.....','......33......']],
];
LEVELS.forEach(([n,l])=>l.forEach(r=>console.assert(r.length===COLS,'bad row in',n,r)));

// ---------- procedural generator: pattern-family templates + variation + validation ----------
// each family(rng,{n,diff}) -> n row-strings of length COLS. Rows are built left-half + mirror,
// same convention as the old spawnRow/genLevel code (c<7, row[c]=row[13-c]).
function hpChar(rng,diff){return String(1+Math.floor(rng()*diff.maxHp))}
function fillRow(rng,diff,onFn){
  const row=Array(COLS).fill('.');
  for(let c=0;c<7;c++)if(onFn(c))row[c]=row[13-c]=hpChar(rng,diff);
  return row;
}
const FAMILIES={
  handcrafted(rng,{n,diff}){ // replays a chunk of a random handcrafted LEVELS layout
    const[,rows]=LEVELS[Math.floor(rng()*LEVELS.length)],out=[];
    for(let i=0;i<n;i++){
      const src=rows[i%rows.length];
      out.push(fillRow(rng,diff,c=>src[c]!=='.'&&rng()<diff.density+.2));
    }
    return out;
  },
  centralWall(rng,diff,n){const out=[];for(let i=0;i<n;i++)out.push(fillRow(rng,diff,c=>c>=2&&rng()<diff.density));return out},
  pillars(rng,diff,n){const out=[];for(let i=0;i<n;i++)out.push(fillRow(rng,diff,c=>c%2===0&&rng()<diff.density+.3));return out},
  checker(rng,diff,n){const out=[];for(let i=0;i<n;i++)out.push(fillRow(rng,diff,c=>(c+i)%2===0));return out},
  fortressRing(rng,diff,n){const out=[];for(let i=0;i<n;i++)out.push(fillRow(rng,diff,c=>i===0||i===n-1||c===0||rng()<diff.density*.5));return out},
  diagonalBands(rng,diff,n){const out=[];for(let i=0;i<n;i++)out.push(fillRow(rng,diff,c=>(c+i)%3!==0&&rng()<diff.density+.15));return out},
  vFunnel(rng,diff,n){const mid=(n-1)/2;const out=[];for(let i=0;i<n;i++)out.push(fillRow(rng,diff,c=>(6.5-c)+Math.abs(i-mid)*1.3<=7));return out},
};
const FAMILY_NAMES=Object.keys(FAMILIES);
function genChunk(rng,rows,diff){
  const name=FAMILY_NAMES[Math.floor(rng()*FAMILY_NAMES.length)];
  return name==='handcrafted'?FAMILIES.handcrafted(rng,{n:rows,diff}):FAMILIES[name](rng,diff,rows);
}
// steel/special injection, respecting steelOk-style isolation (never seals a cell off, see validator)
function injectSpecials(rows,rng,diff){
  let specialsLeft=diff.specialBudget;
  return rows.map((row,r)=>row.map((ch,c)=>{
    if(ch==='.')return ch;
    const x=rng();
    if(x<.03)return'X';
    if(x<.05)return'?';
    if(specialsLeft>0&&x<.05+diff.steelChance){
      const above=rows[r-1],left=row[c-1],right=row[c+1];
      const steelOk=c<6&&!(above&&above[c]==='S')&&!(above&&above[c-1]==='S')&&!(above&&above[c+1]==='S')&&left!=='S'&&right!=='S';
      if(steelOk){specialsLeft--;return'S'}
    }
    return ch;
  }));
}
// reachability: flood-fill from the open bottom edge through non-steel cells; every destructible
// brick must be reached, so steel (or the special bricks that ride along it) can never seal anything off
function validateLevel(rows,diff){
  const R2=rows.length;if(!R2)return false;
  let destructible=0,steelRowMax=0;
  for(const row of rows){
    let steel=0;for(const ch of row){if(ch!=='.'&&ch!=='S')destructible++;if(ch==='S')steel++}
    steelRowMax=Math.max(steelRowMax,steel/COLS);
  }
  if(destructible<8||steelRowMax>.5)return false;
  const reached=rows.map(row=>row.map(()=>false));
  const stack=[];
  for(let c=0;c<COLS;c++)if(rows[R2-1][c]!=='S'){reached[R2-1][c]=true;stack.push([R2-1,c])}
  while(stack.length){
    const[r,c]=stack.pop();
    for(const[dr,dc]of[[-1,0],[1,0],[0,-1],[0,1]]){
      const nr=r+dr,nc=c+dc;
      if(nr<0||nr>=R2||nc<0||nc>=COLS||reached[nr][nc]||rows[nr][nc]==='S')continue;
      reached[nr][nc]=true;stack.push([nr,nc]);
    }
  }
  for(let r=0;r<R2;r++)for(let c=0;c<COLS;c++)if(rows[r][c]!=='.'&&rows[r][c]!=='S'&&!reached[r][c])return false;
  return true;
}
// genRunLevel(level, runSeed) -> {rows[], rowBudget, descent, par}; regenerates with seed+1 on validator failure
function genRunLevel(level,runSeed,regen=0){
  const diff=difficulty(level),rng=rngFor(runSeed,level,regen);
  let rows=[],built=0;
  while(built<diff.rowBudget){
    const chunkRows=Math.min(diff.rowBudget-built,4+Math.floor(rng()*4));
    rows=rows.concat(genChunk(rng,chunkRows,diff));built+=chunkRows;
  }
  rows=injectSpecials(rows.slice(0,diff.rowBudget),rng,diff);
  if(!validateLevel(rows,diff)){
    if(regen>50)throw new Error('genRunLevel: no valid layout for level '+level);
    return genRunLevel(level,runSeed,regen+1);
  }
  return{rows:rows.map(r=>r.join('')),rowBudget:diff.rowBudget,descent:diff.descent,par:diff.par};
}
const rngFor=(runSeed,level,regen)=>rng(((runSeed^0)+level*104729+regen*7919)|0);
{ // self-check: 20 seeds x 40 levels all produce a valid layout
  for(let seed=0;seed<20;seed++)for(let lv=1;lv<=40;lv++){
    const g=genRunLevel(lv,seed*99991);
    console.assert(g.rows.length===difficulty(lv).rowBudget,'genRunLevel row count',seed,lv);
  }
}
function mkBrick(c,y,ch,r){
  const b={x:BX+c*BW,y,w:BW,h:BH,r,c,type:'n',hp:1};
  if(ch==='S'){b.type='s';b.hp=1e9}
  else if(ch==='X')b.type='x';
  else if(ch==='?')b.type='q';
  else if(ch==='$'){b.type='d';b.hp=2}
  else if(ch==='*'){b.type='m';b.hp=2}
  else if(ch==='!'){b.type='e';b.hp=6}
  else b.hp=+ch;
  b.max=b.hp;return b;
}
