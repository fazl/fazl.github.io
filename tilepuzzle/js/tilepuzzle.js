const GameMode = {
  SHUFFLE : 1,
  PLAY : 2,
  SOLVE : 3
}

let buttons;
let btnSolveGame;
let btnNewGame;
let inputNewSize;
let clickedList; // list of tiles clicked over time
let gameStatus;
let gameStatus2;
let mode = GameMode.SHUFFLE;
let nMoves = 0;
let solvableMoves = 0;

// global error handler
// see https://stackoverflow.com/a/10556743/7409029
// Could report error via ajax to track pages with issues!
window.onerror = function(msg, url, line, col, error) {
   // Note col & error new to HTML 5
   let extra = !col ? '' : '\ncolumn: ' + col;
   extra += !error ? '' : '\nerror: ' + error;

   alert("Error: " + msg + "\nurl: " + url + "\nline: " + line + extra);

   let suppressErrorAlert = false;
   // If you return true, then error alerts (like in older versions of
   // Internet Explorer) will be suppressed.
   return suppressErrorAlert;
};

//From T.J.Crowder https://stackoverflow.com/a/15313435/7409029
function assert(condition, message) {
    if (!condition) {
        message = message || "Assertion failed";
        if (typeof Error !== "undefined") {
            throw new Error(message);
        }
        throw message; // Fallback
    }
}

// (bitwise-not)x2 truncates float to int see stackoverflow
function int(val){ return ~~val; }

function checkGameWon(){
  for(let i = 0; i<buttons.length; i++){

    if( 1+i != 0+(buttons[i].textContent)){
      // found a button in wrong position
      return false;
    }
  }

  console.log(`All tiles in place - Game over - phew!`);
  deactivateButtons();
  setGameOverStatus(gameStatus);
}

function displaySolvableMoves(solvableDisplayElem, solvableMoves){
    solvableDisplayElem.innerText = `Solvable in: ${solvableMoves} moves`;
}

function setGameOverStatus(cont){
  const bink = document.createElement('blink');
  bink.innerText = `Won in ${nMoves} moves!`;
  cont.innerText = ``;
  cont.append(bink);
}

// Want to waste 15mins scratching your head? Just
// omit the () brackets in the HTML element registering
// the click handler thus: onclick="genGameTable"
// It's a lot of fun...
//
function genGameTable(event){
  let size = document.getElementById("id-size").value;
  size = Math.min(Math.max(size, 3), 9); //credit: https://stackoverflow.com/q/5842747/7409029
  console.log(`genGameTable() new size: ${size}`);
  const body = document.getElementById("game-table-body");
  const rows = body.children;
  /*
  //Useful scaffolding
  for(let r = 0; r<rows.length; ++r){
    let row=rows[r];
    console.log(`row ${r} : ${row}`);
    let tds=row.children;
    for(let d = 0; d<tds.length; ++d){
      let td=tds[d];
      //td.firstChild is contained button
      console.log(`\telem ${d} : ${td} value: ${td.firstChild.value}`);
    }
  }
  */

  // clear existing table body
  for(let r=rows.length; r>0; --r){
    console.debug(`Remove row ${r} from body`);
    body.removeChild(rows[r-1]);
  }

  // repopulate with `size x size` grid
  // create `size` rows, each with `size` buttons
  // give each button style 'gametile'
  // ?? Could add labels here too, currently done in initGame ??
  for(let r = 0; r<size; ++r){
    let row=document.createElement("tr");
    console.log(`New row ${r} : ${row}`);
    for(let d = 0; d<size; ++d){
      let td=document.createElement("td");
      let btn=document.createElement("button");
      btn.classList.add('gametile');
      btn.value=`col=${d},row=${r}`;
      btn.idx = rowCol2Index(r,d,size);
      btn.value = `col=${d},row=${r}`;
      btn.classList.add( (btn.idx+1)<(size*size) ? 'active' : 'hole');
      btn.textContent = btn.idx+1;
      td.append(btn);
      console.log(`\telem ${d} : ${td} value: ${td.firstChild.value}`);
      row.append(td);
    }

    body.append(row);
  }

  initGame(event);
}

// index of cell in grid
function xysize2index(x,y,size){
  if( 0<size &&
      (0<=x && x<size) &&
      (0<=y && y<size) ){

      return (y*size)+x;
  }
  throw `Bad x,y,size combo ${x},${y},${size}`;
}

