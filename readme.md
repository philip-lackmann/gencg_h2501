# Day 01

## Computing without computer

### Sprout
Dots are placed randomly. Two players take turns to connect two dots each time. 
If a dot has three connections it cannot be used anymore. 
If a player cannot draw a new connection without crossing another one the other player wins.

[//]: # (add photo from class here)
![Example Image](content/day01/test.jpg)

```js
// Javascript code with syntax highlighting.
var fun = function lang(l) {
  dateformat.i18n = require('./lang/' + l)
  return true;
}
```

## Playing around with p5
### Mountain Skiers
The original idea was not to create something resembling mountains.
To explore p5 for the first time I simply drew lines across the window at random angles.
I then drew other shapes to erase those lines at random positions.
By playing around with parameters and by chance I was left with lines somewhat resembling mountains.

I expanded on that and now I am left with choosing random positions on the screen, drawing two lines downwards at an angle to create
the mountain ridge. 

Next, I calculate the outside bounds of the mountain ridge to create a shape where I draw some more random dots
that move, resembling falling snow. 

I use some more randomly placed dots that move downwards and to the side randomly, which are
occluded by the shape outside of the mountain ridge and placed at the top of the screen again once they reach the bottom. 
These randomly placed dots then leave a trail to resemble skiers going down the mountains.

{% raw %}
<iframe src="content/day01/01/embed.html" width="100%" height="450" frameborder="no"></iframe>
{% endraw %}

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
