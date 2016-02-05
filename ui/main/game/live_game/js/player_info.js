// convenience for panels to use if they want

window.playerInfoHelper = (function() {
	var exposed = {
			armyId: ko.observable(),
			armies: ko.observableArray(),
			localArmy: null, // we'll set this (it's a ko computed) in a moment
			spectating: null, // we'll set this (it's a ko computed) in a moment
			injectHandlers: injectHandlers
		},
		playerInfoHandler = function(payload) {
			var           
				armyId = payload.armyId,
				unzippedPlayers = payload.playerData,
				players = _.map(unzippedPlayers.ids, function(id, idx) {
					return {     
						color: unzippedPlayers.colors[idx],
						name: unzippedPlayers.names[idx],
						primary_color: unzippedPlayers.primary_color[idx],
						id: id,
						idx: idx
					};
				});

			exposed.armies(players);
			exposed.armyId(armyId);
		},
		fallbackArmy = {
			/* this should never be displayed, but if something causes it to be displayed we don't really want to break too hard */
			color: 'rgb(255, 255, 255)',
			name: 'Spectator',
			primary_color: [255, 255, 255],
			id: 0, idx: 0
		};

	exposed.localArmy = ko.computed(function () {
		var localArmyId = exposed.armyId();
		return (typeof localArmyId === 'number' && exposed.armies() && _.find(exposed.armies(), function(army) {
			return army.id === localArmyId;
		})) || fallbackArmy;
	});

	exposed.spectating = ko.computed(function() {
		return typeof exposed.armyId() !== 'number';
	});

    function injectHandlers(handlers) {
    	handlers['player_info.update'] = playerInfoHandler;

    	$(function () {
			_.delay(function () {
				api.Panel.message('game', 'player_info.request', {panelName: api.Panel.pageName}); /* live_game will add us to a list of subscribers */
	            injectFilters();
			});
		});
	}

	function injectFilters() {
		var svgContainer = document.createElement('DIV'),
			prependFilter = function (matrix, filterId) {
				var
					alreadyThere = document.getElementById('svg-' + filterId),
					div = alreadyThere || document.createElement('DIV'),
					svgBlob =
						'<svg xmlns="http://www.w3.org/2000/svg" version="1.1">'
						+ '	<defs>'
						+ '        	<filter id="' + filterId + '">'
						+ '			<feColorMatrix  result="mat2" in="SourceGraphic" type="matrix" values= "' + matrix.join(' ') + '" />'
						+ '		</filter>'
						+ '	</defs>'
						+ '</svg>';

				div.innerHTML = svgBlob;
				if (!alreadyThere) {
					div.id = 'svg-' + filterId;
					svgContainer.appendChild(div);
				}
			},
			newArmies = function (armies) {
				var overlay = function (target, blend) {
					return (target > .5) ?
						(1 - 2 * (1 - target) * (1 - blend)) :
						(2 * target * blend);
				}, linear = function (channel) {
					return (channel < 0.04045) ? (channel / 12.92) : Math.pow((channel + 0.055) / 1.055, 2.4);
				};

				_.forEach(armies, function (army) {
					var
						filterId = 'army-' + army.id,
						r = linear(army.primary_color[0] / 255), g = linear(army.primary_color[1] / 255), b = linear(army.primary_color[2] / 255),
						matrix = [
							0, r, 0, 0, 0,
							0, g, 0, 0, 0,
							0, b, 0, 0, 0,
							0, 0, 0, 1, 0
						];

					prependFilter(matrix, filterId);				
					army.filterCss = {
						webkitFilter: 'url(#' + filterId + ')'
					};
				});
			};

		svgContainer.style.visibility = 'hidden';
		svgContainer.style.position = 'absolute';

		document.body.appendChild(svgContainer);

		exposed.armies.subscribe(newArmies);
	}

	return exposed;
})();