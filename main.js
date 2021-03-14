let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d", { alpha: false });

let tileSize=100;

let CIRCLE = 2*Math.PI;

function drawLine(x1,y1,x2,y2){
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

let resolutionMultiplier = 1/5;

function draw3d(){
    rayMultiplier = window.innerWidth/fov * resolutionMultiplier;

    screenWidth = canvas.width;
    screenHeight = canvas.height;
    screenX = 0;
    screenY = 0;

    let rayCastTime = performance.now();
    let rays = castRays(player);
    rayCastTime = performance.now() - rayCastTime;
    infoMenu.rayCastTime = rayCastTime;

    let rayDrawTime = performance.now();

    //top
    ctx.fillStyle = "#00ccff";
    ctx.fillRect(screenX,screenY, screenWidth, screenHeight/2);

    //ground
    ctx.fillStyle = "#666";
    ctx.fillRect(screenX,screenY+screenHeight/2, screenWidth, screenHeight/2);

    rays.forEach(e=>{
        drawHit(e);
    })
    rayDrawTime = performance.now() - rayDrawTime;
    infoMenu.rayDrawTime = rayDrawTime;

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
let fps = [];
let minimapSize = 1/10;

let infoMenu={
    fps:0,
}

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

    let fontSize = 25;
    ctx.font = `${fontSize}px monospace`;
    ctx.fillStyle = "yellow";
    let sum = 0;
    for (let e of fps){
        sum+=e;
    }
    let avgfps = sum/fps.length;
    infoMenu.fps = avgfps;
    let index = 0;
    [...Object.entries(infoMenu)].forEach(([key,value])=>{
        let text = `${key}: ${value}\n`;
        ctx.fillText(text,0,((index+1)*fontSize)+(tileSize*minimapSize)*map.length );
        index++;
    })
    
    
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
    "textures/glass.png",
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

function calcDistance(h,startx,starty) {
    if (h == undefined){
        return Infinity;
    }
    let dx = h.x-startx;
    let dy = h.y-starty;
    let c = Math.sqrt(dx*dx+dy*dy);
    return c;
}

function drawHit({hit,startx,starty,i}) {

    infoMenu.drawCalcTime = performance.now();
    let angleDiff = Math.abs(DR*i);

    
    
    let dist = calcDistance(hit,startx,starty);
    dist*=Math.cos(angleDiff);
    

    
    let maxLineHeight = screenHeight;
    let lH = screenHeight;
    let fovPercent = 60/fov;
    let lineH = (tileSize*maxLineHeight)/dist * (screenWidth/screenHeight) * fovPercent;
    
    let lineW = screenWidth/fov;
    

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
        if (hit.horizontal){
            percent = (hit.x/tileSize-Math.floor(hit.x/tileSize))
        } else {
            percent = (hit.y/tileSize-Math.floor(hit.y/tileSize))
        }
        percent = 1-percent;
        let sliceW = 1;
        let sourceX = Math.min(Math.floor(img.width*percent), img.width);
        let sourceY = 0;
        ctx.imageSmoothingEnabled  = false;
        
        infoMenu.drawSliceTime = performance.now();
        ctx.drawImage(img,sourceX,sourceY, sliceW,img.height, sx,sy,drawW,drawH);
        infoMenu.drawSliceTime = (performance.now() - infoMenu.drawSliceTime) * 1000;
    } else {
        ctx.fillStyle = `hsl(${color[0]*360}deg, ${color[1]*100}%, ${color[2]*100}%)`;
        ctx.fillRect(sx,sy,drawW,drawH);
    }
    if (hit.horizontal){
        ctx.fillStyle = "rgba(0,0,0,0.2)";
        ctx.fillRect(sx,sy,drawW,drawH);
    }
    infoMenu.drawCalcTime = (performance.now()-infoMenu.drawCalcTime) * 1000;
}




function castRays(e){
    let [startx,starty] = e.getCenterPos();
    let rays = [];
    for (let i=-fov/2; i < fov/2; i+=1/rayMultiplier){
        function rayCast(horizontal){
            let r = normalize(e.dir  + DR*i + 0.0001 ,CIRCLE);

            let [x,y] = [startx,starty];
            let iter = 0;
            let stepSize = tileSize;

            let hx;
            let hy;
            let maxiter = map.length+map[0].length;
            let hits = [];
            let transparent = true;
            while(iter < maxiter && transparent){

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
                    let o = {x,y,tx,ty,horizontal};
                    hits.push(o);
                    if (GameMap.get(tx,ty) != 5){
                        transparent = false;
                    }
                } else {
                    /* ctx.lineWidth = 4;
                    ctx.strokeStyle = "#6600ff";
                    ctx.strokeRect(x,y,0.01,0.01); */
                }
                

                iter++;
            }
            return hits;
        }
        let horizontal = rayCast(true);
        let vertical = rayCast(false);

        function calcDist(h) {
            return calcDistance(h,startx,starty);
        }

        let allHits = [horizontal,vertical].flat();
        let hitList = [];
        /* console.log(allHits); */
        allHits.forEach(e=>{
            let isShortestOnTile = true;
            allHits.forEach(f=>{
                if (e.tx == f.tx && e.ty == f.ty){
                    if (calcDist(f) < calcDist(e)){
                        isShortestOnTile = false;
                    }
                }
            })
            if (isShortestOnTile){
                hitList.push(e);
            }
        })
        hitList.sort((a,b)=>{
            return calcDist(b) - calcDist(a);
        });
        let index = i;
        for (let i = 0; i < hitList.length; i++) {
            const e = hitList[i];
            rays.push({
                hit:e,
                startx,
                starty,
                i:index,
            });
        }
    }
    return rays;
}

class Player {
    x = 13.30159275989973;
    y = 5.569917163381888;
    width = 100;
    height = 100;
    dir = -0.11982006122510389;

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
        player.dir += dx * 0.002;
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

let DR = Math.PI/180; //degree * DR = radian

function calc(){
    for (let e of keyMap.entries()){
        let [k, value] = e;
        if (value == true){
            let c = String.fromCharCode(k).toLowerCase();
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
    let start = Date.now();
    calc();
    draw();
    fps.push(1/((Date.now()-start)/1000));
    if (fps.length > 10){
        fps.shift();
    }
    if (mouseMap.get(2)){
        /* resolutionMultiplier += 0.1; */
        fov = Math.max(fov-5, 55);
    } else {
        /* resolutionMultiplier = Math.max(resolutionMultiplier - 0.5, 1/4); */
        fov = Math.min(fov+8, 80);
    }
    requestAnimationFrame(loop);
}
document.addEventListener("contextmenu",(e)=>{
    e.preventDefault();
})
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
	[1,0,0,0,0,0,2,2,0,2,2,0,0,0,0,5,0,3,0,3,0,0,0,1],
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
	[1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,1,1,1,1,1,1,1]
]
/* for (let y=0; y < map.length; y++){
    for (let x=0; x < map[y].length; x++){
        if (y == 0 || y == map.length-1){
            map[y] = new Array(map[y].length).fill(1);
        }
        if (x == 0 || x == map[y].length-1){
            map[y][x] = 1;
        }
        
    }
}
 */

function init(){
    resiz();
    loop();
}
init();


window.onresize = function(){
    resiz();
}