// !LOCNS:new_game
var model;
var handlers = {};

$(document).ready(function () {

    function parentQuery() {
        return api.Panel.query(api.Panel.parentId, 'panel.invoke', Array.prototype.slice.call(arguments, 0));
    }

    function PlayerViewModel(config) {
        var team = config.team;
        var index = config.index;
        var player = config.player;
        var root = config.root;

        var self = this;

        self.index = ko.observable(index);
        self.commanderImage = CommanderUtility.bySpec.getImage(player.commander);
        self.name = ko.observable(player.name);

        var primaryColor = team.shared() ? team.color() : player.color[0];
        self.rawColor = ko.observable(primaryColor);
        self.color = ko.observable(primaryColor ? 'rgb(' + primaryColor.join(',') + ')' : '');
        self.shadow = ko.observable('0px 0px 5px 5px ' + self.color());

        self.isEven = ko.computed(function() { return self.index() % 2 === 0; });
        self.isOdd = ko.computed(function() { return !self.isEven(); });
    }

    function TeamViewModel(config) {
        var team = config.team;
        var index = config.index;
        var offset = config.offset;
        var root = config.root;

        var self = this;

        self.index = ko.observable(index);
        self.offset = ko.observable(offset);
        self.shared = ko.observable(team.shared);

        self.color = ko.observable(team.players[0].color[0]);
        self.players = ko.observableArray(_.map(team.players, function(player, index) {
            return new PlayerViewModel({
                team: self,
                index: index,
                player: player,
                root: root
            });
        }));

        self.offscreen = ko.observable(true);
        self.isTop = ko.computed(function() { return self.index() % 2; });
        self.isOffTop = ko.computed(function() { return root.offscreen() && self.isTop(); });
        self.isBottom = ko.computed(function() { return !self.isTop(); });
        self.isOffBottom = ko.computed(function() { return root.offscreen() && self.isBottom(); });
    }

    function CinematicViewModel() {
        var self = this;

        self.state = ko.observable({});
        self.animate = ko.computed(function() { return !!self.state().animate; });
        self.numTeams = ko.computed(function() { return (self.state().teams || []).length; });
        self.numPlayers = ko.computed(function() { return _.reduce(self.state().teams, function(sum, team) { return sum + team.players.length; }, 0); });
        self.teams = ko.computed(function() {
            var teams = self.state().teams || [];
            var offset = 0;
            return _.map(teams, function(team, index) {
                var result = new TeamViewModel({
                    team: team,
                    index: index,
                    offset: offset,
                    root: self
                });
                offset += team.players.length;
                return result;
            });
        });

        self.offscreen = ko.observable(!self.animate());
        // Note: Responding to animate must wait a bit so the model starts off-screen
        self.animate.subscribe(function() {
            var offscreen = !self.animate();
            if (offscreen)
                self.offscreen(true);
            else
                _.delay(function() { self.offscreen(false); }, 300);
        });

        self.crowded = ko.computed(function() { return self.numPlayers() > 5; });
        self.snug = ko.computed(function() { return self.numPlayers() > 3; });

        self.active = ko.observable(false);

        self.setup = function () {
            $(window).focus(function() { self.active(true); });
            $(window).blur(function() { self.active(false); });

            parentQuery('cinematicState').then(self.state);
        };
    }
    model = new CinematicViewModel();

    handlers.state = model.state;
    
    handlers.update_commanders = function() {
        CommanderUtility.update().always(function() {
            model.state.valueHasMutated();
        });
    }

    // inject per scene mods
    if (scene_mod_list['new_game_cinematic'])
        loadMods(scene_mod_list['new_game_cinematic']);

    // setup send/recv messages and signals
    app.registerWithCoherent(model, handlers);

    // Activates knockout.js
    ko.applyBindings(model);

    // run start up logic
    model.setup();
});
