'use strict';
// ================= input =================
const keys={};
function press(e){
  const c=e.code,up=c==='ArrowUp'||c==='KeyW',dn=c==='ArrowDown'||c==='KeyS',lf=c==='ArrowLeft'||c==='KeyA',rt=c==='ArrowRight'||c==='KeyD';
  const ok=c==='Enter'||c==='Space'||c==='NumpadEnter',back=c==='Escape'||c==='Backspace';
  if(state==='entry'){
    if(c==='Enter'||c==='NumpadEnter'){
      const g=game,name=entryName.trim()||'PLAYER';store.name=name;
      lastRank=addEntry(g.mode,{name,score:g.score,level:g.level,combo:g.bestCombo,date:today(),win:g.won});
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
        [()=>newGame('endless'),()=>newGame('daily'),()=>{optIdx=0;state='options'},
         ()=>{recTab=0;afterGame=false;lastRank=-1;state='records'}][menuIdx]();
      }
      break;
    case'options':
      if(up||dn){optIdx=(optIdx+(up?-1:1)+OPTIONS_MENU.length)%OPTIONS_MENU.length;sfx.menu()}
      else if(ok){
        const dest=OPTIONS_MENU[optIdx][1];sfx.select();
        if(!dest)state='menu';
        else if(dest==='codex')openCodex();
        else{optIdx=0;state=dest}
      }else if(back)state='menu';
      break;
    case'opt-audio':case'opt-video':{
      const list=state==='opt-audio'?OPTS_AUDIO:OPTS_VIDEO;
      if(up||dn){optIdx=(optIdx+(up?-1:1)+list.length)%list.length;sfx.menu()}
      else if(ok||lf||rt){
        const k=list[optIdx][1];
        if(k==='theme'){themesReturnTo=state;themeIdx=THEMES.indexOf(T);state='themes'}
        else if(k){store.opt[k]=!store.opt[k];save();sfx.select()}
        else if(ok){optIdx=OPTIONS_MENU.findIndex(o=>o[1]===(state==='opt-audio'?'opt-audio':'opt-video'));state='options'}
      }else if(back){optIdx=OPTIONS_MENU.findIndex(o=>o[1]===(state==='opt-audio'?'opt-audio':'opt-video'));state='options'}
      break;
    }
    case'opt-controls':if(back||ok){optIdx=2;state='options'}break;
    case'codex':if(back)state='options';break;
    case'themes':
      if(up||dn){themeIdx=(themeIdx+(up?-1:1)+THEMES.length)%THEMES.length;setTheme(THEMES[themeIdx]);sfx.menu()}
      else if(ok){store.theme=T.id;save();sfx.select();state=themesReturnTo}
      else if(back){setTheme(baseTheme());state=themesReturnTo}
      break;
    case'records':
      if(lf||rt){recTab=(recTab+(lf?TABS.length-1:1))%TABS.length;sfx.menu()}
      else if(c==='KeyR'&&afterGame)newGame(lastMode);
      else if(back||ok)state='menu';
      break;
    case'reward':
      if(lf||rt){game.rewardSel=(game.rewardSel+(lf?-1:1)+game.rewardOptions.length)%game.rewardOptions.length;sfx.menu()}
      else if(ok)pickReward(game.rewardSel);
      else if(['Digit1','Digit2','Digit3'].includes(c))pickReward(+c.slice(-1)-1);
      break;
    case'play':
      if(c==='Space')launch();
      else if(c==='ShiftLeft'||c==='ShiftRight'||c==='ArrowUp'||c==='KeyW')overdrive();
      else if(c==='KeyP'||c==='Escape')state='pause';
      break;
    case'casino':if(c==='Escape')gameOver();break;
    case'pause':if(c==='KeyP'||c==='Escape'||c==='Space')state='play';else if(c==='KeyQ')gameOver();break;
    case'over':
      if(overT>0)break;
      if(qualifies(game.mode,game.score)){entryName=store.name;state='entry'}
      else if(c==='KeyR')newGame(lastMode);
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
