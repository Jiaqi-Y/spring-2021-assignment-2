import layerVertShaderSrc from './layerVert.glsl.js';
import layerFragShaderSrc from './layerFrag.glsl.js';
import shadowFragShaderSrc from './shadowFrag.glsl.js';
import shadowVertShaderSrc from './shadowVert.glsl.js';
import depthFragShaderSrc from './depthFrag.glsl.js';
import depthVertShaderSrc from './depthVert.glsl.js';

var gl;

var layers = null
var renderToScreen = null;
var fbo = null;
var currRotate = 0;
var currLightRotate = 0;
var currLightDirection = null;
var currZoom = 0;
var currProj = 'perspective';
var currResolution = 2048;
var displayShadowmap = false;

/*
    FBO
*/
class FBO {
    constructor(size) {
        // TODO: Create FBO and texture with size
       
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
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
 
 
        //Create a render buffer object and set its size and parameters
        this.depthBuffer = gl.createRenderbuffer();
         

        gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthBuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, size, size);

        //ssociate texture and render buffer objects to frame buffer objects
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
}

/*
    Shadow map
*/
class ShadowMapProgram {
    constructor() {
        this.vertexShader = createShader(gl, gl.VERTEX_SHADER, shadowVertShaderSrc);
        this.fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, shadowFragShaderSrc);
        this.program = createProgram(gl, this.vertexShader, this.fragmentShader);

        this.posAttribLoc = gl.getAttribLocation(this.program, "position");
        this.colorAttribLoc = gl.getUniformLocation(this.program, "uColor");
        this.modelLoc = gl.getUniformLocation(this.program, "uModel");
        this.projectionLoc = gl.getUniformLocation(this.program, "uProjection");
        this.viewLoc = gl.getUniformLocation(this.program, "uView");
        this.lightViewLoc = gl.getUniformLocation(this.program, "uLightView");
        this.lightProjectionLoc = gl.getUniformLocation(this.program, "uLightProjection");
        this.samplerLoc = gl.getUniformLocation(this.program, "uSampler");
        this.hasNormalsAttribLoc = gl.getUniformLocation(this.program, "uHasNormals");
        this.lightDirAttribLoc = gl.getUniformLocation(this.program, "uLightDir");    
    }

    use() {
        // TODO: use program
		
		gl.useProgram(this.program);
    }
}

/*
    Render to screen program
*/
class RenderToScreenProgram {
    constructor() {
        this.vertexShader = createShader(gl, gl.VERTEX_SHADER, depthVertShaderSrc);
        this.fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, depthFragShaderSrc);
        
        this.program = createProgram(gl, this.vertexShader, this.fragmentShader);
        this.posAttribLoc = gl.getAttribLocation(this.program, "position");
        this.samplerLoc = gl.getUniformLocation(this.program, "uSampler");
        this.texAttribLoc = gl.getAttribLocation(this.program,"texcoord" );
        // TODO: Create quad VBO and VAO
		
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
    
        gl.bindVertexArray(null);

    }

    draw(texture) {
        // TODO: Render quad and display texture
		 
      
		gl.useProgram(this.program);
        gl.bindVertexArray(this.vao);
        gl.bindTexture(gl.TEXTURE_2D,texture);
        gl.uniform1i(gl.samplerLoc,0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
		gl.drawElements(gl.TRIANGLES, this.indices.length, gl.UNSIGNED_INT, 0);
		gl.bindTexture(gl.TEXTURE_2D,null);
    }

}

/*
    Layer program
*/
class LayerProgram {
    constructor() {
        this.vertexShader = createShader(gl, gl.VERTEX_SHADER, layerVertShaderSrc);
        this.fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, layerFragShaderSrc);
        this.program = createProgram(gl, this.vertexShader, this.fragmentShader);

        this.posAttribLoc = gl.getAttribLocation(this.program, "position");
        this.colorAttribLoc = gl.getUniformLocation(this.program, "uColor");
        this.modelLoc = gl.getUniformLocation(this.program, "uModel");
        this.projectionLoc = gl.getUniformLocation(this.program, "uProjection");
        this.viewLoc = gl.getUniformLocation(this.program, "uView");
    }

    use() {
        gl.useProgram(this.program);
    }
}


/*
    Collection of layers
*/
class Layers {
    constructor() {
        this.layers = {};
        this.centroid = [0,0,0];
    }

