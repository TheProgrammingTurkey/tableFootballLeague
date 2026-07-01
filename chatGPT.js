const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let secondsPassed = 0;
let oldTimeStamp = 0;

canvas.height = Math.floor(window.innerHeight);
canvas.width = Math.floor(window.innerWidth);

const toggledKeys = {};

const football = {
    x: canvas.width * 0.5,
    y: canvas.height * 0.5,
    radius: 48,
    angle: 0,
    vx: 0,
    vy: 0,
    angularVelocity: 0,
    mass: 1,
    lastCollisionTime: 0
};

const mouse = {
    x: 0,
    y: 0
};

document.addEventListener('keydown', event => {
    toggledKeys[event.code] = true;
    event.preventDefault();
});

document.addEventListener('keyup', event => {
    toggledKeys[event.code] = false;
    event.preventDefault();
});

document.addEventListener('mousemove', function(event) {
    const prevMouse = { x: mouse.x, y: mouse.y };
    const nextMouse = { x: event.clientX, y: event.clientY };

    if (prevMouse.x !== 0 || prevMouse.y !== 0) {
        if (segmentIntersectsCircle(prevMouse, nextMouse, football)) {
            applyCollision(prevMouse, nextMouse);
        }
    }

    mouse.x = nextMouse.x;
    mouse.y = nextMouse.y;
});

function update(dt) {
    football.x += football.vx * dt;
    football.y += football.vy * dt;
    football.angle += football.angularVelocity * dt;

    football.vx *= 0.95;
    football.vy *= 0.95;
    football.angularVelocity *= 0.92;

    if (football.x - football.radius < 0) {
        football.x = football.radius;
        football.vx *= -0.6;
    } else if (football.x + football.radius > canvas.width) {
        football.x = canvas.width - football.radius;
        football.vx *= -0.6;
    }

    if (football.y - football.radius < 0) {
        football.y = football.radius;
        football.vy *= -0.6;
    } else if (football.y + football.radius > canvas.height) {
        football.y = canvas.height - football.radius;
        football.vy *= -0.6;
    }
}

function drawBall() {
    ctx.save();
    ctx.translate(football.x, football.y);
    ctx.rotate(football.angle);

    ctx.beginPath();
    ctx.moveTo(0, -football.radius);
    ctx.lineTo(-football.radius * 0.82, football.radius * 0.95);
    ctx.lineTo(football.radius * 0.82, football.radius * 0.95);
    ctx.closePath();

    ctx.fillStyle = '#f3f3f3';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#222';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, football.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#e44';
    ctx.fill();

    ctx.restore();
}

function draw(timeStamp) {
    secondsPassed = (timeStamp - oldTimeStamp) / 1000;
    oldTimeStamp = timeStamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    update(secondsPassed);
    drawBall();

    window.requestAnimationFrame(draw);
}

function segmentIntersectsCircle(p1, p2, circle) {
    const closest = closestPointOnSegment(p1, p2, { x: circle.x, y: circle.y });
    const dx = circle.x - closest.x;
    const dy = circle.y - closest.y;
    return Math.hypot(dx, dy) <= circle.radius;
}

function closestPointOnSegment(a, b, p) {
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const apx = p.x - a.x;
    const apy = p.y - a.y;
    const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / (abx * abx + aby * aby)));
    return { x: a.x + abx * t, y: a.y + aby * t };
}

function applyCollision(p1, p2) {
    const now = performance.now();
    if (now - football.lastCollisionTime < 80) {
        return;
    }

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const speed = Math.hypot(dx, dy);

    if (speed < 1) {
        return;
    }

    const collisionDirection = { x: dx / speed, y: dy / speed };
    const impactPoint = closestPointOnSegment(p1, p2, { x: football.x, y: football.y });
    const offsetFromCenter = {
        x: impactPoint.x - football.x,
        y: impactPoint.y - football.y
    };

    const impactForce = Math.min(speed * 0.035, 250);
    const tangential = { x: collisionDirection.x, y: collisionDirection.y };

    football.vx += collisionDirection.x * impactForce + tangential.x * speed * 20;
    football.vy += collisionDirection.y * impactForce + tangential.y * speed * 20;
    football.angularVelocity += ((offsetFromCenter.x * collisionDirection.y) - (offsetFromCenter.y * collisionDirection.x)) * 0.018 * speed;

    football.lastCollisionTime = now;
}

window.requestAnimationFrame(draw);
