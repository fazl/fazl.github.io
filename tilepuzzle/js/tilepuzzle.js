let buttons = null;
let gameStatus = null;
let gameStatus2 = null;
let nMoves = 0;
let shuffleMode = true;

// global error handler
// see https://stackoverflow.com/a/10556743/7409029
// Could report error via ajax to track pages with issues!
window.onerror = function(msg, url, line, col, error) {
   // Note col & error new to HTML 5
   var extra = !col ? '' : '\ncolumn: ' + col;
   extra += !error ? '' : '\nerror: ' + error;

   alert("Error: " + msg + "\nurl: " + url + "\nline: " + line + extra);

   var suppressErrorAlert = false;
   // If you return true, then error alerts (like in older versions of
   // Internet Explorer) will be suppressed.
   return suppressErrorAlert;
};

// (bitwise-not)x2 truncates float to int see stackoverflow
function int(val){ return ~~val; }

function checkGameWon(){
  //const buttons = document.getElementsByTagName('button');
  for(let i = 0; i<buttons.length; i++){

    if( 1+i != +(buttons[i].textContent)){
      // found a button in wrong position
      return false;
    }
  }

  console.log(`All tiles in place - Game over - phew!`);
  deactivateButtons();
  setGameOverStatus(gameStatus);
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
  if(size<3){
    size = 3;
  }else if(9<size){
    size = 9;
  }
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
  for(let r = 0; r<size; ++r){
    let row=document.createElement("tr");;
    console.log(`New row ${r} : ${row}`);
    for(let d = 0; d<size; ++d){
      let td=document.createElement("td");
      let btn=document.createElement("button");
      btn.classList.add('gametile');
      btn.value=`col=${d},row=${r}`;
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
  //buttons = Array.from(document.getElementsByTagName('button'));
  buttons = document.getElementsByClassName('gametile');
  // remove resizer button
  //buttons.splice(0,1);
  
  const SIDE = Math.sqrt(buttons.length);
  let prevHoleIndex = -1; // safe initial value
  shuffleMode = true;
  for (let i = 0 ; i < buttons.length ; i++){
    (function(label,btn,row,col){
      btn.idx = label - 1;
      btn.value = `col=${col},row=${row}`;
      btn.classList.add(label<buttons.length ? 'active' : 'hole');
      btn.textContent = label;
      btn.onclick=function(){ // handle game logic
        console.log(`Clicked on ${btn.textContent} at idx ${btn.idx} coords ${btn.value}`);
        let holeIndex = findHoleIndex(buttons);
        let canMove = isNeighbour(btn.idx, holeIndex, SIDE);
        console.debug(`Btn ${btn.textContent} at idx ${btn.idx} ${canMove?'IS':'NOT'} next to hole`);
        if(shuffleMode){
          if(btn.idx === prevHoleIndex){
            console.debug(`Prevent hole back-tracking to ${btn.value} during shuffling`);
            canMove = false;
          }
        }
        if( canMove ){
          swapTileProperties(btn,buttons[holeIndex]);
          gameStatus.innerText = `Moves: ${++nMoves}`;
          prevHoleIndex = holeIndex
          if(!shuffleMode){ // Prevent shuffling from winning game accidentally
            checkGameWon();
          }
        }
      };
    })(i+1, buttons[i], int((i/SIDE)), int((i%SIDE)));

  }//for i

  gameStatus = document.getElementById('gameStatus');
  gameStatus2 = document.getElementById('gameStatus2');

  randomiseGame();
  gameStatus2.innerText = `Solvable in: ${nMoves} moves`;
  shuffleMode = false;
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
  [].slice.call( // HTMLCollection -> array
    document.getElementsByClassName('gametile')
  ).forEach( (btn) => {
    btn.onclick=null;
    btn.classList.remove('active');
  });
}

// Find hole; choose click a neighbour at random; repeat
function randomiseGame(){
  //const buttons = document.getElementsByTagName('button');
  const SIDE = int(Math.sqrt(buttons.length));
  for(let i = 1; i<42; ){
    let holeIndex = findHoleIndex(buttons);
    let neighbIndex = getRandomNeighbour(holeIndex,SIDE);
    if(neighbIndex != holeIndex){
      (buttons[neighbIndex]).onclick();
      ++i;
    }else{
      // throw `Oops, neighbIndex: ${neighbIndex} = holeIndex: ${holeIndex}`;
    }
  }
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
  delta = randomInclusive(-1,1);
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

// see caveat1 above; 'load' would delay till images loaded
addEventListener("DOMContentLoaded", initGame);
