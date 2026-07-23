let canvas = document.getElementById('game');
let ctx = canvas.getContext('2d');
let secondsPassed = 0;
let oldTimeStamp = 0;

let inEast = JSON.parse(localStorage.getItem("inEastF"));

//sets canvas fullscreen
canvas.height = Math.floor(window.innerHeight);
canvas.width = Math.floor(window.innerWidth);

//creates key object (kind of array)
let toggledKeys = {};

//Set up the game
let game = {
    homeScore: 0,
    awayScore: 0,
    homeOffs: 0,
    awayOffs: 0,
    homeTurn: true,
    playing: true, //game.playing is true when players are hitting back and forth too each other (not kicking off or kicking)
    homeTeam: "",
    awayTeam: ""
};
//Set up the table
const table = {
    x: 100,
    y: 100,
    height: canvas.height - 200,
    width: canvas.width - 200,
};
//Set up the football
let football = {
    vertex1: new Vec2,
    vertex2: new Vec2,
    vertex3: new Vec2,
    center: new Vec2(canvas.width/2, canvas.height-table.y),
    sideLengths: [58, 82],
    mass: 1,
    velocity: new Vec2(0, 0),
    angularVelocity: 0,
    angle2D: 5*Math.PI/4, //For spinning along the axis going into the screen
    angle3D: 0, //For spinning along one of the axis going along the screen
    stopped: true,
    inertia: 500,
    kickoff: true,
    design: [new Vec2(5,5), new Vec2(53,53), new Vec2(0,0), new Vec2(0,0), new Vec2(0,0), new Vec2(0,0), new Vec2(0,0), new Vec2(0,0)],
    fieldGoalScored: false,
};
//Set up the mouse
let mouse = {
    history: []
};
//Set up the field goal
const goal = {
    vertex1: new Vec2(table.x+200, table.y),
    vertex2: new Vec2(table.x+table.width-200, table.y+300),
    vertex3: new Vec2(table.x+table.width/2, table.y+400),
}
//Calculate the center of mass of the football
calculateVertices();

//Values
const friction = .95; //Higher number means less friction
const power = 2; //Higher number means more power
let kickTime = 0; //How long the ball has been in the air during a kickoff
let kickLength = 0; // How long the ball should be in the air during a kickoff


//If the user picked Quick Play, figure out what team is the home team and what team is the away team
if(localStorage.getItem("gameTypeF") == "quickPlay"){
    let teams;
    if(inEast){
        teams = JSON.parse(localStorage.getItem("eastStandingsF"));
    }
    else{
        teams = JSON.parse(localStorage.getItem("westStandingsF"));
    }
    game.homeTeam = JSON.parse(localStorage.getItem("userTeamF"));
    //Make sure its not a team playing against themselves
    teams.every(team => {
        if(game.homeTeam[0] == team[0]){
            teams.splice(teams.indexOf(team),1);
            return false;
        }
        return true;
    });
    game.awayTeam = teams[Math.floor(Math.random()*teams.length)];
}//If the user picked Season, use the schedule to find the away team
else{
    currentWeek = parseInt(localStorage.getItem("currentWeekF"));
    if(inEast){
        thisWeek = JSON.parse(localStorage.getItem("eastScheduleF"))[currentWeek];
    }
    else{
        thisWeek = JSON.parse(localStorage.getItem("westScheduleF"))[currentWeek];
    }
    thisWeek.forEach(curGame =>{
        if(curGame.homeTeam[0] == JSON.parse(localStorage.getItem("userTeamF"))[0]){
            game.awayTeam = curGame.awayTeam;
            game.homeTeam = curGame.homeTeam;
        }
        else if(curGame.awayTeam[0] == JSON.parse(localStorage.getItem("userTeamF"))[0]){
            game.homeTeam = curGame.awayTeam;
            game.awayTeam = curGame.homeTeam;
        }
    });
    let standings;
    if(inEast){
        standings = JSON.parse(localStorage.getItem("eastStandingsF"));
    }
    else{
        standings = JSON.parse(localStorage.getItem("westStandingsF"));
    }
}

//when key is pressed down, log the key
document.addEventListener("keydown", event => {
    toggledKeys[event.code] = true;
    event.preventDefault();
});
//when key comes back up, log the key
document.addEventListener("keyup", event => {
    toggledKeys[event.code] = false;
    event.preventDefault();
});

