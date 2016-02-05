/*

Gets game stats from server

*/

function init_gamestats(api) {

	api.gamestats = {

		get: function(time) {
			var self = this;
			var result = $.Deferred();

			engine.asyncCall("stats.queryArmyStats", time)
				.done(function(data) {
					result.resolve(data);
				})
				.fail(function(data) {
					result.reject(data);
				});

			return result.promise();
		}

	}
}
init_gamestats(window.api);
