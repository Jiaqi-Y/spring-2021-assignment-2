export default `#version 300 es
precision highp float;

uniform sampler2D uSampler;

in vec4 vColor;
in vec4 vLightSpacePos;
out vec4 outColor;

vec4  shadowCalculation(vec4 lightSpacePos) {
    // TODO: shadow calculation
	
	   // Perspective culling
    vec3 projCoords = lightSpacePos.xyz / lightSpacePos.w;
 
    projCoords = projCoords * 0.5 + 0.5;
    if(projCoords.z > 1.0)
        return vec4(0,0,0,1);
    //Get the depth of the closest point from the depth map 
    //(that is, the depth value of the object in the perspective of the light source)
    float closetDepth = texture(uSampler, projCoords.xy).a;
    // Get the depth of the current fragment in the perspective of the light source
    float currentDepth = projCoords.z;
    //Due to the impact of resolution, multiple points will address the same point 
    //(shadow distortion) plus offset cancellation effects
   float bias = 0.005;
     
      float shadow = 0.0;
    //Calculate the value of shadow by averaging the values ​​of the surrounding 16 pixels. PCF
   
   float texelSize=1.0/2048.0;
     for(float  x = -1.5; x <= 1.5; ++x)
     {
         for(float  y = -1.5; y <= 1.5; ++y)
         {
           
                float pcfDepth = texture(uSampler, projCoords.xy + vec2(x, y) * texelSize).a; 
             shadow += currentDepth - bias > pcfDepth  ? 1.0 :0.0;        
         }    
     }
     shadow /= 16.0;
	 
	 return vec4(vColor.rgb * max(0.0, (1.0-shadow)), vColor.a);
 
	
}

void main() {
    // TODO: compute shadowmap coordenates 
    // TODO: evaluate if point is in shadow or not
	 
 
  outColor = shadowCalculation(vLightSpacePos);
 
   
}
	 
`;
