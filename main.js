var hash3 = function(a,b,c){
    return a+","+b+","+c;
};

var projVector2 = function(a,b){//a onto b
    var dot = a[0]*b[0]+a[1]*b[1];
    var magn2 = b[0]*b[0]+b[1]*b[1];
    return [dot/magn2*b[0],dot/magn2*b[1]];
};

var HashCollision2d = function(){
    var hash = {};
    var addToHash = function(a,b,c,content){
        var tag = a+","+b+","+c;
        if(!(tag in hash))hash[tag] = [];
        hash[tag].push(content);
    };
    var removeFromHash = function(a,b,c,content){
        var tag = a+","+b+","+c;
        var arr = hash[tag];
        if(!arr)throw new Error("hash value not defined when removing");
        for(var i = 0; i < arr.length; i++){
            if(arr[i] === content){
                arr.splice(i,1);
                return false;
            }
        }
    };
    var getHash = function(a,b,c){
        var tag = a+","+b+","+c;
        return hash[tag];
    };
    var ls = {};
    this.addPoint = function(point){
        var r = point.r;
        var l = Math.ceil(Math.log(r*2*1.01)/Math.log(2));//level. just a hair bigger than unit to be on the safe side
        ls[l] = true;
        var gw = 2**l;//grid width
        var x0 = point.x-r;
        var y0 = point.y-r;
        var x1 = point.x+r;
        var y1 = point.y+r;
        var x0h = Math.floor(x0/gw);
        var y0h = Math.floor(y0/gw);
        var x1h = Math.floor(x1/gw);
        var y1h = Math.floor(y1/gw);
        
        for(var i = x0h; i <= x1h; i++){
            for(var j = y0h; j <= y1h; j++){
                addToHash(l,i,j,point);
            }
        }
    };
    this.detectCollision = function(point){
        var results = [];
        var r = point.r;
        var x0 = point.x-r;
        var y0 = point.y-r;
        var x1 = point.x+r;
        var y1 = point.y+r;
        for(var l in ls){
            var gw = 2**l;//grid width
            var x0h = Math.floor(x0/gw);
            var y0h = Math.floor(y0/gw);
            var x1h = Math.floor(x1/gw);
            var y1h = Math.floor(y1/gw);
            for(var i = x0h; i <= x1h; i++){
                for(var j = y0h; j <= y1h; j++){
                    var opponents = getHash(l,i,j);
                    if(opponents){
                        narrowPhaseCollision(point,opponents,results);
                    }
                }
            }
        }
        return results;
    };
    this.removePoint = function(point){//basically the same code as add point
        var r = point.r;
        var l = Math.ceil(Math.log(r*2*1.01)/Math.log(2));//level. just a hair bigger than unit to be on the safe side
        ls[l] = true;
        var gw = 2**l;//grid width
        var x0 = point.x-r;//may cache it next time I make it
        var y0 = point.y-r;
        var x1 = point.x+r;
        var y1 = point.y+r;
        var x0h = Math.floor(x0/gw);
        var y0h = Math.floor(y0/gw);
        var x1h = Math.floor(x1/gw);
        var y1h = Math.floor(y1/gw);
        
        for(var i = x0h; i <= x1h; i++){
            for(var j = y0h; j <= y1h; j++){
                removeFromHash(l,i,j,point);
            }
        }
    };
    
    var narrowPhaseCollision = function(point,opponents,results){
        for(var i = 0; i < opponents.length; i++){
            var o = opponents[i];
            if(o === point){
                continue;
            }else{
                if((point.r+o.r)**2 > (point.x-o.x)**2+(point.y-o.y)**2){
                    var bb = true;
                    for(var j = 0; j < results.length; j++){
                        if(results[j] === o){
                            bb = false;
                            break;
                        }
                    }
                    if(bb)results.push(o);
                }
            }
        }
    };
};