//When the mouse is moved
document.addEventListener("pointermove", function(event) {
    if(!game.homeTurn) return;
    const now = performance.now(); //logs the time of the event in milliseconds from the start of the program

    // Logs the position of the mouse and the timestamp
    mouse.history.push({
        x: event.clientX,
        y: event.clientY,
        t: now
    });

    // Keep only the last 50 ms
    while (mouse.history.length > 1 && now - mouse.history[0].t > 50){
        mouse.history.shift();
    }

    //Calculate Where the mouse hit the sides of the football
    const intersectionPoints = checkBallHit(new Vec2(event.clientX, event.clientY));
    //If the mouse didn't hit the football, don't do anything
    if((intersectionPoints[0] == null && intersectionPoints[1] == null && intersectionPoints[2] == null) || football.velocity.x != 0 || football.velocity.y != 0){
        return;
    }
    //Handle the result of the collision
    calculateCollision(intersectionPoints, new Vec2(event.clientX, event.clientY));
});
//Run each tick while playing
function updatePlaying(){
    //If its the Ai's turn to move
    if(football.stopped && !game.homeTurn){
        aiMove();
    }
    //Move the football
    football.center.addScale(football.velocity, secondsPassed);
    football.angle2D += football.angularVelocity*secondsPassed;
    //Calculate the vertices of the football
    calculateVertices();
    //Friction
    if(!football.kickoff){
        const frictionFactor = Math.pow(friction, secondsPassed*60);
        football.velocity = football.velocity.product(frictionFactor);
        football.angularVelocity*=frictionFactor;
    }
    //Round the velocity
    football.velocity.x = Math.round(football.velocity.x*1000)/1000;
    football.velocity.y = Math.round(football.velocity.y*1000)/1000;
    football.angularVelocity = Math.round(football.angularVelocity*1000)/1000;
    //If during a kickoff, make the size go bigger then smaller (like in the air)
    if(football.kickoff && !football.stopped){
        football.sideLengths[0] = 58*((kickLength)*Math.sin((kickTime/kickLength)*Math.PI)+1);
        football.sideLengths[1] = 82*((kickLength)*Math.sin((kickTime/kickLength)*Math.PI)+1);
        kickTime+=secondsPassed;
    }
    if(football.kickoff && kickTime > kickLength){
        football.kickoff = false;
    }
    //If ball falls off the table, make it shrink
    if(checkOff(0) || checkOff(1)){
        football.sideLengths[0]=Math.max(football.sideLengths[0]-60*secondsPassed, 0);
        football.sideLengths[1]=Math.max(football.sideLengths[1]-60*secondsPassed, 0);
    }
    //If the velocity is small enough, no more velocity and check state of ball
    if(football.velocity.magnitude() < 0.8 && !football.stopped){
        football.velocity.x = 0;
        football.velocity.y = 0;
        football.angularVelocity = 0;
        football.stopped = true;
        if(checkInPlay()){
            switchTurn();
        }
        //Check if its a touchdown for the home team (bottom player)
        if(checkTouchdown(0) && game.homeTurn){
            game.homeScore+=6;
            game.playing = false;
            reset();
        }//Check for a safety for the away team (top player)
        else if(checkTouchdown(0) || (checkOff(0) && !game.homeTurn && !checkOff(1))){
            game.homeScore+=2;
            game.homeOffs = 0;
            game.awayOffs = 0;
            reset();
        }//Check if its an off for the home team (bottom player)
        else if(checkOff(0) && game.homeTurn){
            game.homeOffs+=1;
            switchTurn();
            reset();
        }//Check if its an off for the away team (top player)
        else if(checkOff(1) && !game.homeTurn){
            game.awayOffs+=1;
            switchTurn();
            reset();
        }//Check if its a touchdown for the away team (top player)
        else if(checkTouchdown(1) && !game.homeTurn){
            game.awayScore+=6;
            game.playing = false;
            reset();
        }//Check for a safety for the home team (bottom player)
        else if(checkTouchdown(1) || (checkOff(1) && game.homeTurn && !checkOff(0))){
            game.awayScore+=2;
            game.homeOffs = 0;
            game.awayOffs = 0;
            reset();
        }//Field Goal
        if(game.homeOffs == 3 || game.awayOffs == 3){
            game.playing = false;
            reset();
        }//End the game if one team gets to 30
        if(game.homeScore >=30 || game.awayScore >= 30){
            if(localStorage.getItem("gameTypeF") == "season"){
                let standings;
                if(inEast){
                    standings = JSON.parse(localStorage.getItem("eastStandingsF"));
                }
                else{
                    standings = JSON.parse(localStorage.getItem("westStandingsF"));
                }
                let tempHome;
                let tempAway;
                standings.forEach(team => {
                    if(team[0] == game.homeTeam[0]){
                        tempHome = standings.indexOf(team);
                    }
                    else if(team[0] == game.awayTeam[0]){
                        tempAway = standings.indexOf(team);
                    }
                });//Home Team (bottom / user) won
                if(game.homeScore > game.awayScore){
                    localStorage.setItem("resultF", JSON.stringify([tempHome, 0, 30, tempAway, 1, game.awayScore]));
                }//Away Team (top / ai) won
                else{
                    localStorage.setItem("resultF", JSON.stringify([tempHome, 1, game.homeScore, tempAway, 0, 30]));
                }
                localStorage.setItem("currentWeekF", currentWeek+1);
                document.location.href = "standings.html";
            }
            else{
                document.location.href = "index.html";
            }
        }
    }
}
//Run each tick while kicking
function updateKicking(){
    //If its the Ai's turn to move
    if(football.stopped && !game.homeTurn){
        aiMove();
    }

    //Move the football
    football.center.addScale(football.velocity, secondsPassed);
    football.angle3D += football.angularVelocity*secondsPassed/40;
    
    //Calculate the vertices of the football
    calculateVertices();
    if(!football.stopped){
        football.sideLengths[0]=Math.max(football.sideLengths[0]-20*secondsPassed, 20); //Make the ball get smaller (because its getting farther away)
        football.velocity.x*=61*secondsPassed; //Make the side to side speed of the ball increase (the slice)
        football.velocity.y+=250*secondsPassed; //Gravity
        kickTime+=secondsPassed;
        //If the ball goes through the uprights
        if(!football.fieldGoalScored && kickTime > 2.5 && football.center.x > goal.vertex1.x && football.center.x < goal.vertex2.x && football.center.y < goal.vertex2.y){
            if(game.homeTurn){
                if(game.awayOffs == 3){
                    game.homeScore+=3;
                }
                else{
                    game.homeScore+=1;
                }
            }
            else{
                if(game.homeOffs == 3){
                    game.awayScore+=3;
                }
                else{
                    game.awayScore+=1;
                }
            }
            football.fieldGoalScored = true
        }
    }
    //The ball missed
    if(kickTime > 5){
        game.playing = true;
        reset();
        game.homeOffs = 0;
        game.awayOffs = 0;
    }
}
//Let the Ai decide how hard to hit the ball
function aiMove(){
    //football.velocity.y = (table.y+table.height-football.center.y)*3 --- perfect power
    //Generating error for the AI
    const aiPowerError = Math.random()*2;
    football.velocity.y = (table.y+table.height-football.center.y)*(1.5+aiPowerError);
    football.angularVelocity = Math.random()*35;
    football.stopped = false;
    //Kickoffs
    if(!game.playing){       
        football.velocity.y = (goal.vertex2.y-football.center.y)*(2-Math.random()/3)
        football.velocity.x = 60*(Math.random()-.5);
        football.angularVelocity = football.velocity.y;
        kickTime = 0;
    }
    //Field goal kicks
    else if(football.kickoff){
        kickLength = Math.min(Math.abs(football.velocity.y/football.inertia)/1.5, table.height/230);
        if(game.homeTurn){
            football.velocity.y = -250;
        }
        else{
            football.velocity.y = 250;
        }
        football.velocity.x = 0;
        football.angularVelocity/=2;
    }
}
//Check if the mouse hit any of the sides of the football
function checkBallHit(mouseEnd){
    let mouseStart = {x: mouse.history[0].x, y: mouse.history[0].y};
    //If the contact comes from within the football, dont do anything
    if(isPointInTriangle2D(mouseStart, football.vertex1, football.vertex2, football.vertex3)) return [null, null, null];
    return [intersection(mouseStart, mouseEnd, football.vertex1, football.vertex2), intersection(mouseStart, mouseEnd, football.vertex2, football.vertex3), intersection(mouseStart, mouseEnd, football.vertex3, football.vertex1)];
}
//Reset for kickoff (top refers to if the current player is on the top)
function reset(){
    //If resetting to a kickoff
    if(game.playing){
        if(game.homeTurn){
            football.center = new Vec2(canvas.width/2, canvas.height-table.y);
            game.homeTurn = true;
        }
        else{
            football.center = new Vec2(canvas.width/2, table.y);
            game.homeTurn = false;
        }
    }//Reset for a field goal kick
    else{
        football.center = new Vec2(canvas.width/2, canvas.height-table.y);
    }
    football.stopped = true;
    football.angularVelocity = 0
    football.sideLengths = [58,82];
    football.velocity = new Vec2(0,0);
    football.angle2D = -3*Math.PI/4;
    football.kickoff = true;
    kickLength = 0;
    kickTime = 0;
    football.angle3D = 0;
    football.fieldGoalScored = false;
}
//Handle the collision between the mouse and the football
function calculateCollision(intersectionPoints, mouseEnd){
    const mouseStart = {x: mouse.history[0].x, y: mouse.history[0].y};
    //Find how far the mouse is from the COM of the football --> how much the football should spin
    const spinAmt = distancePointToInfiniteLine(football.center, mouseStart, mouseEnd);
    //Find the angle2D of the mouse movement
    const angle2D = Math.atan2(mouseEnd.y - mouseStart.y, mouseEnd.x - mouseStart.x);
    const first = mouse.history[0];
    const last = mouse.history[mouse.history.length - 1];
    const mouseSpeed = Math.hypot(last.x - first.x, last.y - first.y) / ((last.t - first.t) / 1000);
    //Calculate the impulse on the football
    const force = power * mouseSpeed;    
    const time = .3;
    const impulse = force*time;
    //Apply the impulse to the football's velocity
    football.velocity.x = (impulse/football.mass)*Math.cos(angle2D)/Math.max(1, Math.abs(spinAmt)/10);
    football.velocity.y = (impulse/football.mass)*Math.sin(angle2D)/Math.max(1, Math.abs(spinAmt)/10);
    football.angularVelocity = Math.min(35, Math.abs((impulse/football.mass)*spinAmt/football.inertia))*Math.sign((impulse/football.mass)*spinAmt/football.inertia);
    football.stopped = false;
    mouse.history = [];
    //Convert the impulse to field goal kick power
    if(!game.playing){       
        football.velocity.x/=5;
        football.velocity.y = Math.max(Math.min(football.velocity.y/2, -200), -500);
        football.angularVelocity = football.velocity.y;
        kickTime = 0;
    }//Convert the impulse to kickoff power
    else if(football.kickoff){
        kickLength = Math.min(Math.abs(football.velocity.y/football.inertia), table.height/230);
        if(game.homeTurn){
            football.velocity.y = -250;
        }
        else{
            football.velocity.y = 250;
        }
        football.velocity.x = 0;
        football.angularVelocity/=2;
    }
}
//Check if football is in play
function checkInPlay(){
    return football.vertex1.y >= table.y && football.vertex2.y >= table.y && football.vertex3.y >= table.y && football.vertex1.y <= table.y + table.height && football.vertex2.y <= table.y + table.height && football.vertex3.y <= table.y + table.height && football.center.x > table.x && football.center.x < table.x+table.width;
}
//Check if the football is off the edge of the table for a touchdown (team is 0 when its the home team (player on the bottom) that just hit)
function checkTouchdown(team){
    if(team == 0) return (football.vertex1.y < table.y || football.vertex2.y < table.y || football.vertex3.y < table.y) && !checkOff(0);
    return (football.vertex1.y > table.y + table.height || football.vertex2.y > table.y + table.height || football.vertex3.y > table.y + table.height) && !checkOff(1);
}
//Check if the football has fallen off the table (team is 0 when its the home team (player on the bottom) that just hit)
function checkOff(team){
    if(team == 0) return football.center.y < table.y || football.center.x < table.x || football.center.x > table.x+table.width;
    return football.center.y > table.y + table.height || football.center.x < table.x || football.center.x > table.x+table.width;
}
//Switch whos turn it is
function switchTurn(){
    if(game.homeTurn){
        game.homeTurn = false;
    }
    else{
        game.homeTurn = true;
    }
}
//Calculate where each vertex should be
function calculateVertices(){
    //Set up with respect to origin
    let vertex1 = {x: -football.sideLengths[0]/3, y: football.sideLengths[0]/3};
    let vertex2 = {x: -football.sideLengths[0]/3, y: -2*football.sideLengths[0]/3};
    let vertex3 = {x: 2*football.sideLengths[0]/3, y: football.sideLengths[0]/3};
    //The laces
    let designVertices = [
        {x: -football.sideLengths[0]/4, y: -football.sideLengths[0]/4},
        {x: football.sideLengths[0]/4, y: football.sideLengths[0]/4},
        {x: -football.sideLengths[0]/4+football.sideLengths[0]/24, y: -football.sideLengths[0]/24},
        {x: -football.sideLengths[0]/24, y: -football.sideLengths[0]/4+football.sideLengths[0]/24},
        {x: -football.sideLengths[0]/12, y: football.sideLengths[0]/12},
        {x: football.sideLengths[0]/12, y: -football.sideLengths[0]/12},
        {x: football.sideLengths[0]/4-football.sideLengths[0]/24, y: football.sideLengths[0]/24},
        {x: football.sideLengths[0]/24, y: football.sideLengths[0]/4-football.sideLengths[0]/24}
    ]
    //Rotate and translate to the football's position
    football.vertex1.x = vertex1.x * Math.cos(football.angle2D) - vertex1.y * Math.sin(football.angle2D) + football.center.x;
    football.vertex1.y = vertex1.x * Math.sin(football.angle2D) + vertex1.y * Math.cos(football.angle2D) + football.center.y;
    football.vertex2.x = vertex2.x * Math.cos(football.angle2D) - vertex2.y * Math.sin(football.angle2D) + football.center.x;
    football.vertex2.y = vertex2.x * Math.sin(football.angle2D) + vertex2.y * Math.cos(football.angle2D) + football.center.y;
    football.vertex3.x = vertex3.x * Math.cos(football.angle2D) - vertex3.y * Math.sin(football.angle2D) + football.center.x;
    football.vertex3.y = vertex3.x * Math.sin(football.angle2D) + vertex3.y * Math.cos(football.angle2D) + football.center.y;
    football.vertex1.y = flip3D(football.vertex1).y;
    football.vertex2.y = flip3D(football.vertex2).y;
    football.vertex3.y = flip3D(football.vertex3).y;

    for (let i = 0; i < designVertices.length; i++) {
        football.design[i].x = designVertices[i].x * Math.cos(football.angle2D) - designVertices[i].y * Math.sin(football.angle2D) + football.center.x;
        football.design[i].y = designVertices[i].x * Math.sin(football.angle2D) + designVertices[i].y * Math.cos(football.angle2D) + football.center.y;
        football.design[i].y = flip3D(football.design[i]).y;
    }

    
}
//Find the distance from a point to an infinite line defined by two points
function distancePointToInfiniteLine(point, a, b){
    const dx = b.x - a.x;
    const dy = b.y - a.y;

    const length = Math.hypot(dx, dy);
    if (length === 0) return 0;

    // Signed cross product divided by line length
    return (
        dx * (point.y - a.y) -
        dy * (point.x - a.x)
    ) / length;
}
//Check if a point is inside a triangle2D
function isPointInTriangle2D(P, A, B, C){
    const v0x = C.x - A.x;
    const v0y = C.y - A.y;
    const v1x = B.x - A.x;
    const v1y = B.y - A.y;
    const v2x = P.x - A.x;
    const v2y = P.y - A.y;

    const dot00 = v0x * v0x + v0y * v0y;
    const dot01 = v0x * v1x + v0y * v1y;
    const dot02 = v0x * v2x + v0y * v2y;
    const dot11 = v1x * v1x + v1y * v1y;
    const dot12 = v1x * v2x + v1y * v2y;

    const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);

    const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
    const v = (dot00 * dot12 - dot01 * dot02) * invDenom;

    return u > 0 && v > 0 && (u + v < 1);
}
//Find the intersection point of two lines
function intersection(A, B, C, D){
    const EPS = 1e-9;

    function det(a, b, c, d) {
        return a * d - b * c;
    }

    function nearlyEqual(a, b) {
        return Math.abs(a - b) < EPS;
    }

    function pointsEqual(p1, p2) {
        return nearlyEqual(p1.x, p2.x) && nearlyEqual(p1.y, p2.y);
    }

    function onSegment(p, a, b) {
        return (
        p.x >= Math.min(a.x, b.x) - EPS &&
        p.x <= Math.max(a.x, b.x) + EPS &&
        p.y >= Math.min(a.y, b.y) - EPS &&
        p.y <= Math.max(a.y, b.y) + EPS &&
        Math.abs(det(
            b.x - a.x,
            b.y - a.y,
            p.x - a.x,
            p.y - a.y
        )) < EPS
        );
    }

    function isPoint(a, b) {
        return pointsEqual(a, b);
    }

    // Handle degenerate segments (points)
    if (isPoint(A, B) && isPoint(C, D)) {
        return pointsEqual(A, C) ? { ...A } : null;
    }

    if (isPoint(A, B)) {
        return onSegment(A, C, D) ? { ...A } : null;
    }

    if (isPoint(C, D)) {
        return onSegment(C, A, B) ? { ...C } : null;
    }

    const x1 = A.x, y1 = A.y;
    const x2 = B.x, y2 = B.y;
    const x3 = C.x, y3 = C.y;
    const x4 = D.x, y4 = D.y;

    const denom = det(
        x1 - x2,
        y1 - y2,
        x3 - x4,
        y3 - y4
    );

    // Parallel / collinear
    if (Math.abs(denom) < EPS) {

        // Not collinear
        if (
        Math.abs(det(x2 - x1, y2 - y1, x3 - x1, y3 - y1)) >= EPS
        ) {
        return null;
        }

        // Collinear: collect endpoints lying on the opposite segment
        const pts = [];

        [A, B].forEach(p => {
        if (onSegment(p, C, D)) pts.push(p);
        });

        [C, D].forEach(p => {
        if (onSegment(p, A, B)) pts.push(p);
        });

        // Remove duplicates
        const unique = [];
        for (const p of pts) {
        if (!unique.some(q => pointsEqual(p, q))) {
            unique.push({ ...p });
        }
        }

        if (unique.length === 0) return null;
        if (unique.length === 1) return unique[0];

        // Sort along the dominant axis
        const useX = Math.abs(x2 - x1) >= Math.abs(y2 - y1);

        unique.sort((a, b) =>
        useX ? a.x - b.x : a.y - b.y
        );

        return {
        start: unique[0],
        end: unique[unique.length - 1]
        };
    }

    // Proper line intersection
    const px = det(
        det(x1, y1, x2, y2),
        x1 - x2,
        det(x3, y3, x4, y4),
        x3 - x4
    ) / denom;

    const py = det(
        det(x1, y1, x2, y2),
        y1 - y2,
        det(x3, y3, x4, y4),
        y3 - y4
    ) / denom;

    const point = { x: px, y: py };

    return onSegment(point, A, B) && onSegment(point, C, D)
        ? point
        : null;
}
//Calculate the spin of the football
function flip3D(point) {
    const c = Math.cos(football.angle3D);
    // Move to center
    let y = point.y - football.center.y;

    // Rotate about X axis
    let y2 = y * c;

    return new Vec2(point.x, football.center.y+y2);
}
//Draw everything
function draw(timeStamp){
    //Calculate how much time has passed since the last frame
    secondsPassed = (timeStamp - oldTimeStamp) / 1000;
    oldTimeStamp = timeStamp;
    //Clear the canvas
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight); 

    if(game.playing){
        updatePlaying();
        //Draw the table
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.rect(table.x, table.y, table.width, table.height);
        ctx.strokeStyle = "black";
        ctx.stroke();
        ctx.fillStyle = "tan";
        ctx.fill();

        //Draw the sides of the football
        ctx.beginPath();
        ctx.moveTo(football.vertex1.x, football.vertex1.y);
        ctx.lineTo(football.vertex2.x, football.vertex2.y);
        ctx.lineTo(football.vertex3.x, football.vertex3.y);
        ctx.lineTo(football.vertex1.x, football.vertex1.y);
        ctx.strokeStyle = "Black";
        ctx.stroke();
        ctx.fillStyle = "Brown";
        ctx.fill();

        //Draw the laces on the football
        ctx.beginPath();
        ctx.moveTo(football.design[0].x, football.design[0].y);
        ctx.lineTo(football.design[1].x, football.design[1].y);
        ctx.moveTo(football.design[2].x, football.design[2].y);
        ctx.lineTo(football.design[3].x, football.design[3].y);
        ctx.moveTo(football.design[4].x, football.design[4].y);
        ctx.lineTo(football.design[5].x, football.design[5].y);
        ctx.moveTo(football.design[6].x, football.design[6].y);
        ctx.lineTo(football.design[7].x, football.design[7].y);
        ctx.strokeStyle = "white";
        ctx.lineWidth = football.sideLengths[0]/15;
        ctx.stroke();
        ctx.lineWidth = 1;

        //Drawing the scoreboard
        ctx.fillStyle = "black";
        ctx.strokeStyle = "black"
        ctx.font = "bold 32px Arial";
        ctx.textBaseline = 'bottom';
        ctx.textAlign = 'center';
        
        const cellWidth = 75;
        const cellHeight = 40;
        const startX = table.x
        const startY = table.y-10-cellHeight*2;

        ctx.strokeRect(startX, startY, 4*cellWidth, cellHeight*2);
        ctx.beginPath();
        ctx.moveTo(startX, startY+cellHeight);
        ctx.lineTo(startX+4*cellWidth, startY+cellHeight);
        ctx.moveTo(startX+2*cellWidth, startY);
        ctx.lineTo(startX+2*cellWidth, startY+2*cellHeight);
        ctx.moveTo(startX+3*cellWidth, startY);
        ctx.lineTo(startX+3*cellWidth, startY+2*cellHeight);
        ctx.stroke();
        ctx.fillText(game.homeTeam[3], startX+cellWidth, startY+cellHeight);
        ctx.fillText(game.awayTeam[3], startX+cellWidth, startY+2*cellHeight);
        ctx.fillText(game.homeScore, startX+5*cellWidth/2, startY+cellHeight);
        ctx.fillText(game.awayScore, startX+5*cellWidth/2, startY+2*cellHeight);
        ctx.fillText(game.homeOffs, startX+7*cellWidth/2, startY+cellHeight);
        ctx.fillText(game.awayOffs, startX+7*cellWidth/2, startY+2*cellHeight);
    }
    else{
        updateKicking();

        //Draw the table
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.rect(table.x, goal.vertex3.y-10, table.width, table.y+table.height);
        ctx.strokeStyle = "black";
        ctx.stroke();
        ctx.fillStyle = "tan";
        ctx.fill();

        if(kickTime < 2.5){
            //Draw the goal posts
            ctx.beginPath();
            ctx.moveTo(goal.vertex1.x, goal.vertex1.y)
            ctx.lineTo(goal.vertex1.x, goal.vertex2.y)
            ctx.lineTo(goal.vertex2.x, goal.vertex2.y)
            ctx.lineTo(goal.vertex2.x, goal.vertex1.y)
            ctx.moveTo(goal.vertex3.x, goal.vertex2.y)
            ctx.lineTo(goal.vertex3.x, goal.vertex3.y)
            ctx.lineWidth = 20;
            ctx.strokeStyle = "yellow"
            ctx.stroke()
            
            //Draw the sides of the football
            ctx.beginPath();
            ctx.moveTo(football.vertex1.x, football.vertex1.y);
            ctx.lineTo(football.vertex2.x, football.vertex2.y);
            ctx.lineTo(football.vertex3.x, football.vertex3.y);
            ctx.lineTo(football.vertex1.x, football.vertex1.y);
            ctx.lineWidth = 1;
            ctx.strokeStyle = "Black";
            ctx.stroke();
            ctx.fillStyle = "Brown";
            ctx.fill();

            //Draw the laces on the football
            ctx.beginPath();
            ctx.moveTo(football.design[0].x, football.design[0].y);
            ctx.lineTo(football.design[1].x, football.design[1].y);
            ctx.moveTo(football.design[2].x, football.design[2].y);
            ctx.lineTo(football.design[3].x, football.design[3].y);
            ctx.moveTo(football.design[4].x, football.design[4].y);
            ctx.lineTo(football.design[5].x, football.design[5].y);
            ctx.moveTo(football.design[6].x, football.design[6].y);
            ctx.lineTo(football.design[7].x, football.design[7].y);
            ctx.strokeStyle = "white";
            ctx.lineWidth = football.sideLengths[0]/15;
            ctx.stroke();
            ctx.lineWidth = 1;
        }
        else{
            //Draw the sides of the football
            ctx.beginPath();
            ctx.moveTo(football.vertex1.x, football.vertex1.y);
            ctx.lineTo(football.vertex2.x, football.vertex2.y);
            ctx.lineTo(football.vertex3.x, football.vertex3.y);
            ctx.lineTo(football.vertex1.x, football.vertex1.y);
            ctx.lineWidth = 1;
            ctx.strokeStyle = "Black";
            ctx.stroke();
            ctx.fillStyle = "Brown";
            ctx.fill();

            //Draw the laces on the football
            ctx.beginPath();
            ctx.moveTo(football.design[0].x, football.design[0].y);
            ctx.lineTo(football.design[1].x, football.design[1].y);
            ctx.moveTo(football.design[2].x, football.design[2].y);
            ctx.lineTo(football.design[3].x, football.design[3].y);
            ctx.moveTo(football.design[4].x, football.design[4].y);
            ctx.lineTo(football.design[5].x, football.design[5].y);
            ctx.moveTo(football.design[6].x, football.design[6].y);
            ctx.lineTo(football.design[7].x, football.design[7].y);
            ctx.strokeStyle = "white";
            ctx.lineWidth = football.sideLengths[0]/15;
            ctx.stroke();
            ctx.lineWidth = 1;

            //Draw the goal posts
            ctx.beginPath();
            ctx.moveTo(goal.vertex1.x, goal.vertex1.y)
            ctx.lineTo(goal.vertex1.x, goal.vertex2.y)
            ctx.lineTo(goal.vertex2.x, goal.vertex2.y)
            ctx.lineTo(goal.vertex2.x, goal.vertex1.y)
            ctx.moveTo(goal.vertex3.x, goal.vertex2.y)
            ctx.lineTo(goal.vertex3.x, goal.vertex3.y)
            ctx.lineWidth = 20;
            ctx.strokeStyle = "Yellow"
            ctx.stroke()
        }
        //Drawing the scoreboard
        ctx.fillStyle = "black";
        ctx.strokeStyle = "black"
        ctx.font = "bold 32px Arial";
        ctx.textBaseline = 'bottom';
        ctx.textAlign = 'center';
        ctx.lineWidth = 1;
        
        const cellWidth = 75;
        const cellHeight = 40;
        const startX = table.x
        const startY = table.y-10-cellHeight*2;

        ctx.strokeRect(startX, startY, 4*cellWidth, cellHeight*2);
        ctx.beginPath();
        ctx.moveTo(startX, startY+cellHeight);
        ctx.lineTo(startX+4*cellWidth, startY+cellHeight);
        ctx.moveTo(startX+2*cellWidth, startY);
        ctx.lineTo(startX+2*cellWidth, startY+2*cellHeight);
        ctx.moveTo(startX+3*cellWidth, startY);
        ctx.lineTo(startX+3*cellWidth, startY+2*cellHeight);
        ctx.stroke();
        ctx.fillText(game.homeTeam[3], startX+cellWidth, startY+cellHeight);
        ctx.fillText(game.awayTeam[3], startX+cellWidth, startY+2*cellHeight);
        ctx.fillText(game.homeScore, startX+5*cellWidth/2, startY+cellHeight);
        ctx.fillText(game.awayScore, startX+5*cellWidth/2, startY+2*cellHeight);
        ctx.fillText(game.homeOffs, startX+7*cellWidth/2, startY+cellHeight);
        ctx.fillText(game.awayOffs, startX+7*cellWidth/2, startY+2*cellHeight);
    }
    window.requestAnimationFrame(draw);
}
//Next tick
window.requestAnimationFrame(draw);