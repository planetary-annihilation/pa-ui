$(document).ready(function() {
    
    var nebulaTimer;
    var nebulaLoop;

    function runNebula() {
        // The canvas element we are drawing into.      
        var canvas1 = document.getElementById("nebulacanvas");
        var canvas2 = document.getElementById("nebulacanvas2");
        var canvas3 = document.getElementById("nebulacanvas3");

        var ctx1 = canvas1.getContext('2d');
        var ctx2 = canvas2.getContext('2d');
        var ctx3 = canvas3.getContext('2d');

        var bgimage = new Image();
        $(bgimage).bind('load', null, function() {
            var bgCanvas = document.getElementById('bgcanvas');
            var bgCtx = bgCanvas.getContext('2d');
            bgCtx.drawImage(bgimage, 0, 0, bgCanvas.width, bgCanvas.height);
        });
        bgimage.src= 'img/img_start_bground_sample.jpg';

        var img = new Image();

        var SPEED = 0.07;

        // A puff.
        var Puff = function(p) {
            var opacity,
            sy = (Math.random()*285)>>0,
            sx = (Math.random()*285)>>0;

            this.p = p;

            this.move = function(timeFac) {
                p = this.p + SPEED * timeFac;
                opacity = (Math.sin(p*0.05)*0.5);
                if(opacity <0) {
                    p = opacity = 0;
                    sy = (Math.random()*285)>>0;
                    sx = (Math.random()*285)>>0;
                }
                this.p = p;
                ctx1.globalAlpha = opacity;
                ctx1.drawImage(canvas3, sy+p, sy+p, 285-(p*2),285-(p*2), 0,0, 570,570);
            };
        };

        var puffs = [];
        var sortPuff = function(p1,p2) { return p1.p-p2.p; };
        puffs.push( new Puff(0) );
        puffs.push( new Puff(20) );
        puffs.push( new Puff(40) );

        var newTime, oldTime = 0, timeFac;

        nebulaLoop = function()
        {
            newTime = Date.now();
            if(oldTime === 0 ) {
                oldTime=newTime;
            }
            timeFac = (newTime-oldTime) * 0.1;
            if(timeFac>3) {timeFac=3;}
            oldTime = newTime;
            puffs.sort(sortPuff);

            for(var i=0;i<puffs.length;i++) {
                puffs[i].move(timeFac);
            }
            ctx2.drawImage( canvas1 ,0,0, 570,570,0,0,window.innerWidth, window.innerHeight);
        };
        // Turns out Chrome is much faster doing bitmap work if the bitmap is in an existing canvas rather
        // than an IMG, VIDEO etc. So draw the big nebula image into canvas3
        $(img).bind('load',null, function() {
            ctx3.drawImage(img, 0,0, 570, 570);
        });
        img.src = '../img/nebula.jpg';
    }

    var starTimer;
    var starLoop;
    function runStars() {

        MAX_DEPTH = 32.0;

        var stars = new Array(512);

        var canvas = document.getElementById("starcanvas");
        var ctx = canvas.getContext("2d");

        function randomRange(minVal,maxVal) {
            return Math.random() * (maxVal - minVal) + minVal;
        }

        var specialColors = [
            'lime',
            'deeppink',
            'gold',
            'deepskyblue',
            'darksalmon'
        ];

        function randomColor() {
            if (Math.random() < 0.95) {
                return '#c0c0c0';
            }
            else {
                var i = Math.floor((Math.random() * specialColors.length));
                return specialColors[i];
            }
        }

        function resetStar(i,first) {
            stars[i] = {
                x : randomRange(-25,25),
                y : randomRange(-25,25),
                z : randomRange(1,MAX_DEPTH / 2),
                s : randomRange(1.0, 2.0),
                t : first ? Date.now() - 3.0 : Date.now(),
                c : randomColor()
            };
        }

        function fillCircle(x,y,r,c) {
            ctx.shadowColor = c;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            ctx.shadowBlur = r*3;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, 2 * Math.PI, false);
            ctx.fill();
            //ctx.fillRect(x,y,r,r);
        }

        var SPEED = 0.002;

        starLoop = function() {

            var halfWidth  = canvas.width / 2;
            var halfHeight = canvas.height / 2;

            ctx.save();
            ctx.clearRect(0,0,canvas.width,canvas.height);

            for( var i = 0; i < stars.length; i++ ) {
                stars[i].z -= SPEED;

                if( stars[i].z <= 0 ) {
                    resetStar(i);
                }

                var k  = 128.0 / stars[i].z;
                var px = stars[i].x * k + halfWidth;
                var py = stars[i].y * k + halfHeight;

                if( px >= 0 && px <= window.innerWidth && py >= 0 && py <= window.innerHeight ) {
                    var distAlpha = 1 - (stars[i].z / MAX_DEPTH);
                    var tAlpha = Math.min(1.0, (Date.now() - stars[i].t) / 3000.0);
                    var alpha = Math.min(0.8,Math.min(distAlpha, tAlpha));
                    ctx.globalAlpha = alpha * 0.5;
                    ctx.fillStyle = stars[i].c;
                    fillCircle(px,py,alpha * stars[i].s, stars[i].c);
                }
            }
            ctx.restore();
        };

        $.each(stars, function(i,star) { resetStar(i,true); });
    }

    function restart() {
        $('canvas').each( function(i,c) {
            c.width = window.innerWidth;
            c.height = window.innerHeight;
        });
        clearTimeout(nebulaTimer);
        clearTimeout(starTimer);
        runNebula();
        runStars();
        var runLoop = function() {
            nebulaLoop();
            starLoop();
            window.requestAnimationFrame(runLoop);
        };
        window.requestAnimationFrame(runLoop);
    }
   
    var res;
    window.onresize = function(e) {
        if (res) {
            clearTimeout(res);
        }
        res = setTimeout(function(){ restart(); },100);
    };

    restart();
});
