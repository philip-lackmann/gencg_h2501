# Day 02
## Grids
### Pendulums in a Grid
Double pendulums can be very chaotic with only slight changes in parameters.
But if we use a double pendulum to draw a trail patterns start to emerge.
The main inspiration for this was this YouTube video: [Double Pendulums are Chaoticn't](https://www.youtube.com/watch?v=dtjb2OhEQcU)

To simulate the physics of a double pendulum I used matter js.
I mirror the trail multiple times around the physics simulated pendulum to generate a symmetric, kaleidoscopic flower-like shape.
Next, I place multiple of these pendulums in a grid. I shift each row's position to make them overlap seamlessly. 
Completely overlaying one pendulum over the other (with fill) creates some depth. 
Finally, I shift the colors of the trails the pendulums leave, for a more mesmerizing effect.

I played around with some different values for the physics handles, to see how it would affect the patterns, and also
to keep the pendulum swinging around for long enough. At times the pendulum would simply not swing enough to draw
any interesting patterns, at other times it got very chaotic. I noticed that if the pendulum would "swing out", instead of
continuously applying more force, I ended up with more variety in the patterns over time.

{% raw %}
<iframe src="content/day02/01/embed.html" width="100%" height="450" frameborder="no"></iframe>
{% endraw %}

### Mona Lisa
This work started from the simple idea that an image is already a grid made of pixels.
I wanted to see how two images could morph into each other by sampling both images at the same grid positions
and interpolating between their pixel values. 

Each pixel gets translated into a circle, where the color (and also the size) comes from the sampled data, 
which creates the morphing effect. I ended up thinking about uncanny or slightly scary imagery and somehow landed on
the Mona Lisa, based on a distorted version I remembered that mixed her with The Scream.
That reference influenced the overall mood of the sketch.

{% raw %}
<div style="position:relative;width:100%;padding-bottom:150%;height:0;overflow:hidden;">
  <iframe 
    src="content/day02/02/embed.html" 
    style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;">
  </iframe>
</div>
{% endraw %}
