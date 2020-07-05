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
    let fov = 60;
    for (let i=-fov/2; i < fov/2; i+=1){
        function rayCast(horizontal){
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

                if (r != 0 && r != Math.PI && horizontal){ //up down
                    let d = r > Math.PI ? 1 : -1;

                    let pointToLineDist = r > Math.PI ? ry : tileSize-ry;
                    let otherDist = (1/Math.tan(r))*pointToLineDist;                

                    let dy = y-(pointToLineDist*d);
                    let dx = x-(otherDist*d);

                    x=dx;
                    y=dy-(minadd*d);
                }
                if (r != 0 && r != Math.PI && !horizontal){ //left right
                    let d = 0;
                    if (r>tau && r<_3P2){
                        d=1;
                    } else if (r<tau || r > _3P2){
                        d=-1;
                    }


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
                return {
                    x:hx,
                    y:hy,
                }
            }
        }
        let horizontal = rayCast(true);
        let vertical = rayCast(false);

        function calcDistance(hit){
            if (hit == undefined){
                return Infinity;
            }

            function diff(a,b){
                a = Math.abs(a);
                b = Math.abs(b);
                return a > b ? a-b : b-a;
            }
            let {x,y} = hit;
            let xDiff = diff(startx,x);
            let yDiff = diff(starty,y);
            let d = Math.sqrt(Math.pow(xDiff,2),Math.pow(yDiff),2);
            return d;
        }
        if (horizontal == undefined && vertical == undefined){

        } else {
            let hit = calcDistance(horizontal) < calcDistance(vertical) ? horizontal : vertical;
            ctx.lineWidth = 1;
            ctx.strokeStyle = "#0f0";

            let angleDiff = Math.abs(DR*i);

            let dist = calcDistance(hit)*Math.cos(angleDiff);

            let isHorizontal = hit == horizontal;

            let screenHeight = 320;
            let screenWidth = 480;
            let lineH = tileSize*screenHeight/dist;
            let lineW = screenWidth/fov;
            if (lineH > screenHeight){
                lineH = screenHeight;
            }
            let screenX = 8*tileSize;
            let screenY = 0;


            /* ctx.fillRect(screenX,screenY,screenWidth,screenHeight); */
            let h=180,s=0.5,l=0.5;
            ctx.fillStyle = `hsl(${isHorizontal ? h+10 : h}deg, ${s*100}%, ${l*100}%)`;
            
            ctx.fillRect(screenX+lineW*(i+fov/2),screenY+screenHeight/2-lineH/2,lineW,lineH);

            drawLine(startx,starty,hit.x,hit.y);
        }


    }
}

class Player {
    x = 6.1;
    y = 6.1;
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
let mouseMap = new Map();
let mouse = {
    x:0,
    y:0
}
onmousedown = function(e){
    mouseMap.set(e.button,true);
}
onmouseup = function(e){
    mouseMap.set(e.button,false);
}
onmousemove = function(e){
    let dx = e.clientX - mouse.x;
    let dy = e.clientY - mouse.y;

    if (mouseMap.get(0)){
        player.dir += DR*0.5*dx;
    }

    mouse.x = e.clientX;
    mouse.y = e.clientY;
}

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
    [1,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,1],
    [1,1,1,0,0,1,0,0],
    [1,0,0,0,0,1,0,0],
    [1,0,0,0,1,0,0,1],
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