var Field = function(canvas,n){
    var ctx = canvas.getContext("2d");
    var width = canvas.width;
    var height = canvas.height;
    var r = 1;
    var particles = [];
    var colls = new HashCollision2d();
    var addPointWithoutCollision = function(){
        var cnt = 0;
        while(true){
            cnt++;
            if(cnt > 1000){
                throw new Error("something's broken 'cause I'm seeing an infinite loop");
                return false;
            }
            var point = {
                x:6+Math.random()*(width-12),
                y:6+Math.random()*(height-12),
                vx:(Math.random()-0.5)*200,
                vy:(Math.random()-0.5)*200,
                r:r
            };
            colls.addPoint(point);
            var result = colls.detectCollision(point);
            if(result.length === 0){//no collision!
                particles.push(point);
                return point;
                break;
            }else{
                colls.removePoint(point);
            }
        }    
    };
    
    var avgv = 0;
    for(var i = 0; i < n; i++){
        var p = addPointWithoutCollision();
        var v = p.vx**2+p.vy**2;
        avgv += v;
    }
    avgv /= n;
    /*
    var point = {
        x:50,
        y:200,
        vx:250,
        vy:0,
        r:5
    };
    particles.push(point);
    for(var i = 0; i < 20; i++){
        var point = {
            x:150+15*i,
            y:200,
            vx:0,
            vy:0,
            r:5
        };
        particles.push(point);
    }
    */
    
    
    this.render = function(){
        ctx.clearRect(0,0,width,height);
        for(var i = 0; i < particles.length; i++){
            var p = particles[i];
            ctx.beginPath();
            ctx.arc(p.x,p.y,p.r,0,6.28);
            ctx.stroke();
        }
    };
    
    var registerCollision = function(p,o){//change p's velocity and add change in position
        var rvx = o.x-p.x;
        var rvy = o.y-p.y;
        var dvx = p.vx-o.vx;
        var dvy = p.vy-o.vy;
        //project dv into dp and invert and add to velocity
        var projected = projVector2([dvx,dvy],[rvx,rvy]);
        p.dvx -= projected[0];
        p.dvy -= projected[1];
        
        var d = Math.sqrt(rvx*rvx+rvy*rvy);
        var offset = (p.r+o.r-d)/2;
        p.dx += -offset*rvx/d;
        p.dy += -offset*rvy/d;
    };
    
    //in-dev
    /*
    this.step = function(dt){
        colls = new HashCollision2d();
        for(var i = 0; i < particles.length; i++){
            var p = particles[i];
            //just move it a hair bit
            p.x += p.vx*dt;
            p.y += p.vy*dt;
            p.dx = 0;
            p.dy = 0;//gonna use these after collision
            p.dvx = 0;
            p.dvy = 0;//gonna use these after collision
            p.collisionPair = false;
            colls.addPoint(p);
            //if colliding with the wall invert the signs accordingly
            if(p.x < 0+p.r){
                p.vx = Math.abs(p.vx);
            }else if(p.x > width-p.r){
                p.vx = -Math.abs(p.vx);
            }
            
            if(p.y < 0+p.r){
                p.vy = Math.abs(p.vy);
            }else if(p.y > height-p.r){
                p.vy = -Math.abs(p.vy);
            }
        }
        for(var i = 0; i < particles.length; i++){
            var p = particles[i];
            var arr = colls.detectCollision(p);
            if(arr[0]){
                p.collisionPair = arr[0];
                arr[0].collisionPair = p;
            }
        }
        for(var i = 0; i < particles.length; i++){
            var p = particles[i];
            if(p.collisionPair)registerCollision(p,p.collisionPair);
        }
        for(var i = 0; i < particles.length; i++){
            var p = particles[i];
            p.x += p.dx;
            p.y += p.dy;
            p.vx += p.dvx;
            p.vy += p.dvy;
        }
    };*/
    
    this.step = function(dt){
        colls = new HashCollision2d();
        for(var i = 0; i < particles.length; i++){
            var p = particles[i];
            //just move it a hair bit
            p.x += p.vx*dt;
            p.y += p.vy*dt;
            p.dx = 0;
            p.dy = 0;//gonna use these after collision
            p.dvx = 0;
            p.dvy = 0;//gonna use these after collision
            colls.addPoint(p);
            //if colliding with the wall invert the signs accordingly
            if(p.x < 0+p.r){
                p.vx = Math.abs(p.vx);
            }else if(p.x > width-p.r){
                p.vx = -Math.abs(p.vx);
            }
            
            if(p.y < 0+p.r){
                p.vy = Math.abs(p.vy);
            }else if(p.y > height-p.r){
                p.vy = -Math.abs(p.vy);
            }
        }
        for(var i = 0; i < particles.length; i++){
            var p = particles[i];
            var arr = colls.detectCollision(p);
            for(var j = 0; j < arr.length; j++){
                var o = arr[j];
                registerCollision(p,o);
            }
        }
        for(var i = 0; i < particles.length; i++){
            var p = particles[i];
            p.x += p.dx;
            p.y += p.dy;
            p.vx += p.dvx;
            p.vy += p.dvy;
        }
        //offset the velocity
        var avgv1 = 0;
        for(var i = 0; i < n; i++){
            var p = particles[i];
            var v = p.vx**2+p.vy**2;
            avgv1 += v;
        }
        avgv1 /= n;
        for(var i = 0; i < n; i++){
            //p.vx *= avgv/avgv1;
            //p.vy *= avgv/avgv1;
        }
    };
    
    this.getParticles = function(){
        return particles;
    }
};
//gonna make a predictive circle collision simulator, but for now jst frame based


