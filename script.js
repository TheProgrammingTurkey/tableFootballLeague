let canvas = document.getElementById('game');
let ctx = canvas.getContext('2d');
let secondsPassed = 0;
let oldTimeStamp = 0;

//sets canvas fullscreen
canvas.height = Math.floor(window.innerHeight);
canvas.width = Math.floor(window.innerWidth);

//creates key object (kind of array)
let toggledKeys = {};

//Set up the table
let table = {
    x: 100,
    y: 100,
    height: canvas.height - 200,
    width: canvas.width - 200,
}

//Set up the football
let football = {
    vertex1: new Vec2,
    vertex2: new Vec2,
    vertex3: new Vec2,
    center: new Vec2(canvas.width/2, canvas.height-2*table.y),
    sideLengths: [58, 82],
    mass: 1,
    velocity: new Vec2(0, 0),
    angularVelocity: 0,
    angle: 0,
};
//Calculate the center of mass of the football
calculateVertices();
//Set up the mouse
let mouse = {
    position: new Vec2(football.center.x, football.center.y),
};

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
document.addEventListener("mousemove", function(event) {
    //Calculate Where the mouse hit the sides of the football
    const intersectionPoints = checkBallHit();
    //If the mouse didn't hit the football, don't do anything
    if((intersectionPoints[0] == null && intersectionPoints[1] == null && intersectionPoints[2] == null) || football.velocity.x != 0 || football.velocity.y != 0){
        mouse.position.x = event.clientX;
        mouse.position.y = event.clientY;
        return;
    }
    //Handle the result of the collision
    calculateCollision(intersectionPoints);
    mouse.position.x = event.clientX;
    mouse.position.y = event.clientY;
});

function update() {
    //Move the football
    football.center.addScale(football.velocity, secondsPassed*500);
    football.angle += football.angularVelocity*secondsPassed;
    //Calculate the vertices of the football
    calculateVertices();
    //Friction
    football.velocity = football.velocity.product(57*secondsPassed);
    football.angularVelocity *= 57*secondsPassed;
    //Round the velocity
    football.velocity.x = Math.round(football.velocity.x*1000)/1000;
    football.velocity.y = Math.round(football.velocity.y*1000)/1000;
    football.angularVelocity = Math.round(football.angularVelocity*1000)/1000;
    //If the velocity is small enough, no more velocity
    if(football.velocity.magnitude() < 0.01){
        football.velocity.x = 0;
        football.velocity.y = 0;
        football.angularVelocity = 0;
    }
    
}
//Check if the mouse hit any of the sides of the football
function checkBallHit() {
    let mouseStart = {x: mouse.position.x, y: mouse.position.y};
    let mouseEnd = {x: event.clientX, y: event.clientY};
    //If the contact comes from within the football, dont do anything
    if(isPointInTriangle(mouseStart, football.vertex1, football.vertex2, football.vertex3)) return [null, null, null];
    return [intersection(mouseStart, mouseEnd, football.vertex1, football.vertex2), intersection(mouseStart, mouseEnd, football.vertex2, football.vertex3), intersection(mouseStart, mouseEnd, football.vertex3, football.vertex1)];
}
//Find the intersection point of two lines
function intersection(A, B, C, D) {
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
//Handle the collision between the mouse and the football
function calculateCollision(intersectionPoints) {
    const mouseStart = {x: mouse.position.x, y: mouse.position.y};
    const mouseEnd = {x: event.clientX, y: event.clientY};
    //Find how far the mouse is from the COM of the football --> how much the football should spin
    let spinAmt = distancePointToInfiniteLine(football.center, mouseStart, mouseEnd);
    //Find the angle of the mouse movement
    let angle = Math.atan2(mouseEnd.y - mouseStart.y, mouseEnd.x - mouseStart.x);
    //Calculate the force of the mouse onto the football
    const force = .0035*Math.hypot(mouseEnd.x - mouseStart.x, mouseEnd.y - mouseStart.y) / secondsPassed;
    const time = .3;
    const impulse = force*time;
    //Apply the impulse to the football's velocity
    football.velocity.x = (impulse/football.mass)*Math.cos(angle)/Math.max(1, Math.abs(spinAmt)/10);
    football.velocity.y = (impulse/football.mass)*Math.sin(angle)/Math.max(1, Math.abs(spinAmt)/10);
    football.angularVelocity = (impulse/football.mass)*spinAmt/2;
}
//Find the distance from a point to an infinite line defined by two points
function distancePointToInfiniteLine(point, a, b) {
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
//Check if a point is inside a triangle
function isPointInTriangle(P, A, B, C) {
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
//Calculate where each vertex should be
function calculateVertices() {
    //Set up with respect to origin
    const vertex1 = {x: -football.sideLengths[0]/3, y: football.sideLengths[0]/3};
    const vertex2 = {x: -football.sideLengths[0]/3, y: -2*football.sideLengths[0]/3};
    const vertex3 = {x: 2*football.sideLengths[0]/3, y: football.sideLengths[0]/3};
    //Rotate and translate to the football's position
    football.vertex1.x = vertex1.x * Math.cos(football.angle) - vertex1.y * Math.sin(football.angle) + football.center.x;
    football.vertex1.y = vertex1.x * Math.sin(football.angle) + vertex1.y * Math.cos(football.angle) + football.center.y;
    football.vertex2.x = vertex2.x * Math.cos(football.angle) - vertex2.y * Math.sin(football.angle) + football.center.x;
    football.vertex2.y = vertex2.x * Math.sin(football.angle) + vertex2.y * Math.cos(football.angle) + football.center.y;
    football.vertex3.x = vertex3.x * Math.cos(football.angle) - vertex3.y * Math.sin(football.angle) + football.center.x;
    football.vertex3.y = vertex3.x * Math.sin(football.angle) + vertex3.y * Math.cos(football.angle) + football.center.y;
}
//Draw everything
function draw(timeStamp) {
    //Calculate how much time has passed since the last frame
    secondsPassed = (timeStamp - oldTimeStamp) / 1000;
    oldTimeStamp = timeStamp;
    //Clear the canvas
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);    
    update();
    //Draw the sides of the football
    ctx.beginPath();
    ctx.moveTo(football.vertex1.x, football.vertex1.y);
    ctx.lineTo(football.vertex2.x, football.vertex2.y);
    ctx.lineTo(football.vertex3.x, football.vertex3.y);
    ctx.lineTo(football.vertex1.x, football.vertex1.y);
    ctx.strokeStyle = "Black";
    ctx.stroke();
    ctx.fillStyle = "black";
    ctx.fill();

    ctx.beginPath();
    ctx.rect(table.x, table.y, table.width, table.height);
    ctx.strokeStyle = "black";
    ctx.stroke();

    window.requestAnimationFrame(draw);
}

window.requestAnimationFrame(draw);
