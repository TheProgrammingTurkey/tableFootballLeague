//Vectors
class Vec2{
    constructor(x,y){
        this.x = x;
        this.y = y;
    }
    addScale(other, speed) {
        this.x += other.x * speed;
        this.y += other.y * speed;
    }
    // subScale(other, speed) {
    //     this.x -= other.x * speed;
    //     this.y -= other.y * speed;
    // }
    // difference(other) {
    //     return new Vec2(this.x - other.x, this.y - other.y);
    // }
    product(val) {
        return new Vec2(this.x * val, this.y * val);
    }
    // dot(v) {
    //     return this.x * v.x + this.y * v.y;
    // }
    magnitude(){
        return Math.hypot(this.x, this.y);
    }
}