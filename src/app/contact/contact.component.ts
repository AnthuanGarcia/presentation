import { Component, OnInit, AfterViewInit } from '@angular/core';
import { interval } from 'rxjs';

import { main } from '../utils/loader';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent implements OnInit, AfterViewInit {
  fragmentShader = `
    uniform vec3      iResolution;           // viewport resolution (in pixels)
    uniform float     iTime;                 // shader playback time (in seconds)
    uniform float     iTimeDelta;            // render time (in seconds)
    uniform int       iFrame;                // shader playback frame
    uniform float     iChannelTime[4];       // channel playback time (in seconds)
    uniform vec3      iChannelResolution[4]; // channel resolution (in pixels)
    uniform vec4      iMouse;                // mouse pixel coords. xy: current (if MLB down), zw: click
    uniform sampler2D iChannel0, iChannel1, iChannel2, iChannel3;         // input channel. XX = 2D/Cube
    uniform vec4      iDate;                 // (year, month, day, time in seconds)
    uniform float     iSampleRate;           // sound sample rate (i.e., 44100)

    const int octaves = 4;

    vec2 random2(vec2 st){
      vec2 t = vec2(texture(iChannel0, st/1023.).x, texture(iChannel0, st/1023.+.5).x);
      return t*t*4.;
    }

    // Value Noise by Inigo Quilez - iq/2013
    // https://www.shadertoy.com/view/lsf3WH
    float noise(vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);

        vec2 u = f*f;

        return mix( mix( dot( random2(i + vec2(0.0,0.0) ), f - vec2(0.0,0.0) ), 
                        dot( random2(i + vec2(1.0,0.0) ), f - vec2(1.0,0.0) ), u.x),
                    mix( dot( random2(i + vec2(0.0,1.0) ), f - vec2(0.0,1.0) ), 
                        dot( random2(i + vec2(1.0,1.0) ), f - vec2(1.0,1.0) ), u.x), u.y);
    }

    float fbm1(in vec2 _st) {
      float v = 0.0;
      float a = 0.5;
      vec2 shift = vec2(100.0);
      // Rotate to reduce axial bias
      mat2 rot = mat2(cos(0.5), sin(0.5),
                      -sin(0.5), cos(0.50));
      for (int i = 0; i < octaves; ++i) {
          v += a * noise(_st);
          _st = rot * _st * 2.0 + shift;
          a *= 0.4;
      }
      return v;
    }

    float pattern(vec2 uv, float time, inout vec2 q, inout vec2 r) {

      r = vec2( fbm1( uv * .1 + 4.0*q + vec2(1.7 - time / 2.,9.2) ),
                    fbm1( uv + 4.0*q + vec2(8.3 - time / 2.,2.8) ) );

      q = r * fbm1(uv + vec2(time, 0.33));

      //vec2 s = vec2( fbm1( uv + 5.0*r + vec2(21.7 - time / 2.,90.2) ),
      //              fbm1( uv * .05 + 5.0*r + vec2(80.3 - time / 2.,20.8) ) ) * .25;

      return fbm1( uv * .05 + 4.0 );
    }


    vec2 getScreenSpace() {
      vec2 uv = (gl_FragCoord.xy - 0.5 * iResolution.xy) / min(iResolution.y, iResolution.x);
      
      return uv;
    }

    void mainImage( out vec4 fragColor, in vec2 fragCoord )
    {
      // Normalized pixel coordinates (from 0 to 1)
      vec2 uv = getScreenSpace();

        
      float time = iTime / 10.;
        
      mat2 rot = mat2(cos(time / 10.), sin(time / 10.),
                        -sin(time / 10.), cos(time / 10.));
        
      uv = rot * uv;
      uv *= 0.9 * (sin(time)) + 3.;
      uv.x -= time / 5.;
        
      vec2 q = vec2(0.,0.);
      vec2 r = vec2(0.,0.);
        
      float _pattern = 0.;
        
      
      _pattern = pattern(uv, time, q, r);
    
      vec3 colour = vec3(_pattern) * 2.;
      colour.r -= dot(q, r) * 15.;
      colour = mix(colour, vec3(pattern(r, time, q, r), dot(q, r) * 15., -0.1), .5);
      colour -= q.y * 1.5;
      colour = mix(colour, vec3(.2, .2, .2), (clamp(q.x, -1., 0.)) * 3.);
      
      fragColor = vec4(-colour + (abs(colour) * 2.), 1./length(q));
    }

    void main() {
      mainImage(gl_FragColor, gl_FragCoord.xy);
    }
  `;

  shadowColor: string[] = [
    'rgba(255, 251, 0, 0.3)',
    'rgba(248, 120, 210, 0.3)',
    'rgba(246, 134, 6, 0.3)'
  ];

  idx: number = 0;

  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    main(
      this.fragmentShader,
      'app-contact',
      '#c4',
      'https://i.ibb.co/Vp6NnG8/noise.png'
    );

    interval(2000).subscribe(() => {
      this.idx = this.idx >= this.shadowColor.length ? 0 : this.idx + 1;
    })
  }

}
