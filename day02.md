# Day 02
## Grids
### Pendulums in a Grid
Double pendulums can be very chaotic with only slight changes in parameters.
But if we use a double pendulum to draw a trail patterns start to emerge.

Here I mirror the trail multiple times around the physics simulated pendulum to generate a kaleidoscopic flower-like shape.
Next, I place multiple of these pendulums in a grid, shift each row's position to make the overall composition a bit more interesting,
and finally shift the colors of the trails the pendulums leave.

{% raw %}
<iframe src="content/day02/01/embed.html" width="100%" height="450" frameborder="no"></iframe>
{% endraw %}

### Mona Lisa
Two images are sampled at the coordinates of a grid.
The color of the pixel at that coordinate decides the color and size of the circle then drawn in the grid.
By interpolating between the color of a pixel from both images a morphing effect is achieved.

{% raw %}
<div style="position:relative;width:100%;padding-bottom:150%;height:0;overflow:hidden;">
  <iframe 
    src="content/day02/02/embed.html" 
    style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;">
  </iframe>
</div>
{% endraw %}





[//]: # (    How did your initial paper sketches influence your digital pattern? Did anything change in translation?)

[//]: # (    What strategies did you use to balance order and randomness in your grid or pattern?)

[//]: # (    Describe a moment when a mistake or unexpected result led to a new idea or direction.)

[//]: # (    How did you approach making your pattern “infinite” or seamlessly tileable? What challenges did you face?)

[//]: # (    How did working with code change your perception of artistic control compared to analog methods?)

[//]: # (    What did you learn about the relationship between simple rules and complex outcomes?)
