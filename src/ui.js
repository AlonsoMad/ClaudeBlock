'use strict';
// ================= input =================
const keys={};
function press(e){
  const c=e.code,up=c==='ArrowUp'||c==='KeyW',dn=c==='ArrowDown'||c==='KeyS',lf=c==='ArrowLeft'||c==='KeyA',rt=c==='ArrowRight'||c==='KeyD';
  const ok=c==='Enter'||c==='Space'||c==='NumpadEnter',back=c==='Escape'||c==='Backspace';
  if(state==='entry'){
    if(c==='Enter'||c==='NumpadEnter'){
      const g=game,name=entryName.trim()||'PLAYER';store.name=name;
      lastRank=addEntry(g.mode,{name,score:g.score,level:g.endless?g.wave:g.level,combo:g.bestCombo,date:today(),win:g.won});
      recTab=MODES.indexOf(g.mode);afterGame=true;state='records';
    }else if(c==='Backspace')entryName=entryName.slice(0,-1);
    else if(/^[a-z0-9 ._-]$/i.test(e.key)&&entryName.length<10)entryName+=e.key.toUpperCase();
    return;
  }
  if(c==='KeyM'){toggleMute();return}
  switch(state){
    case'menu':
      if(up||dn){menuIdx=(menuIdx+(up?-1:1)+MENU.length)%MENU.length;sfx.menu()}
      else if(ok){
        sfx.select();
        [()=>newGame('campaign'),()=>newGame('endless'),()=>newGame('daily'),openCasino,()=>{state='howto'},
         ()=>{themeIdx=THEMES.indexOf(T);state='themes'},()=>{optIdx=0;state='options'},
         ()=>{recTab=0;afterGame=false;lastRank=-1;state='records'}][menuIdx]();
      }
      break;
    case'howto':if(back||ok)state='menu';break;
    case'themes':
      if(up||dn){themeIdx=(themeIdx+(up?-1:1)+THEMES.length)%THEMES.length;setTheme(THEMES[themeIdx]);sfx.menu()}
      else if(ok){store.theme=T.id;save();sfx.select();state='menu'}
      else if(back){setTheme(baseTheme());state='menu'}
      break;
    case'options':
      if(up||dn){optIdx=(optIdx+(up?-1:1)+OPTS.length)%OPTS.length;sfx.menu()}
      else if(ok||lf||rt){const k=OPTS[optIdx][1];if(k){store.opt[k]=!store.opt[k];save();sfx.select()}else if(ok)state='menu'}
      else if(back)state='menu';
      break;
    case'records':
      if(lf||rt){recTab=(recTab+(lf?3:1))%4;sfx.menu()}
      else if(c==='KeyR'&&afterGame)newGame(lastMode);
      else if(c==='KeyC'&&afterGame&&lastMode==='endless')openCasino();
      else if(back||ok)state='menu';
      break;
    case'play':
      if(c==='Space')launch();
      else if(c==='ShiftLeft'||c==='ShiftRight'||c==='ArrowUp'||c==='KeyW')overdrive();
      else if(c==='KeyP'||c==='Escape')state='pause';
      break;
    case'casino':if(c==='Escape')state='menu';break;
    case'pause':if(c==='KeyP'||c==='Escape'||c==='Space')state='play';else if(c==='KeyQ')gameOver();break;
    case'over':
      if(overT>0)break;
      if(qualifies(game.mode,game.score)){entryName=store.name;state='entry'}
      else if(c==='KeyR')newGame(lastMode);
      else if(c==='KeyC'&&game.mode==='endless')openCasino();
      else{recTab=MODES.indexOf(game.mode);afterGame=true;lastRank=-1;state='records'}
  }
}
addEventListener('keydown',e=>{
  if(['Space','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Backspace'].includes(e.code))e.preventDefault();
  audioInit();keys[e.code]=true;
  if(!e.repeat||(state==='entry'&&e.code==='Backspace'))press(e);
});
addEventListener('keyup',e=>{keys[e.code]=false});
function autoPause(){for(const k in keys)keys[k]=false;if(state==='play')state='pause'}
addEventListener('blur',autoPause);
document.addEventListener('visibilitychange',()=>{if(document.hidden)autoPause()});
