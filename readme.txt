1. First finish writing layerfrag.glsl.js and layervert.glsl.js. This is the shader for the frame buffer. From the perspective of the position of the light, the projection of the light, the view of the light. Use the depth buffer value in the color value.

2. Complete the fbo buffer content.
   
        this.size = size;
        //Create a frame buffer object
        this.framebuffer = gl.createFramebuffer();
        if(!this.framebuffer){
            console.log("Unable to create framebuffer object");
            return error();
        }

        //Create a texture object and set its size and parameters
        this.texture = gl.createTexture();
         

        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0,gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
 
        //Create a render buffer object and set its size and parameters
        this.depthBuffer = gl.createRenderbuffer();
         

        gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthBuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, size, size);

        //Associate texture and render buffer objects to frame buffer objects
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);

        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER,this.depthBuffer);

        //Check if the frame buffer object is set correctly
        var e = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if(gl.FRAMEBUFFER_COMPLETE !== e){
            console.log("error" );
            return error();
        }
        gl.enable(gl.DEPTH_TEST);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
       
    }

    start() {
        // TODO: Bind FBO, set viewport to size, clear depth buffer
    
	     //Turn on texture buffer 0 and bind the texture of the frame buffer object
              gl.activeTexture(gl.TEXTURE0);
              gl.bindTexture(gl.TEXTURE_2D, this.texture);
	  //Switch drawing scene to frame buffer
		  gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
	   gl.viewport(0.0,0.0,this.size,this.size);
	   gl.clear(gl.COLOR_BUFFER_BIT |  gl.DEPTH_BUFFER_BIT);
	 //Set the background settings and turn on the hidden surface elimination function
		   gl.clearColor(0.0,0.0,0.0,0.0);
        gl.enable(gl.DEPTH_TEST);
  
    }

    stop() {
        // TODO: unbind FBO
		
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
         gl.bindTexture(gl.TEXTURE_2D, null);
		gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    }

Render the depth buffer value into a texture. In fbo.texture.

3. Draw shadow patterns.
First, improve the draw function in the layer. The draw function needs to draw the object twice.
The first time was in the frame buffer, and the other time was in the normal viewing angle.
	if(true ==  shadowPass)
		{
			this.layerProgram.use(); 
		
			gl.uniformMatrix4fv(this.layerProgram.modelLoc, false, new Float32Array(modelMatrix));
		
			
			gl.uniformMatrix4fv(this.layerProgram.projectionLoc, false, new Float32Array(lightProjectionMatrix));
		
			
			gl.uniformMatrix4fv(this.layerProgram.viewLoc, false, new Float32Array(lightViewMatrix));

			gl.uniform4fv(this.layerProgram.colorAttribLoc, this.color);

			gl.bindVertexArray(this.vao);
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
			gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_INT, 0);
		}
		else
		{
			this.shadowProgram.use();
          
            gl.uniform1i(this.shadowProgram.hasNormalsAttribLoc, this.hasNormals);
			gl.uniformMatrix4fv(this.shadowProgram.modelLoc, false, new Float32Array(modelMatrix));
		
       
			gl.uniformMatrix4fv(this.shadowProgram.projectionLoc, false, new Float32Array(projectionMatrix));
    
		
			gl.uniformMatrix4fv(this.shadowProgram.viewLoc, false, new Float32Array(viewMatrix));
		
		 
			gl.uniformMatrix4fv(this.shadowProgram.lightProjectionLoc, false, new Float32Array(lightProjectionMatrix));
		
			 
			gl.uniformMatrix4fv(this.shadowProgram.lightViewLoc, false, new Float32Array(lightViewMatrix));

			gl.uniform4fv(this.shadowProgram.colorAttribLoc, this.color);
			gl.uniform3fv(this.shadowProgram.lightDirAttribLoc,currLightDirection   );
            gl.uniform1i(gl.samplerLoc,0);
			gl.bindTexture(gl.TEXTURE_2D,texture   );
			gl.bindVertexArray(this.vao);
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
			gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_INT, 0);
			
			
		}


4. Improve RenderToScreenProgram
If you draw the texture of fbo, you only need to draw a square and map the texture in the box.
	this.vertices =[-0.5,0.5,0, 0.5,0.5,0, 0.5,-0.5,0,-0.5,-0.5,0];
		this.texcoods = [0,1, 1,1,  1,0, 0,0];
		this.indices = [1,0,3, 3,2,1];
        this.vertexBuffer = createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(this.vertices));
		this.texBuffer = createBuffer(gl,gl.ARRAY_BUFFER,new Float32Array(this.texcoods));
        this.indexBuffer = createBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.indices));
      //  this.vao = createVAO(gl, 0, this.vertexBuffer, 1, this.texBuffer);


        this.vao = gl.createVertexArray();

        gl.bindVertexArray(this.vao);
    
        if(this.posAttribLoc != null && this.posAttribLoc != undefined) {
            gl.enableVertexAttribArray(this.posAttribLoc);
            var size = 3;
            var type = gl.FLOAT;
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
            gl.vertexAttribPointer(this.posAttribLoc, size, type, false, 0, 0);
        }
    
      
    
        if(this.texAttribLoc != null && this.texAttribLoc != undefined) {
            gl.enableVertexAttribArray(this.texAttribLoc);
            size = 2;
            type = gl.FLOAT;
            gl.bindBuffer(gl.ARRAY_BUFFER, this.texBuffer);
            gl.vertexAttribPointer(this.texAttribLoc, size, type, false, 0, 0);
        }

5. Improve the depthvert.glsl.js and depthfrag.glsl.js shaders.
Simple texture display.
outColor = texture(uSampler,vTexcoord)   ;

6. Improve shadowvert.glsl.js shader
In the vertex shader, the position of the light is passed to the fragment shader
   vLightSpacePos = uLightProjection * uLightView * vec4(position,1.0);
Buildings have normals, calculate the diffuse color
7. Calculate the shadow in shadowFrag.glsl.js
   // Perspective culling
    vec3 projCoords = lightSpacePos.xyz / lightSpacePos.w;
 
    projCoords = projCoords * 0.5 + 0.5;
    if(projCoords.z > 1.0)
        return vec4(0,0,0,1);
    //Get the depth of the closest point from the depth map (that is, the depth value of the object in the perspective of the light source)
    float closetDepth = texture(uSampler, projCoords.xy).a;
    // Get the depth of the current fragment in the perspective of the light source
    float currentDepth = projCoords.z;
    //Due to the impact of resolution, multiple points will address the same point (shadow distortion) plus offset cancellation effects
   float bias = 0.005;

  //Calculate the value of shadow by averaging the values ​​of the surrounding 16 pixels.
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


8. In the view of orthoc, the shadow effect is better than perspetve.
This is because in the ortho view, the depth value is a linear transformation. Under perspctive, because near and far are relatively far away, the depth value is not a linear transformation. Therefore, the depth value is not accurate enough, and it looks black.
