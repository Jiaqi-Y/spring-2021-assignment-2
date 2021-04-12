export default `#version 300 es

in vec3 position;
in vec2 texcoord;
out vec2 vTexcoord;

void main() {
    gl_Position = vec4(position, 1.0);
    // TODO: send vTexcoord to fragment shader with texture coordinates
	vTexcoord = texcoord;
	
}    
`;
