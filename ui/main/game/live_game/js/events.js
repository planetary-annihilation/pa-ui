var eventSystem = (function () {

    function EventSystem() {
        var self = this;
 
        self.firstReadyMap = {};

        self.isType = function (target_type, unit_types /* [ 0x 0x 0x 0x ]*/) {
            var i = Math.floor(target_type / 16);
            var section = unit_types[3 - i];
            var mask = 1 << (target_type % 16);

            return section & mask;
        };

        self.processEvent = function (event_type, payload) {

            audioModel.processEvent(event_type, payload ? payload.spec_id : -1);
        };
    };

    return new EventSystem();
})();