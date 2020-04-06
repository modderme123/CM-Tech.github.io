precision highp float;
precision mediump sampler2D;

varying vec2 coords;
uniform sampler2D density;
uniform sampler2D velocity;
uniform sampler2D page;
uniform sampler2D logo;
uniform vec2 texelSize;
uniform float scroll;
uniform float breakpoint1;
uniform float breakpoint2;

uniform float breakpoint3;
uniform float time;

float colorDistance(vec3 a,vec3 b){
    return length(a-b);
}
//	Classic Perlin 3D Noise 
//	by Stefan Gustavson
//
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
vec3 fade(vec3 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}

float cnoise(vec3 P){
  vec3 Pi0 = floor(P); // Integer part for indexing
  vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
  Pi0 = mod(Pi0, 289.0);
  Pi1 = mod(Pi1, 289.0);
  vec3 Pf0 = fract(P); // Fractional part for interpolation
  vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = ixy0 / 7.0;
  vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 / 7.0;
  vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
  return 2.2 * n_xyz;
}
vec3 rgb(int a,int b,int c){
    return vec3(float(a)/255.0,float(b)/255.0,float(c)/255.0);
}
#define addToPalette(a,b,c) if(colorDistance(blendedColor, rgb(a,b,c))<colorDistance(blendedColor,bestColorMatch)) bestColorMatch=rgb(a,b,c);

vec3 getColorAt(vec2 uv){
    vec3 color=texture2D(density, uv).xyz;
    float alpha=clamp(texture2D(density, uv).w,0.0,1.0);
    color=clamp(color,0.0,1.0); //sometimes the color might have a really high component that we need to tune down
    color.xyz=color.xyz;
    vec2 proj=(uv/texelSize-0.1*texture2D(velocity, uv).xy*1.0)+vec2(0,-scroll)/texelSize;
    vec3 bk=vec3(1.0);
    vec2 pageCoord=(uv-0.1*texture2D(velocity, uv).xy*texelSize.xy);

    if(1.0-pageCoord.y+scroll>breakpoint1){
        bk=rgb(255, 200, 67);
    }
    if(1.0-pageCoord.y+scroll>breakpoint1*coords.x+breakpoint3*(1.-coords.x)){
        bk=rgb(246, 85, 75);//(218, 24, 0);
    }
     if(1.0-pageCoord.y+scroll>breakpoint3){
        bk=vec3(1.0);
    }
    vec4 pgt=texture2D(page, vec2(0.0,1.0)+pageCoord*vec2(1.0,-1.0)).xyzw;
    vec2 lpos = vec2(pageCoord.x - 0.5, 0.5 - pageCoord.y+scroll+0.275) /texelSize.xy*texelSize.y * 3.0 + vec2(0.5, 0.5);
    vec4 pgt2=texture2D(logo,lpos).xyzw;
    pgt.xyzw=pgt2*pgt2.w+(1.0-pgt2.w)*pgt;
    pgt.xyz=vec3(1.0,1.0,1.0)*(pgt.xyz-vec3(0.5))+vec3(0.5);
    bk=bk*(1.0-pgt.w)+pgt.w*pgt.xyz;
    vec3 blendedColor=bk*(1.0*max(0.0,1.0-alpha)+color*alpha);
    if(length(color.xyz)>pow(2.0,0.5)){
        blendedColor=bk*(1.0*max(0.0,1.0-alpha))+(color*alpha);
    }
    vec3 bestColorMatch=vec3(243.0/255.0);
    addToPalette(211, 68, 176);
    addToPalette(7, 179, 227);
    addToPalette(246, 85, 75);
    addToPalette(47, 200, 120);
    addToPalette(250, 112, 21);
    addToPalette(8, 180, 227);
    addToPalette(255, 200, 67);
    addToPalette(15, 51, 163);
    addToPalette(12,12,12);
    // addToPalette(218, 24, 0);
    addToPalette(0, 140, 60);
    
    return mix(bestColorMatch,vec3(1.0),0.0);
}
float getPerlinAt(vec2 uv){
    
    vec2 proj=(uv/texelSize-0.1*texture2D(velocity, uv).xy*1.0)+vec2(0,-scroll)/texelSize;
   return abs(mod(cnoise(vec3(proj-0.5/texelSize,time*5.0)/100.0)*8.0,1.0)-0.5);
}
void main () {
    vec2 proj=(coords/texelSize-0.1*texture2D(velocity, coords).xy*1.0)+vec2(0.0,-scroll)/texelSize;
    gl_FragColor = vec4(0.25*(getColorAt(coords+texelSize*vec2(0.0,0.0))+
    getColorAt(coords+texelSize*vec2(0.0,0.5))+
    getColorAt(coords+texelSize*vec2(0.5,0.0))+
    getColorAt(coords+texelSize*vec2(0.5,0.5))),1.0);
    // if(mod(proj.x,100.0)<=2.0){
    //     gl_FragColor = vec4(vec3(0.0),1.0);
    // }
    // if(mod(proj.y,100.0)<=2.0){
    //     gl_FragColor = vec4(vec3(0.0),1.0);
    // }
    
    float pDist=getPerlinAt(coords);
    float bads=0.0;
    float thickness=1.0;
    if(1.0-proj.y*texelSize.y>breakpoint2 && 1.0-proj.y*texelSize.y<=breakpoint3){
        thickness=1.0;
    }
    for(float i=-1.0;i<=1.0;i+=1.0){
        for(float j=-1.0;j<=1.0;j+=1.0){
            if(getPerlinAt(coords+texelSize*vec2(i,j)*thickness)<pDist){
                bads+=1.0;
            }
        }
    }
    // gl_FragColor = vec4(mix(bestColorMatch,vec3(1.0),0.0),1.0);
    
    if(length(gl_FragColor.xyz) >=length(vec3(243.0/255.0))/2.0 && bads<3.0){
        if(1.0-proj.y*texelSize.y>breakpoint1*coords.x+breakpoint3*(1.-coords.x) && 1.0-proj.y*texelSize.y<=breakpoint3){
        gl_FragColor = vec4(2.0*gl_FragColor.xyz-((rgb(5, 180, 227)+1.0)*gl_FragColor.xyz/4.0),1.0);
    }else{
        gl_FragColor = vec4((rgb(5, 180, 227)+1.0)*gl_FragColor.xyz/2.0,1.0);
    }
    }
    // if(gl_FragColor.xyz == vec3(243.0/255.0) && (mod(proj.x-1.0,20.0)<=1.0 || mod(proj.y-1.0,20.0)<=1.0)){
    //     gl_FragColor = vec4(rgb(5, 180, 227),1.0);
    // }
}