var StepGraph = function(canvas){
    var width = canvas.width;
    var height = canvas.height;
    var ctx = canvas.getContext("2d");
    this.draw = function(data,min,max,steps,zoom,color){
        ctx.fillStyle = color;
        var tally = [];
        for(var i = 0; i < steps; i++){
            tally[i] = 0;
        }
        for(var i = 0; i < data.length; i++){
            var val = data[i];
            var tidx = Math.floor((val-min)/(max-min)*steps);
            if(tidx < 0 || steps <= tidx)continue;
            tally[tidx]++;
        }
        for(var i = 0; i < tally.length; i++){
            //ctx.fillRect(width-(i+1)*(width/steps),height-tally[i]*zoom,(width/steps),tally[i]*zoom);
            ctx.fillRect(i*(width/steps),height-tally[i]*zoom,(width/steps),tally[i]*zoom);
        }
    };
    this.drawQuantized = function(tally,zoom,color){
        ctx.fillStyle = color;
        var steps = tally.length;
        for(var i = 0; i < tally.length; i++){
            //ctx.fillRect(width-(i+1)*(width/steps),height-tally[i]*zoom,(width/steps),tally[i]*zoom);
            ctx.fillRect(i*(width/steps),height-tally[i]*zoom,(width/steps),tally[i]*zoom);
        }
    };
    this.clear = function(){
        ctx.clearRect(0,0,width,height);
    }
    this.highlightLineTally = function(tally,zoom,color,i){
        ctx.fillStyle = color;
        var steps = tally.length;
        ctx.fillRect(i*(width/steps),height-tally[i]*zoom,(width/steps),tally[i]*zoom);
    }
};


var canvas1 = document.getElementById("canvas1");//createElement("canvas");
//document.body.appendChild(canvas1);
canvas1.width = 500;
canvas1.height = 250;
var field = new Field(canvas1,500);

var canvas2 = document.getElementById("canvas2");//.createElement("canvas");
//document.body.appendChild(canvas2);
canvas2.width = 500;
canvas2.height = 300;
var stepgraph = new StepGraph(canvas2);

