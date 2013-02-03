/*
Script: Panorama.js
	Contains a class to handle a panorama type effect for viewing large images

Author:
	Adam Fisher (adamnfish)

License: MIT-style license
*/

/*
Class: Panorama
	Will create and manage a panorama element for viewing large pictures in a small div

Arguments:
	path - the path to the image
	el - the element you want to use as the 'window' (should be smaller than the image)
	options - object of options

Options:
	top - start offset for the top property
	left - start offset for the left property
	fx - object containing options for the move transition (see Fx.Styles)
	onStart - function to execute when you start moving the image (fired by mousedown for drag, and onStart for effect)
	onComplete - function to execute when you stop moving the image (fired by mouseup or effect completion)
	onReady - function to execute when the image has loaded and the Panorama is ready

Example:
	(start code)
	var pano = new Panorama('panorama.jpg', 'window', {
		left: 100,
		fx: {
			duration: 600
		}
	});
	(end)

Notes:
	window size - make sure that the window is smaller than the image you want to use for the panorama!
	chain - both 'move' and 'jump' (see below) are chainable so if you need to, you can do something like:
		(start code)
		<instance reference>.move(-200, 0).chain(function(){<instance reference>.jump('right');});
		(end)
	depends on - built for mootools V1.1. You will need:
		Fx.Styles.js
		Assets.js
		Drag.Move.js
		(plus the bits they depend on!)
*/
var Panorama = new Class({
	options: {
		left: '0',
		top: '0',
		fx: {
		},
		onStart: Class.empty,
		onComplete: Class.empty,
		onReady: Class.empty
	},
	initialize: function(path, el, options){
		this.setOptions(options);
		this.limit = {};
		this.chains = [];
		this.windowDims = $(el).getStyles('width', 'height');
		this.image = new Asset.image(path, {onload: function(){
				this.image.setStyles({
					left: -(this.options.left.toInt()),
					top: -(this.options.top.toInt())
				}).injectInside(el);
				this.limit.x = this.windowDims.width.toInt() - this.image.width;
				this.limit.y = this.windowDims.height.toInt() - this.image.height;
				this.imagegable = this.image.makeDraggable({
					limit: {
						x: [this.limit.x, 0],
						y: [this.limit.y, 0]
					},
					onStart: function(){
						this.moveFx.stop();
						this.clearChain();
						this.fireEvent('onStart', 10);
					}.bind(this),
					onComplete: function(){
						this.fireEvent('onComplete', 10);
					}.bind(this)
				});
				this.moveFx = new Fx.Styles(this.image, this.options.fx).addEvent(
						'onComplete', function(){
							this.callChain();
							this.fireEvent('onComplete', 10);
						}.bind(this)).addEvent(
						'onStart', function(){
							this.fireEvent('onStart', 10);
						}.bind(this)
				);
				this.fireEvent('onReady', 10);
			}.bind(this)
		});
	},

/*
	Property: move
		will move the panorama by the passed amount

	Arguments:
		dX - number of pixels to move horizontally
		dY - number of pixels to move vertically

	Example:
		(start code)
		<instance reference>.move(100, -50)//will move the picture 100 pixels right and 50 down
		<instance reference>.move(-20, 40)//will move the picture 20 pixels left and 40 up
		(end)
*/

	move: function(dX, dY){
		if(this.moveFx.timer){this.addToChain(this.move, [dX, dY]);}
		var current = [this.image.getStyle('left').toInt(), this.image.getStyle('top').toInt()];
		var newX = dX ? (current[0] - dX).limit(this.limit.x, 0) : current[0];
		var newY = dY ? (current[1] - dY).limit(this.limit.y, 0) : current[1];
		this.moveFx.start({
			left: newX,
			top: newY
		});
		return this;
	},

/*
	Property: jump
		will move the panorama to an endpoint of the image

	Arguments:
		where - a string containing one or more of the following words, separated by spaces
			top, bottom, left, right

	Example:
		(start code)
		<instance reference>.jump('top left')//will move the picture as far left and up as it can go
		<instance reference>.move('right')//will move the picture as far right as it can go
		(end)
*/

	jump: function(where){
		if(this.moveFx.timer){this.addToChain(this.jump, where);}
		var words = where.split(' ');
		var top = words.contains('top') ? 0 : words.contains('bottom') ? this.limit.y : this.image.getStyle('top');
		var left = words.contains('left') ? 0 : words.contains('right') ? this.limit.x : this.image.getStyle('left');
		this.moveFx.start({
			left: left,
			top: top
		});
		return this;
	},

/*
	Property: addToChain
		Provides the user with a simplified chain syntax - if the user tries to perform an effect while another effect is in process, it is added to the chain stack and executed when its turn comes.
	
	Arguments:
		Used internally
	
	Example:
		(start code)
		var mayPanorama	= new Panorama('panorama.jpg', 'window');
		myPanorama.move(100, 100).move(-100, -100).jump('top left').jump('bottom').move(800, 40).jump('top right');
		(end)
		Is equivalent to
		(start code)
		myPanorama.move(100,100).chain(function(){
		myPanorama.move(-100,-100);
		}).chain(function(){
		myPanorama.jump('top left');
		}).chain(function(){
		myPanorama.jump('bottom');
		}).chain(function(){
		myPanorama.move(800,400);
		}).chain(function(){
		myPanorama.jump('top right');
		});
		(end)
*/

	addToChain: function(fn, args){
		this.chains.push(fn.pass(args, this));
	}
});

Panorama.implement(new Options, new Chain, new Events);