// To understand the code, review the html structure first
// Then follow initGame() esp the code setting onclick.
// closure per button (with own row / col value)
//
// caveat1: getElementsByTagName() before page loads, finds no buttons
//
function initGame(event){
  console.log(`initGame(event=${event.type})`);
  clickedList = [];
  buttons = document.getElementsByClassName('gametile');
  btnSolveGame = document.getElementById('id-solve-game');
  btnNewGame = document.getElementById('id-new-game');
  inputNewSize = document.getElementById('id-size');

  const SIDE = Math.sqrt(buttons.length);
  let prevHoleIdx = -1; // safe initial value
  mode = GameMode.SHUFFLE;
  for (let i = 0 ; i < buttons.length ; i++){
    (function(label,btn){
      btn.onclick=function(){ // handle game logic
        console.log(`Clicked on ${btn.textContent} at idx ${btn.idx} coords ${btn.value}`);
        const holeIdx = findHoleIndex(buttons);
        const btnLine=btnsBetween(btn.idx, holeIdx, SIDE);
        console.debug(`Btns (inclusive) between ${btn.textContent} at idx ${btn.idx} and hole: ${btnLine}`);

        let canMove = (btnLine!==null);
        console.debug(`Btn ${btn.textContent} at idx ${btn.idx} ${canMove?'CAN':'CANT'} move towards hole`);

        if(mode===GameMode.SHUFFLE){
          if(btn.idx === prevHoleIdx){
            console.debug(`Prevent hole back-tracking to ${btn.value} during shuffling`);
            canMove = false;
          }
        }

        if( canMove ){
          let hIdx = holeIdx;
          for (let i = 1 ; i < btnLine.length ; i++){ // 1: skip hole
            const lineBtnIdx = btnLine[i];
            let lineBtn = buttons[ lineBtnIdx ];
            swapTileProperties(lineBtn,buttons[hIdx]);
            if (mode !== GameMode.SOLVE) {
              clickedList.push(hIdx);
              gameStatus.innerText = `Moves: ${++nMoves}`;
            }
            prevHoleIdx = hIdx;
            hIdx = lineBtnIdx;
          }
          if(mode===GameMode.PLAY){ // Prevent shuffling from winning game accidentally
            checkGameWon();
          }
        }
      };
    })(i+1, buttons[i] );

  }//for i

  gameStatus = document.getElementById('gameStatus');
  gameStatus2 = document.getElementById('gameStatus2');

  randomiseGame();
  solvableMoves = nMoves;
  displaySolvableMoves(gameStatus2, solvableMoves);
  mode = GameMode.PLAY;
  nMoves=0;
  gameStatus.innerText = `Moves: 0`;
}

// Walk buttons, return index of button with hole class
function findHoleIndex(arrBtns){
  let i;
  for( i = 0; i<arrBtns.length; ++i){
    if( arrBtns[i].classList.contains('hole') ){
      return i;
    }
  }

  throw `Logic error.. 0/${i} button/tiles has 'hole' class `;
}

// return a list of (indexes of) buttons to click between hole
// and button at the supplied index, to move them all
// (return an empty list if appropriate).
//
function btnsBetween(btnIdx, holeIdx, SIDE){
  btnRow = index2Row(btnIdx, SIDE);
  btnCol = index2Col(btnIdx, SIDE);
  holeRow = index2Row(holeIdx, SIDE);
  holeCol = index2Col(holeIdx, SIDE);
  console.debug( `btn at idx ${btnIdx} at (${btnCol},${btnRow}), hole at (${holeCol},${holeRow})` );

  const align = areAligned( btnIdx, holeIdx, SIDE);
  if( "SAMEROW" === align ){
    let btns = [];
    console.debug(`walk from hole to btn in row`);
    const distance = btnCol - holeCol;
    const direction = Math.sign(distance);
    console.debug(`Hole to button distance: ${Math.abs(distance)}, direction: ${direction}`);
    for(let i = 0; i<=Math.abs(distance); i++ ){
      let col = holeCol+(i*direction);
      console.debug(`Step ${i}: col=${col}`);
      btns.push(rowCol2Index(btnRow,col,SIDE));
    }
    return btns;
  } else if( "SAMECOL" === align ){
    let btns = [];
    console.debug(`walk from hole to btn in col`);
    const distance = btnRow - holeRow;
    //const direction = (distance<0)?-1:(distance>0)?1:0;
    const direction = Math.sign(distance);
    console.debug(`Hole to button distance: ${Math.abs(distance)}, direction: ${direction}`);
    for(let i = 0; i<=Math.abs(distance); i++ ){
      let row = holeRow+(i*direction);
      console.debug(`Step ${i}: row=${row}`);
      btns.push(rowCol2Index(row,btnCol,SIDE));
    }
    return btns;
  }
  return null;
}