var findMode = function(data,min,max,steps){
    var tally = [];
    for(var i = 0; i < steps; i++){
        tally[i] = 0;
    }
    for(var i = 0; i < data.length; i++){
        var val = data[i];
        var tidx = Math.floor((val-min)/(max-min)*steps);
        if(tidx < 0 || steps <= tidx)continue;
        tally[tidx]++;
    }
    var mode = 0;
    var maxval = 0;
    for(var i = 0; i < tally.length; i++){
        if(tally[i] > maxval){
            mode = i;
            maxval = tally[i];
        }
    }
    return mode*((max-min)/steps)+min;
};

var findModeTally = function(tally){
    var mode = 0;
    var maxval = 0;
    for(var i = 0; i < tally.length; i++){
        if(tally[i] > maxval){
            mode = i;
            maxval = tally[i];
        }
    }
    return mode;
};

var findAvgTally = function(tally){
    var sum = 0;
    var n = 0;
    for(var i = 0; i < tally.length; i++){
        n += tally[i];
        sum += i*tally[i];
    }
    return sum/n;
};

var findAvg = function(data){
    var sum = 0;
    for(var i = 0; i < data.length; i++){
        sum += data[i];
    }
    return sum/data.length;
};

var arraylength = function(len){
    var arr = [];
    for(var i = 0; i < len; i++){
        arr[i] = 0;
    }
    return arr;
};

var arrayAdd = function(a1,a2){
    for(var i = 0; i < a1.length; i++){
        a1[i] += a2[i];
    }
};

var quantize = function(data,min,max,steps){
    var tally = [];
    for(var i = 0; i < steps; i++){
        tally[i] = 0;
    }
    for(var i = 0; i < data.length; i++){
        var val = data[i];
        var tidx = Math.floor((val-min)/(max-min)*steps);
        if(tidx < 0 || steps <= tidx)continue;
        tally[tidx]++;
    }
    var mode = 0;
    var maxval = 0;
    for(var i = 0; i < tally.length; i++){
        if(tally[i] > maxval){
            mode = i;
            maxval = tally[i];
        }
    }
    return tally;
};

var blur1 = function(tally){
    var t2 = [];
    var len = tally.length;
    t2[0] = tally[0];
    for(var i = 1; i < len-1; i++){
        t2[i] = (tally[i-1]+tally[i]+tally[i+1])/3;
    }
    t2[len-1] = tally[len-1];
    return t2;
};

var findVariance = function(data){
    var avg = findAvg(data);
    var vsum = 0;
    for(var i = 0; i < data.length; i++){
        vsum += (data[i]-avg)**2;
    }
    return vsum/data.length;
};

var start = 0;
var quantizedSum = arraylength(100);
var cntt = 0;
var animate = function(t){
    if(start === 0)start = t;
    var dt = (t-start)/1000;
    start = t;
    field.render();
    var velocities = field.getParticles().map((p)=>{
        return Math.sqrt(p.vx*p.vx+p.vy*p.vy);
    });
    var vquantized = quantize(velocities,0,200,100);
    arrayAdd(quantizedSum,vquantized);
    var modeT = findModeTally(blur1(quantizedSum),0,500,100);
    var avgT = findAvgTally(quantizedSum);
    var piT = 4*modeT*modeT/avgT/avgT;
    cntt++;
    console.log(piT);
    document.getElementById("mode").innerHTML = "calculation using mode: π = "+piT;
    var variance = findVariance(velocities);
    var avg = findAvg(velocities);
    var avg2 = avg*avg;
    var piv = 8*(avg2+variance)/3/avg2;
    console.log(piv);
    document.getElementById("variance").innerHTML = "calculation using variance: π = "+piv;
    
    stepgraph.clear();
    stepgraph.drawQuantized(blur1(quantizedSum),20/cntt,"#888");
    stepgraph.highlightLineTally(blur1(quantizedSum),20/cntt,"#f88",modeT);
    stepgraph.draw(velocities,0,200,100,10,"#000");
       
    
    for(var i = 0; i < 1; i++){
        field.step(dt/1);
    }
    requestAnimationFrame(animate);
};
requestAnimationFrame(animate);