    addLayer(name, vertices, indices, color, normals) {
        if(normals == undefined)
            normals = null;
        var layer = new Layer(vertices, indices, color, normals);
        layer.init();
        this.layers[name] = layer;
        this.centroid = this.getCentroid();
    }

    removeLayer(name) {
        delete this.layers[name];
    }

    draw(modelMatrix, viewMatrix, projectionMatrix, lightViewMatrix = null, lightProjectionMatrix = null, shadowPass = false, texture = null) {
        for(var layer in this.layers) {
            if(layer == 'surface') {
                gl.polygonOffset(1, 1);
            }
            else {
                gl.polygonOffset(0, 0);
            }
            this.layers[layer].draw(modelMatrix, viewMatrix, projectionMatrix, lightViewMatrix, lightProjectionMatrix, shadowPass, texture);
        }
    }

    
    getCentroid() {
        var sum = [0,0,0];
        var numpts = 0;
        for(var layer in this.layers) {
            numpts += this.layers[layer].vertices.length/3;
            for(var i=0; i<this.layers[layer].vertices.length; i+=3) {
                var x = this.layers[layer].vertices[i];
                var y = this.layers[layer].vertices[i+1];
                var z = this.layers[layer].vertices[i+2];
    
                sum[0]+=x;
                sum[1]+=y;
                sum[2]+=z;
            }
        }
        return [sum[0]/numpts,sum[1]/numpts,sum[2]/numpts];
    }
}

/*
    Layers without normals (water, parks, surface)
*/
class Layer {
    constructor(vertices, indices, color, normals = null) {
        this.vertices = vertices;
        this.indices = indices;
        this.color = color;
        this.normals = normals;

        this.hasNormals = false;
        if(this.normals) {
            this.hasNormals = true;
        }
    }

    init() {
        this.layerProgram = new LayerProgram();
        this.shadowProgram = new ShadowMapProgram();
		 
        this.vertexBuffer = createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(this.vertices));
        this.indexBuffer = createBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.indices));

        if(this.normals) {
            this.normalBuffer = createBuffer(gl, gl.ARRAY_BUFFER, new Float32Array(this.normals));
            this.vao = createVAO(gl, 0, this.vertexBuffer, 1, this.normalBuffer);
        }
        else {
            this.vao = createVAO(gl, 0, this.vertexBuffer);

        }
    }

    draw(modelMatrix, viewMatrix, projectionMatrix, lightViewMatrix, lightProjectionMatrix, shadowPass = false, texture = null) {
        // TODO: Handle shadow pass (using ShadowMapProgram) and regular pass (using LayerProgram)


        
           
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
		
	  
    }
}

/*
    Event handlers
*/
window.updateRotate = function() {
    currRotate = parseInt(document.querySelector("#rotate").value);
}

window.updateLightRotate = function() {
    currLightRotate = parseInt(document.querySelector("#lightRotate").value);
}

window.updateZoom = function() {
    currZoom = parseFloat(document.querySelector("#zoom").value);
}

window.updateProjection = function() {
    currProj = document.querySelector("#projection").value;
}

window.displayShadowmap = function(e) {
    displayShadowmap = e.checked;
}

/*
    File handler
*/
window.handleFile = function(e) {
    var reader = new FileReader();
    reader.onload = function(evt) {
        var parsed = JSON.parse(evt.target.result);
        for(var layer in parsed){
            var aux = parsed[layer];
            layers.addLayer(layer, aux['coordinates'], aux['indices'], aux['color'], aux['normals']);
        }
    }
    reader.readAsText(e.files[0]);
	//console.log(layers);
}

/*
    Update transformation matrices
*/
function updateModelMatrix(centroid) {
        
    return identityMatrix();
}

function updateProjectionMatrix() {
	    // TODO: Projection matrix
    var projectionMatrix = identityMatrix();
	
	  var aspect = window.innerWidth /  window.innerHeight;
    if(currProj == 'perspective') {
        projectionMatrix = perspectiveMatrix(45 * Math.PI / 180.0, aspect, 1, 50000);
    }
    else {
        var maxzoom = 5000;
        var size = maxzoom-(currZoom/100.0)*maxzoom*0.99;
        projectionMatrix = orthographicMatrix(-aspect*size, aspect*size, -1*size, 1*size, -1, 50000);
    }
	

    return projectionMatrix;
}

