let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");


let tileSize=100;

let CIRCLE = 2*Math.PI;

function drawLine(x1,y1,x2,y2){
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

let resolutionMultiplier = 1/4;

function draw3d(){
    rayMultiplier = window.innerWidth/fov * resolutionMultiplier;

    screenWidth = canvas.width;
    screenHeight = canvas.height;
    screenX = 0;
    screenY = 0;

    //top
    ctx.fillStyle = "#00ccff";
    ctx.fillRect(screenX,screenY, screenWidth, screenHeight/2);

    //ground
    ctx.fillStyle = "#666";
    ctx.fillRect(screenX,screenY+screenHeight/2, screenWidth, screenHeight/2);

    let rays = drawRays(player);
    for (let r of rays){
        let {startx, starty, hit} = r;
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#0f0";
        drawLine(startx*minimapSize,starty*minimapSize,hit.x*minimapSize,hit.y*minimapSize);

        ctx.lineWidth = 3;
        ctx.strokeStyle = "#6600ff";
        ctx.strokeRect(hit.x*minimapSize,hit.y*minimapSize,0.01,0.01);
    }
}
let minimapSize = 1/10;
function draw(){
    ctx.fillStyle="#000";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    
    draw3d();


    for (let y=0; y < map.length; y++){
        for (let x=0; x < map[y].length; x++){
            let ts = tileSize*minimapSize;
            let t = map[y][x];
            
            ctx.fillStyle = getColor(t);
            ctx.strokeStyle="#66666688";
            ctx.lineWidth = 1;
            ctx.strokeRect(x*ts, y*ts, ts, ts);
            let img = getImage(t);
            if (t != 0){
                ctx.drawImage(img,x*ts, y*ts, ts, ts);
            } else {
                ctx.fillRect(x*ts, y*ts, ts, ts);
            }
            
        }
    }
    player.draw();


    
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

function getColor(tile){
    return colors[tile] || "#cc0099";
}
function getImage(tile){
    return images[tile] || images[0];
}
var colors = [
    "transparent",
    "#ff0000",
    "#008000",
    "#0000ff",
    "#ffffff"
];
var images = [
    "textures/missing.png",
    "textures/wall.png",
    "textures/bricks.png",
    "textures/wood.png",
    "textures/wall2.png",
];

for (let i=0; i<images.length; i++){
    let src = images[i];
    if (src == undefined){
        continue;    
    }
    images[i] = new Image();
    images[i].src = src;
}

let fov = 80;
let rayMultiplier = 4;

let screenHeight = 480;
let screenWidth = 480;
let screenX = 0;
let screenY = 0;

function drawRays(e){
    let [startx,starty] = e.getCenterPos();
    let rays = [];
    for (let i=-fov/2; i < fov/2; i+=1/rayMultiplier){
        function rayCast(horizontal){
            let r = normalize(e.dir  + DR*i + 0.0001 ,CIRCLE);

            let [x,y] = [startx,starty];
            let hit = false;
            let iter = 0;
            let stepSize = tileSize;

            let hx;
            let hy;
            let maxiter = map.length+map[0].length;

            while(!hit && iter < maxiter){

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

                
                let minadd = 0.0001;
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
                } else {
                    /* ctx.lineWidth = 4;
                    ctx.strokeStyle = "#6600ff";
                    ctx.strokeRect(x,y,0.01,0.01); */
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

        function calcDistance(h) {
            if (h == undefined){
                return Infinity;
            }
            let dx = h.x-startx;
            let dy = h.y-starty;
            let c = Math.sqrt(dx*dx+dy*dy);
            return c;
        }
        if (horizontal == undefined && vertical == undefined){

        } else {
            let hit = calcDistance(horizontal) < calcDistance(vertical) ? horizontal : vertical;

            rays.push({
                horizontal,
                vertical,
                hit,
                startx,
                starty
            });

            if (hit == undefined){
                console.log("undefined hit");
                continue;
            }


            let angleDiff = Math.abs(DR*i);

            
            
            let dist = calcDistance(hit);
            
            dist*=Math.cos(angleDiff);

            let isHorizontal = hit == horizontal;

            
            let maxLineHeight = screenHeight;
            let lH = screenHeight;
            let fovPercent = 60/fov;
            let lineH = Math.min((tileSize*maxLineHeight)/dist, maxLineHeight) * (screenWidth/screenHeight) * fovPercent;
            let lineW = screenWidth/fov;
            if (lineH > screenHeight){
                lineH = screenHeight;
            }
            

            let tile = GameMap.get(Math.floor(hit.x/tileSize), Math.floor(hit.y/tileSize));

            
            /* ctx.fillRect(screenX,screenY,screenWidth,screenHeight); */
            let color = getColor(tile);
            
            color = hexToRgb(color);
            
            color = rgbToHsl(...color);

            /* if (hit == horizontal){
                color[2] *= 0.8;
            }
             */
            
            
            let [sx,sy] = [Math.floor(screenX+lineW*(i+fov/2)), Math.floor(screenHeight/2-lineH/2)];
            let [drawW, drawH] = [Math.ceil(lineW/rayMultiplier),Math.floor(lineH)];

            let img = getImage(tile);
            if (img){
                let percent;
                if (hit == horizontal){
                    percent = (hit.x/tileSize-Math.floor(hit.x/tileSize))
                } else {
                    percent = (hit.y/tileSize-Math.floor(hit.y/tileSize))
                }
                let sliceW = 0.0001;
                let sourceX = (img.width*percent);
                ctx.imageSmoothingEnabled  = false;
                ctx.drawImage(img,sourceX,0, sliceW,img.height, sx,sy,drawW,drawH);
            } else {
                ctx.fillStyle = `hsl(${color[0]*360}deg, ${color[1]*100}%, ${color[2]*100}%)`;
                ctx.fillRect(sx,sy,drawW,drawH);
            }
            if (hit == horizontal){
                ctx.fillStyle = "rgba(0,0,0,0.2)";
                ctx.fillRect(sx,sy,drawW,drawH);
            }
        }


    }
    return rays;
}

class Player {
    x = 11.96021999311237;
    y = 21.913129046178746;
    width = 100;
    height = 100;
    dir = 0.02617993877489492;

    getCenterPos(){
        let [dx,dy] = [this.x*tileSize,this.y*tileSize];
        let [w,h] = [this.width, this.height]
        let [cx,cy] = [dx+w/2,dy+h/2]
        return [cx,cy];
    }

    draw(){
        ctx.fillStyle="#f0f";
        let [dx,dy] = [this.x*tileSize*minimapSize,this.y*tileSize*minimapSize];
        let [w,h] = [this.width*minimapSize, this.height*minimapSize]
        ctx.fillRect(dx,dy, w,h);
        
        let [cx,cy] = [dx+w/2,dy+h/2]

        let [ox,oy] = calcDegOffset(this.dir);
        let lineLength = 120*minimapSize;

        ctx.lineWidth = 50*minimapSize;
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
    y:0,
    locked:false,
}
onmousedown = function(e){
    canvas.requestPointerLock();
    mouseMap.set(e.button,true);
}
onmouseup = function(e){
    mouseMap.set(e.button,false);
}
document.addEventListener('pointerlockchange', lockChangeAlert, false);
function lockChangeAlert() {
    if (document.pointerLockElement === canvas) {
        mouse.locked = true;
    } else {
        mouse.locked = false;
    }
}
onmousemove = function(e){
    /* let dx = e.clientX - mouse.x;
    let dy = e.clientY - mouse.y; */
    let dx = e.movementX;
    let dy = e.movementY;

    if (mouse.locked){
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
            let [rox, roy] = calcDegOffset(player.dir-Math.PI/2);
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
                    player.x += rox*1/player.speed;
                    player.y += roy*1/player.speed;
                },
                "d":()=>{
                    player.x -= rox*1/player.speed;
                    player.y -= roy*1/player.speed;
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
	[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
	[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
	[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
	[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
	[1,0,0,0,0,0,2,2,2,2,2,0,0,0,0,3,0,3,0,3,0,0,0,1],
	[1,0,0,0,0,0,2,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,1],
	[1,0,0,0,0,0,2,0,0,0,2,0,0,0,0,3,0,0,0,3,0,0,0,1],
	[1,0,0,0,0,0,2,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,1],
	[1,0,0,0,0,0,2,2,0,2,2,0,0,0,0,3,0,3,0,3,0,0,0,1],
	[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
	[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
	[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
	[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
	[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
	[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
	[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
	[1,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
	[1,4,0,4,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
	[1,4,0,0,0,0,5,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
	[1,4,0,4,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
	[1,4,0,4,4,4,4,4,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
	[1,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
	[1,4,4,4,4,4,4,4,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
	[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
]
for (let y=0; y < map.length; y++){
    for (let x=0; x < map[y].length; x++){
        if (y == 0 || y == map.length-1){
            map[y] = new Array(map[y].length).fill(1);
        }
        if (x == 0 || x == map[y].length-1){
            map[y][x] = 1;
        }
        
    }
}


function init(){
    resiz();
    loop();
}
init();


window.onresize = function(){
    console.log("resize");
    resiz();
}