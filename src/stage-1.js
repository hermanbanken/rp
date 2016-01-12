import * as Rx from 'rx';

var _width, width = function(){
	if(!_width) {
		_width = $("#stage-1").width();
	}
	return _width;
}

function Ball(startTime, timeObs) {
	return timeObs
	.map(t => (t - startTime) / 500)
	.takeWhile(t => t <= 1)
	.map(t => ({
		x: t * width(),
		z: t < 0.2 ? t * 5 : (t > .8 ? (1 - t) * 5 : 1),
		color: t >= .5 ? "red" : "blue"
	}));
}

function run(){
	$(this).css({
		width: "100%",
		height: "1em",
	});
	
	var $canvas = $("<div class='canvas'></div>").appendTo(this);
	var $controls = $("<div class='controls'></div>").appendTo(this);

	Rx.Observable.timer(0, 5000)
		.flatMap(t => {
			var ball = new Ball(0, Rx.Observable.timer(0, 16, Rx.Scheduler.requestAnimationFrame));
			var el = $("<div class='ball'></div>").appendTo($canvas);
			ball.subscribe(() => {}, () => {}, () => el.remove());
			var w = el.width();
			return ball.map(attrs => ({ attrs, el, w }))
		})
		.subscribe(item => {
			item.el.css("transform", "translate3d("+ (~~item.attrs.x - item.w/2) +"px, 0, 0) scale("+ (item.attrs.z) +")");
			item.el.css("backgroundColor", item.attrs.color);
		});
}

$(window).on("resize", function(){
	_width = false;
});

$(window).on("load", function(){
	$("#stage-1").each(run);
});