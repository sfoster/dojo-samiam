/** 
  * test what? 
  * That you can pop/push/shift/unshift a sequence - mid-sequence - and get the expected result
  * That steps are in fact invoked in sequence, sync or async or both
  * That any step producing an error results in onError is fired
  * That an entirely sync sequence directly returns
*/

define(["dojo", "doh", "../Sequence"], function(dojo, doh, Sequence){

	function add(a, b) {
		return a + b;
	};
	function asyncAdd(a, b) {
		var defd = new dojo.Deferred();
		setTimeout(function(){
			console.log("asyncAdd callback, passing: ", a + b);
			defd.callback(a + b);
			console.log("/asyncAdd callback");
		}, 25);
		return defd;
	}

doh.register("sandbox.tests.Sequence", [
		function ctor(t){
			var seq = new Sequence(1,2);
			t.is(2, seq.length);
			t.is("function", typeof seq.next);

			var seq2 = Sequence(1,2);
			t.is(2, seq2.length);
			t.is("function", typeof seq2.next);
		},
		function syncSequence(t){
			var seq = new Sequence(
				dojo.partial(add, 3, 4),
				dojo.partial(add, 2, 1),
				dojo.partial(add, 1, 1)
			);
			
			dojo.when(seq.run(), function(result){
				t.is(2, result);
			});
		},
		function injectIntoSyncSequence(t){
			var seq = new Sequence(
				dojo.partial(add, 3, 4),
				function() {
					seq.push(function(){
						return "final";
					});
				},
				dojo.partial(add, 1, 1)
			);
			dojo.when(seq.run(), function(result){
				t.is("final", result);
			});
		},
		function asyncSequence(t){
			var seq = new Sequence(
				dojo.partial(asyncAdd, 2, 1),
				dojo.partial(asyncAdd, 1, 1),
				dojo.partial(asyncAdd, 3, 4)
			);
			var testDefd = new doh.Deferred();
			
			dojo.when(seq.run(), function(result){
				if(7 == result) {
					testDefd.callback(true);
				} else {
					testDefd.errback( new Error("Expected 7, got: " + result));
				}
			});
			return testDefd;
		},
		function mixedSequence(t){
			var seq = new Sequence(
				dojo.partial(asyncAdd, 2, 1),
				dojo.partial(add, 1, 1),
				dojo.partial(add, 3, 4)
			);
			var testDefd = new doh.Deferred();
			
			dojo.when(seq.run(), function(result){
				if(7 == result) {
					testDefd.callback(true);
				} else {
					testDefd.errback( new Error("Expected 7, got: " + result));
				}
			});
			return testDefd;
		},
		
		function postpendIntoAsyncSequence(t){
			var seq = new Sequence(
				dojo.partial(asyncAdd, 3, 4),
				function() {
					console.log("injecting another async step in seq: ", seq);
					seq.push(dojo.partial(asyncAdd, 2, 1));
				}
			);
			dojo.when(seq.run(), function(result){
				t.is(3, result);
			})
		},
		function prependIntoAsyncSequence(t){
			var prepended = false;
			var seq = new Sequence(
				dojo.partial(asyncAdd, 3, 4),
				function() {
					console.log("injecting another async step in seq: ", seq);
					// should inject a step to set prepended flag to true
					seq.unshift(function(){
						var pdefd = new dojo.Deferred();
						setTimeout(function(){
							prepended = true;
							pdefd.resolve(true);
						}, 100);
						return pdefd;
					});
				},
				// should still run last and return 3+4 as sequence result
				dojo.partial(add, 3, 4)
			);
			var testDefd = new doh.Deferred();
			
			dojo.when(seq.run(), function(result){
				if(prepended && 7 == result) {
					testDefd.callback(true);
				} else {
					testDefd.errback(new Error("prepended step error"));
				}
			});
			return testDefd;
		}

]);

});