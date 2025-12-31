# Project
The main concept for this project is to create a drawing machine using finger tracking to control different parameters,
based on how much each finger is curled. This allows for many different combinations, since you end up with 10 inputs, 
which can have any value between 0 and 1. The body can therefore be used as an expressive tool to generate different outputs.

I wanted to realize this in 3D to make the experience more immersive, so I decided that shaders are the best approach
to make this work.

My main inspiration for the visuals comes from psychedelic artwork, such as this: [https://www.pinterest.com/stevebroache/fractals/](https://www.pinterest.com/stevebroache/fractals/)

Fractals can also be found throughout nature: [https://www.mathnasium.com/math-centers/hydepark/news/fractals-in-nature](https://www.mathnasium.com/math-centers/hydepark/news/fractals-in-nature)
Although, seemingly chaotic, they consist of simple repeating shapes - in the digital world based on mathematical functions.

## Iteration 01
In the beginning I used A-Frame to use the built-in hand tracking. However, it was tricky to get to work and
a limitation was that it only works with a VR headset supporting hand tracking.
{% raw %}
<iframe src="content/project2/iteration-01/embed.html" width="100%" height="450" frameborder="no"></iframe>
{% endraw %}

## Iteration 02
Due to the limitation mentioned in iteration 01 I switched to ml5.js together with p5.js for the visuals.
For a simple proof of concept I used the hand tracking to make the index finger interpolate the color of the shader.
{% raw %}
<iframe src="content/project2/iteration-02/embed.html" width="100%" height="450" frameborder="no"></iframe>
{% endraw %}

## Presented Final Project
Finally, I took a deeper dive into the world of shaders and found a shader creating fractal patterns from circles with 
differently tiled grids layered over each other.

Credits: [https://www.shadertoy.com/view/mtyGWy](https://www.shadertoy.com/view/mtyGWy)

I then edited this shader to manipulate different parameters using the curl of the fingers.
Thumb: Scale the sphere object the shader is on. This allows to view the sphere from outside and inside.
Index: Scaling the UVs to "zoom" the texture.
Middle: Distorting the UVs with noise.
Ring: Interpolating between two color palettes.
Pinky: Increasing the color contrast.

{% raw %}
<iframe src="content/project2/iteration-03/embed.html" width="100%" height="450" frameborder="no"></iframe>
{% endraw %}

## What's next / Updated Final Project
I wanted to expand on the shader, which was visually still close to the code reference, using circles for signed distance functions.
Additionally, I wanted something closer to my initial inspiration, with organic patterns, inspired by nature.

One option is using cellular noise, such as Voronoi, to create more organic patterns: [https://thebookofshaders.com/12/](https://thebookofshaders.com/12/)

Additionally, using more extreme domain warping could create some interesting effects, by distorting the UV coordinates,
like wrinkling a paper: [https://thebookofshaders.com/13/](https://thebookofshaders.com/13/)

After implementing both of these I mapped the blend between pure coral-like voronoi to heavily warped fluid-like visuals to a finger.
I also reduced the intensity of scaling the sphere and UVs, because, although being able to jump in and outside of the sphere
it felt very unstable. 

I also wanted some more contrasting colors to make the effect more extreme in that regard.
Finally, I changed some mappings of parameters to the fingers, considering that the ring finger and pinky use the same
tendon and therefore move together, while thumb and index are most independent.

Thumb: Scale the sphere object the shader is on and the UVs
Index: Morphing between clean, coral-like voronoi and fluid-like warping / distortion.
Middle: Interpolating between two color palettes.
Ring: Changing the speed of time-based modulation.
Pinky: Increase / decrease the color contrast.

{% raw %}
<iframe src="content/project2/embed.html" width="100%" height="450" frameborder="no"></iframe>
<p><strong>Final Recording</strong></p>
<video width="640" controls>
  <source src="content/project2/recording.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>
{% endraw %}
