# Day 01

## Computing without computer

### Sprout
Dots are placed randomly. Two players take turns to connect two dots each time.
If a dot has three connections it cannot be used anymore.
If a player cannot draw a new connection without crossing another one the other player wins.

[//]: # (add photo from class here)
![Example Image](content/day01/test.jpg)

## Playing around with p5
### Mountain Skiers
The original idea was not to create something resembling mountains.
To explore p5 for the first time I simply drew lines across the window at random angles.
I then drew other shapes to erase those lines at random positions.
By playing around with parameters and by chance I was left with lines somewhat resembling mountains.
So not only did I generate art, but my concept of what I wanted to make generated itself, step by step.

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
