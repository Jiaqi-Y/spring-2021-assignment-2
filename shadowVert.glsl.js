export default `#version 300 es

uniform mat4 uModel;
uniform mat4 uProjection;
uniform mat4 uView;
uniform mat4 uLightView;
uniform mat4 uLightProjection;
uniform vec4 uColor;
uniform vec3 uLightDir;
uniform int uHasNormals;

 



in vec3 position;
in vec3 normal;

out vec4 vColor;
out vec4 vLightSpacePos;

 

void main() {
    // TODO: If has normals, compute color considering it
    // TODO: compute light space position and gl_Position
	
	
   vLightSpacePos = uLightProjection * uLightView * vec4(position,1.0);
	gl_Position = uProjection  * uView *uModel *   vec4(position,1.0);
	// vec3 vlightdir = normalize(mat3(uView *uModel) * uLightDir);
	vec3 vlightdir = normalize( uLightDir);
	vec3 c;

	if (uHasNormals == 1)
   {
	  vec3 norm = normalize(normal);
	 float diff = max(dot(norm,vlightdir), 0.0);	
	   c = uColor.xyz * diff  ;
   }
   else
   {
	   	 c= uColor.rgb;
   }
 
	vColor =vec4(c ,uColor.a)   ;
}
`;
