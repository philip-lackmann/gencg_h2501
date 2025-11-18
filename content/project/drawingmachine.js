AFRAME.registerShader('my-shader', {
    schema: {
        thickness:       { type: 'number', default: 0.5,  is: 'uniform' },
        colorMix:        { type: 'number', default: 0.5,  is: 'uniform' },
        displacementAmp: { type: 'number', default: 0.15, is: 'uniform' },
        noiseScale:      { type: 'number', default: 4.0,  is: 'uniform' },
        time:            { type: 'number', default: 0.0,  is: 'uniform' },

        // lighting uniforms
        lightDirection:   { type: 'vec3', default: { x: 0.3, y: 0.5, z: 0.2 }, is: 'uniform' },
        ambientIntensity: { type: 'number', default: 0.3,  is: 'uniform' },
        diffuseIntensity: { type: 'number', default: 0.8,  is: 'uniform' }
    },

    transparent: true,

    vertexShader: `
        varying float vThickness;
        varying float vColorMix;
        varying vec3 vNormal;
    
        uniform float thickness;
        uniform float colorMix;
        uniform float displacementAmp;
        uniform float noiseScale;
        uniform float time;
    
        // Cheap hash-based "noise"
        float hash(vec3 p) {
          return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
        }
    
        void main() {
          vThickness = thickness;
          vColorMix = colorMix;
    
          // normal in view space for lighting
          vNormal = normalize(normalMatrix * normal);
    
          // sample a pseudo-noise value using the normal, scaled + animated by time
          float n = hash(normal * noiseScale);
          float t = time * 0.5;
          float disp = sin(n * 6.2831 + t) * displacementAmp;
    
          vec3 displacedPosition = position + normal * disp;
    
          gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);
        }
  `,

    fragmentShader: `
        varying float vColorMix;
        varying vec3 vNormal;
    
        uniform vec3  lightDirection;
        uniform float ambientIntensity;
        uniform float diffuseIntensity;
    
        void main() {
          // base colors mixed by vColorMix
          vec3 colorA = vec3(1.0, 0.0, 0.0); // red
          vec3 colorB = vec3(0.0, 0.0, 1.0); // blue
          vec3 baseColor = mix(colorA, colorB, vColorMix);
    
          // simple Lambert lighting
          vec3 n = normalize(vNormal);
          vec3 l = normalize(lightDirection);
    
          // because you're *inside* the sphere and using side: back,
          // you might want to flip the normal or light direction:
          float lambert = max(dot(n, l), 0.0);
    
          float light = ambientIntensity + diffuseIntensity * lambert;
    
          vec3 finalColor = baseColor * light;
    
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `
});

AFRAME.registerComponent('drawing-machine', {
    init: function () {
        this.handComp = null;
        this.elapsed = 0;
    },

    tick: function (time, timeDelta) {
        const handEl = document.querySelector('#handTracker');
        this.handComp = handEl.components['hand-params'];

        const fingers = this.handComp && this.handComp.fingerParams;

        const setUniforms = (thickness, colorMix) => {
            this.el.setAttribute('material', 'thickness', thickness);
            this.el.setAttribute('material', 'colorMix', colorMix);
        };

        this.el.setAttribute('material', 'time', (time / 1000));

        // Fallback demo mode
        if (!fingers || !fingers.length) {
            this.elapsed += (timeDelta || 16) / 1000;
            const thickness = 0.5 + 0.5 * Math.sin(this.elapsed);
            const colorMix = 0.5 + 0.5 * Math.sin(this.elapsed * 0.6 + Math.PI / 2);
            setUniforms(thickness, colorMix);
            return;
        }

        // With hand tracking
        fingers.forEach(({ fingerIndex, curl, distanceToPalm }) => {
            if (fingerIndex === 1) {
                setUniforms(curl, distanceToPalm);
            }
        });
    }
});