function updateViewMatrix(centroid){
    // TODO: View matrix
    var viewMatrix = identityMatrix();
	   var radRotate = currRotate * Math.PI / 180.0;
    var maxzoom = 5000;
    var radius = maxzoom - (currZoom/100.0)*maxzoom*0.99;
    var x = radius * Math.cos(radRotate);
    var y = radius * Math.sin(radRotate);

	
    viewMatrix = lookAt(add(centroid,[x,y,radius]), centroid, [0,0,1]);
	
    return viewMatrix;
}

function updateLightViewMatrix(centroid) {
    // TODO: Light view matrix
    var lightViewMatrix = identityMatrix();

    
    var maxzoom = 800;
    var radius;
    //var radius=maxzoom - (currZoom/100.0)*maxzoom*0.99;
    if(currProj == 'perspective') {
      radius = 4000;// maxzoom - (currZoom/100.0)*maxzoom*0.99;
      var light_x = radius *  Math.cos(currLightRotate * Math.PI/180.0);
	
      var light_y = radius *   Math.sin(currLightRotate * Math.PI/180.0);
      var light_z = 1000;
    
    }
    else
    {
        radius = 500;
        var light_x = radius *  Math.cos(currLightRotate * Math.PI/180.0);
	
        var light_y = radius *   Math.sin(currLightRotate * Math.PI/180.0);
        var light_z = 500;
        
       
    }
    
     // 设置光线方向(世界坐标系下的)
    
 
     lightViewMatrix = lookAt( add(centroid, [light_x,light_y,light_z]), centroid, [0,0,1]);

	//currLightDirection = sub([light_x,light_y,light_z],centroid);
	currLightDirection =[light_x,light_y,light_z];
    // 

   //lightViewMatrix = lookAt( [light_x,light_y,light_z], [0,0,0], [0,0,1]);
    return lightViewMatrix;
}

function updateLightProjectionMatrix() {
    // TODO: Light projection matrix
    var lightProjectionMatrix = identityMatrix();
	
	
 
	
    var aspect = 1.0;
    if(currProj == 'perspective') {
        lightProjectionMatrix = perspectiveMatrix(45 , aspect, 1, 50000);
    }
    else {
        //var maxzoom = 5000;
       //  var size = maxzoom-(currZoom/100.0)*maxzoom*0.99;
      //   lightProjectionMatrix = orthographicMatrix(-aspect*size, aspect*size, -1*size, 1*size, -1, 50000);
       
         lightProjectionMatrix = orthographicMatrix(-3000, 3000, -3000, 3000, -3000, 3000);
    }
	
    return lightProjectionMatrix;
}

/*
    Main draw function (should call layers.draw)
*/
function draw() {

    gl.clearColor(190/255, 210/255, 215/255, 1);
    gl.clearDepth(1.0);
	 
   
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	 
    // TODO: First rendering pass, rendering using FBO
    let	modelMatrix =	updateModelMatrix(layers.centroid);
	let	lightProjectionMatrix=	updateLightProjectionMatrix();
	let	lightViewMatrix=	updateLightViewMatrix(layers.centroid);
    let	projectionMatrix=	updateProjectionMatrix();
	let	viewMatrix=	updateViewMatrix(layers.centroid);
	
	fbo.start();
	
	//console.log(fbo.texture);
    layers.draw(modelMatrix, viewMatrix, projectionMatrix, lightViewMatrix, lightProjectionMatrix, true,fbo.texture);
     
    
	fbo.stop();
	
	 

	
    if(!displayShadowmap) {
        
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        console.log(gl.canvas.width );
        // TODO: Second rendering pass, render to screen
       //  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // gl.clearColor(190/255, 210/255, 215/255, 1);
        layers.draw(modelMatrix, viewMatrix, projectionMatrix, lightViewMatrix, lightProjectionMatrix, false,fbo.texture); 
	
		
    }
    else {
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        // TODO: Render shadowmap texture computed in first pass
       //  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // gl.clearColor(190/255, 210/255, 215/255, 1);
		//console.log('a      ');
		renderToScreen.draw(fbo.texture);
    }

    requestAnimationFrame(draw);

}

/*
    Initialize everything
*/
function initialize() {

    var canvas = document.querySelector("#glcanvas");
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    gl = canvas.getContext("webgl2");

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);

    gl.enable(gl.POLYGON_OFFSET_FILL);

    layers = new Layers();
    fbo = new FBO(currResolution);
    renderToScreen = new RenderToScreenProgram();

    window.requestAnimationFrame(draw);

}


window.onload = initialize;