// return whether cells at supplied indices
// are aligned horizontally ('SAMEROW'),
// or vertically ('SAMECOL'),
// or not ('').
//
function areAligned(btnIdx, holeIdx, SIDE){

  btnRow = index2Row(btnIdx, SIDE);
  holeRow = index2Row(holeIdx, SIDE);
  if( btnRow === holeRow ){
    console.debug( `btn at idx ${btnIdx} same row as hole` );
    return "SAMEROW";
  }
  btnCol = index2Col(btnIdx, SIDE);
  holeCol = index2Col(holeIdx, SIDE);
  if ( btnCol === holeCol ){
    console.debug( `btn at idx ${btnIdx} same col as hole` );
    return "SAMECOL";
  }

  console.debug( `btn at idx ${btnIdx} not aligned with hole` );
  return "";
}
// return true if cells at supplied indices adjacent
// horiz adjacent: same row, cols differ by 1
// vert adjacent: same col, rows differ by 1
// so need row/col methods..
function isNeighbour(btnIdx, holeIdx, SIDE){
  btnRow = index2Row(btnIdx, SIDE);
  btnCol = index2Col(btnIdx, SIDE);
  holeRow = index2Row(holeIdx, SIDE);
  holeCol = index2Col(holeIdx, SIDE);
  console.debug( `btn at idx ${btnIdx} at (${btnCol},${btnRow}), hole at (${holeCol},${holeRow})` );

  if( btnRow === holeRow ){
    if( Math.abs(btnCol-holeCol) == 1 ){
      return true;
    }
  } else if ( btnCol === holeCol ){
    if( Math.abs(btnRow-holeRow) == 1){
      return true;
    }
  }

  return false;
}

//SIDE count of rows or cols
function index2Row( idx, SIDE ){
  return int(idx/SIDE);
}

//SIDE count of rows or cols
function index2Col( idx, SIDE ){
  return idx%SIDE;
}

//SIDE count of rows or cols
function rowCol2Index( row, col, SIDE ){
  return (row*SIDE)+col;
}

// Rather not walk table body, do td.append(btn) at destinations..
//
// Simpler to morph btn into a hole, and vice versa??
function swapTileProperties(btn,hole){
    hole.classList.remove('hole');
    hole.classList.add('active');
    btn.classList.remove('active');
    btn.classList.add('hole');

    let tmp = ""+btn.value;
    btn.value=hole.value;
    hole.value=tmp;

    tmp = btn.textContent;
    btn.textContent = hole.textContent;
    hole.textContent = tmp;
}
function deactivateButtons(){
  [btnSolveGame].forEach(elem => elem.disabled=true);
  // HTMLCollection -> array
  [].slice.call( buttons ).forEach( (btn) => {
    btn.onclick=null;

    if (btn.classList.contains('active')){
      btn.classList.remove('active');
      btn.classList.add('gameover');
    }
  });
}

// Find hole; click a random neighbour; repeat
function randomiseGame(){
  const SIDE = int(Math.sqrt(buttons.length));
  for(let i = 1; i<42; ){
    let holeIdx = findHoleIndex(buttons);
    let neighbIndex = getRandomNeighbour(holeIdx,SIDE);
    assert(neighbIndex != holeIdx, "Got hole back from getRandomNeighbour(holeIdx,SIDE)");
    (buttons[neighbIndex]).onclick();
    ++i;
  }
  console.debug(`Click-to-solve  list: ${clickedList}`)
}

function getRandomNeighbour(index,SIDE){
  const row = index2Row(index,SIDE);
  const col = index2Col(index,SIDE);
  let neighbRow = row;
  let neighbCol = col;
  	  if(0 == randomInclusive(0,1)){
    neighbCol = getRandomAdjacent(col,SIDE);
  	  }else{
    neighbRow = getRandomAdjacent(row,SIDE);
  	  }
  return neighbCol + SIDE*neighbRow;
}

function getRandomAdjacent(pos,SIDE){
  const delta = randomInclusive(0,1)*2-1;
  let adjPos = pos + delta;
  if(adjPos<0 || SIDE<=adjPos){
    adjPos = pos - delta;
  }
  return adjPos;
}

//Adapted from https://stackoverflow.com/a/7228322/7409029
function randomInclusive(min, max) { // min and max included
  const amp = max - min + 1;
  const r = int(Math.random() * amp) + min;
  console.debug(`randomInclusive(${min},${max})->${r}`);
  return r;
}

async function solveGame(){
  console.debug(`solveGame()`);
  if ( clickedList.length == 0 ){
    console.debug(`Nothing to solve!`);
    return;
  }
  mode=GameMode.SOLVE;
  [btnNewGame,btnSolveGame,inputNewSize].forEach(elem => elem.disabled=true);
  for(let i = clickedList.length-1; i>=0; --i){
    const idx = clickedList[i];
    const btn = buttons[idx];
    btn.onclick();
    await new Promise(r => setTimeout(r, 300)); // sleep
    clickedList.pop();
  }
  [btnNewGame,btnSolveGame,inputNewSize].forEach(elem => elem.disabled=false);
  mode=GameMode.PLAY;
}
// see caveat1 above; 'load' would delay till images loaded
addEventListener("DOMContentLoaded", genGameTable);
