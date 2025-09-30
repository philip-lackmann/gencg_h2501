function shiftStroke(color1, color2, speed = 0.01, t = 0) {
    let amt = t;  // start at given offset
    let dir = 1;

    return function () {
        // update interpolation amount
        amt += speed * dir;
        if (amt > 1 || amt < 0) {
            dir *= -1;
            amt = constrain(amt, 0, 1);
        }

        // set stroke to interpolated color
        let c = lerpColor(color1, color2, amt);
        stroke(c);
    };
}
