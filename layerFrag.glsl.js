export default `#version 300 es
precision highp float;

in vec4 vColor;
out vec4 outColor;

void main() {
     // outColor = vColor;
	   
	    outColor = vec4( 0.0, 0.0, 0.0,gl_FragCoord.z);// *gl_FragCoord.z *gl_FragCoord.z);
	    
	    
}
`;
 
