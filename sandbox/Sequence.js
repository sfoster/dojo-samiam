define(["dojo"], function(dojo){
// summary:
// 		...

// Depends on:
//	dojo.delegate
//	dojo.hitch
	
"use strict";

var Sequence = function() {
	// "when list" vs. DeferredList - sequence of optionally-async functions
	return dojo.delegate(Array.prototype.slice.apply(arguments), {
		set: function(name, value) {
			this[name] = value; 
			return this;
		},
		stopOnError: true,
		_runSequence: true,
		onError: function(err) {
			console.error("error:", err);
			if(this.stopOnError) {
				this._runSequence = false;
			}
		},
		next: function(){
			var fn = this.shift(), 
				args = Array.prototype.slice.apply(arguments);
			if(fn && this._runSequence) {
				return dojo.when(
					fn.apply(null, args), //
					dojo.hitch.apply(dojo, [this, "next"].concat(args)), // success
					dojo.hitch(this, "onError") // failure
				)
			}
		}
	});
};


return Sequence;
});
