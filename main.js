let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");


let tileSize=30;

let CIRCLE = 2*Math.PI;

function drawLine(x1,y1,x2,y2){
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

function draw(){
    ctx.fillStyle="#000";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    

    for (let y=0; y < map.length; y++){
        for (let x=0; x < map[y].length; x++){
            let t = map[y][x];
            let colors = [
                "#000",
                "#fff"
            ];
            ctx.fillStyle = colors[t];
            ctx.strokeStyle="#666";
            ctx.lineWidth = 2;
            ctx.strokeRect(x*tileSize, y*tileSize, tileSize, tileSize);
            ctx.fillRect(x*tileSize, y*tileSize, tileSize, tileSize);
        }
    }
    player.draw();
    drawRays(player);
}

function calcDegOffset(rad){
    let y = Math.sin(rad);
    let x = Math.cos(rad);

    return [x,y];
}
function normalize(val, max){
    
    if (val > max || val < 0){
        return val - Math.floor(val/max)*max;
    }
    if (val < 0){
        val = max-val;
    }
    
    return val;
}
class _Map {
    get(x,y){
        if (map[y]){
            return map[y][x] || 0;
        } else {
            return 0;
        }
    }
}
let GameMap = new _Map();

function drawRays(e){
    
    let [startx,starty] = e.getCenterPos();
    let fov = 1;
    for (let i=-fov/2; i < fov/2; i++){
        let r = normalize(e.dir,CIRCLE) + DR*i;

        let [x,y] = [startx,starty];
        let hit = false;
        let iter = 0;
        let stepSize = tileSize;

        let hx;
        let hy;

        while(!hit && iter < 25){
            var [tx, ty] = [Math.floor(x/tileSize),Math.floor(y/tileSize)];

            

            let [ox,oy] = calcDegOffset(r);

            /* circle
               __
             /    \
        PI->|      | <-0
             \ __ /

            */

            
            
            let [Tx,Ty] = [Math.floor(x/tileSize)*tileSize, Math.floor(y/tileSize)*tileSize];
            let [rx,ry] = [x-Tx,y-Ty];

            
            let minadd = 0.1;
            x-= minadd;
            y-=minadd;

            let tau = Math.PI/2;
            let _3P2 = 3*Math.PI/2;

            let hits = [];

            /* if (r != 0 && r != Math.PI){ //up down
                let d = r > Math.PI ? 1 : -1;

                let pointToLineDist = r > Math.PI ? ry : tileSize-ry;
                let otherDist = (1/Math.tan(r))*pointToLineDist;                

                let dy = y-(pointToLineDist*d);
                let dx = x-(otherDist*d);

                x=dx;
                y=dy-(minadd*d);
            } */
            if (r != 0 && r != Math.PI){ //left right
                let d = r>tau && r<_3P2 ? 1 : -1;

                let pointToLineDist = (r>tau && r<_3P2) ? rx : tileSize-rx;
                let otherDist = (Math.tan(r))*pointToLineDist;

                let dx = x-(pointToLineDist*d);
                let dy = y-(otherDist*d);

                x=dx-(minadd*d);
                y=dy;
            }
            var [tx, ty] = [Math.floor(x/tileSize),Math.floor(y/tileSize)];
            if (GameMap.get(tx,ty) > 0){
                hit = true;
                hx = x;
                hy = y;
                break;
            }
            

            iter++;
        }
        if (hit){
            ctx.lineWidth = 1;
            ctx.strokeStyle = "#0f0";
            drawLine(startx,starty,hx,hy);
            /* console.log(startx,starty,hx,hy) */
        }
    }
}

class Player {
    x = 3;
    y = 5;
    width = 20;
    height = 20;
    dir = -Math.PI/2;

    getCenterPos(){
        let [dx,dy] = [this.x*tileSize,this.y*tileSize];
        let [w,h] = [this.width, this.height]
        let [cx,cy] = [dx+w/2,dy+h/2]
        return [cx,cy];
    }

    draw(){
        ctx.fillStyle="#f0f";
        let [dx,dy] = [this.x*tileSize,this.y*tileSize];
        let [w,h] = [this.width, this.height]
        ctx.fillRect(dx,dy, w,h);
        
        let [cx,cy] = [dx+w/2,dy+h/2]

        let [ox,oy] = calcDegOffset(player.dir);
        let lineLength = 30;

        ctx.lineWidth = 5;
        ctx.strokeStyle = "#f0f";
        
        drawLine(cx,cy,cx+ox*lineLength,cy+oy*lineLength);
    }
    speed = 10;
}
let player = new Player();

let keyMap = new Map();

onkeyup = function(e){
    keyMap.set(e.keyCode,false);
}
onkeydown = function(e){
    let k = e.keyCode;
    keyMap.set(k,true);
}

let DR = 0.01745329252;

function calc(){
    for (let e of keyMap.entries()){
        let [k, value] = e;
        if (value == true){
            let c = String.fromCharCode(k).toLowerCase();
            let turnspeed = 5;
            let [ox,oy] = calcDegOffset(player.dir);
            let map = {
                "w":()=>{
                    player.x += ox*1/player.speed;
                    player.y += oy*1/player.speed;
                },
                "s":()=>{
                    player.x -= ox*1/player.speed;
                    player.y -= oy*1/player.speed;
                },
                "a":()=>{
                    player.dir -= turnspeed*DR;
                },
                "d":()=>{
                    player.dir += turnspeed*DR;
                },
            }
            //console.log(c);
            if (map[c]){
                map[c]();
            }
        }
        
    }
}

function loop(){
    draw();
    calc();
    requestAnimationFrame(loop);
}
function resiz(){
    canvas.width = window.innerWidth*window.devicePixelRatio;
    canvas.height = window.innerHeight*window.devicePixelRatio;
}


let map = [
    [1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,1],
    [1,1,1,0,0,1,0,1],
    [1,0,0,0,0,1,0,1],
    [1,0,0,0,1,1,0,1],
    [1,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1],
]

function init(){
    resiz();
    loop();
}
init();


window.onresize = function(){
    console.log("resize");
    resiz();
}