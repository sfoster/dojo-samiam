define(["dojo"], function(dojo){
// summary:
// 		An ordered sequence of optionally-asynchronous operations, using dojo.when

"use strict";

/* 
	do these things in order
	tell me what happenned. ie. the return value (via deferred or not) is the result of the final fn call
	return 
		fn1(), fn2(), fn3();
	vs.
	return fn3( fn2( fn1() ) ); // chained functions
	
	// TODO: continue/break semantics?
*/
var Sequence = function() {
	// summary: 
	// 		Returns a decorated array with 'next', 'set' methods, 
	// 		and a stopOnError property.
	
	return dojo.delegate(Array.prototype.slice.apply(arguments), {
		_runSequence: true,
		/* _returnValue: , deliberately left undefined */
		
		onError: function(err) {
			console.error("Sequence error:", this.stopOnError);
			this._runSequence = false;
			this._defd.reject(err);
			// sequence return value is the exception
		},
		run: function() {
			// summary: 
			// 		entry point to kick-off the sequence
			this._defd = new dojo.Deferred(); 
			
			this.next.apply(this, arguments); // not sure if passing through args is useful...?
			return this._defd;
		},
		cancel: function() {
			// summary: 
			//		Cancel the entire sequence (will only be possible to cancel any pending steps)
			this._runSequence = false;
			if(this._defd && this._defd.cancel) {
				this._defd.cancel();
			}
		},
		next: function(){
			var stepFn = this.shift(), 
				stepResult;
				defd = this._defd;

			if(!(stepFn && this._runSequence)) {
				// the end of the sequence -return/resolve it
				// if no error has been thrown thus far, the result of the sequence is a callback
				return defd && defd.resolve(this._returnValue);
			}

			try {
				this._returnValue = stepResult = stepFn.call(null); // fn should already be bound 
				console.log("in try, stepResult: ", stepResult);
			} catch(e) {
				return this.onError(e);
			}
			// always return a promise, 
			// 		i.e. usage is sequence.run().then(...); or dojo.when(sequence.run(), ...)
			dojo.when(
				stepResult, 
				dojo.hitch(this, function(res){
					this._stepResult = res;
					return this.next();
				}), 
				dojo.hitch(this, "onError")
			);
		}
	});
};


return Sequence;
});
