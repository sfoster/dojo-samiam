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
			return this._defd ?
				this._defd.errback(err) :
				err;
			// sequence return value is the exception
		},
		run: function() {
			// summary: 
			// 		alias for next
			return this.next.apply(this, arguments);
		},
		cancel: function() {
			// summary: 
			//		Cancel the entire sequence (will only be possible to cancel any pending steps)
			this._runSequence = false;
			this._defd && this._defd.cancel();
		},
		next: function(){
			var stepFn = this.shift(), 
				stepResult;

			if(!(stepFn && this._runSequence)) {
				// the end of the sequence -return/resolve it
				// if no error has been thrown thus far, the result of the sequence is a callback
				return this._defd ? 
					this._defd.callback(this._returnValue) :
					this._returnValue;
			}
			
			console.log("in next, calling fn");
			try {
				this._returnValue = stepResult = stepFn.call(null); // fn should already be bound 
				console.log("in try, stepResult: ", stepResult);
			} catch(e) {
				this.onError(e);
			}
			// return a defd at the first step in the sequence we encounter which is async
			if(stepResult && (typeof stepResult.then == "function" || stepResult instanceof dojo.Deferred)) {
				// if a step is async, we want to return a defd representing the whole sequence
				if(!this._defd) {
					this._defd = new dojo.Deferred();
				}
				
				// hook the callback of the step to trigger the next step in the sequence
				(stepResult.then || stepResult.addCallbacks)(
					dojo.hitch(this, function(res){
						this._stepResult = res;
						return this.next();
					}), 
					dojo.hitch(this, "onError")
				);
				return this._defd;
			} else {
				return this.next();
			}
		}
	});
};


return Sequence;
});
