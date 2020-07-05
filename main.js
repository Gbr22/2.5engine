let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");


let tileSize=30;

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
            ctx.fillRect(x*tileSize, y*tileSize, tileSize, tileSize);
        }
    }
    player.draw();
}

function calcDegOffset(rad){
    let y = Math.sin(rad);
    let x = Math.cos(rad);

    return [x,y];
}

class Player {
    x = 1;
    y = 1;
    width = 20;
    height = 20;
    dir = 0;
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
            console.log(c);
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
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
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


function onresize(){
    resiz();
}