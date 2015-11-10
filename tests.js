
var log = function(msg) {
    console.log(msg);
}

var mockClipLauncherSlots = {
    setIndication: function(indication) { },
    addPlaybackStateObserver: function(func) {

    },
    addHasContentObserver: function(func) {

    }
};

var mockTrack = { // mock clipLauncherSlots
    getClipLauncherSlots: function() {
        return mockClipLauncherSlots;
    }
};

var mockTransport = {
    addIsPlayingObserver: function(f) { }
}

// test object
var nanoPAD2 = new NanoPAD2(
    {
        showPopupNotification: log,
        createTransport: function() { return mockTransport; }
    },
    { getChannel: function(i) { return mockTrack; }},
    log
);

QUnit.test(
"nanoPAD2 control object test", function(assert) {
    
    // check mapping of note on numbers to grid location
    var noteMapping = nanoPAD2.gridLocationForNote(37);

    assert.equal(
        (noteMapping.r == 0) && (noteMapping.c == 0), true, "check first note in grid");

    noteMapping = nanoPAD2.gridLocationForNote(99);    
    assert.equal(
        (noteMapping.r == 6) && (noteMapping.c == 7), true, "check last note in grid");

    // clip vs scene mode setting
    var mode = nanoPAD2.mode;
    assert.equal(nanoPAD2.isClipMode(), true, "default mode is CLIP_MODE");

    nanoPAD2.updateMode(true, 0x02, 0x51);
    assert.equal(nanoPAD2.isClipMode(), false, "CC 2 value > 80 sets to SCENE_MODE");

    nanoPAD2.updateMode(true, 0x02, 0x13);
    assert.equal(nanoPAD2.isClipMode(), true, "CC 2 value < 20 is CLIP_MODE");

    nanoPAD2.updateMode(false, 0x02, 0x13);
    assert.equal(nanoPAD2.isClipMode(), true, "no mode change for non-CC message");

    nanoPAD2.updateMode(true, 0x01, 0x13);
    assert.equal(nanoPAD2.isClipMode(), true, "no mode change for CC other than #2");

    // check scene selection
    nanoPAD2.handleSceneSelect(0xff);

    assert.equal(nanoPAD2.selectedScene == -1, true, "selected scene should be default when no note to reference");
    assert.equal(nanoPAD2.lastNotePlayed == -1, true, "last note should be default state");

    nanoPAD2.updateLastNotePlayed(39);
    nanoPAD2.handleSceneSelect(0xff);
    assert.equal(nanoPAD2.selectedScene == 2, true, "scene set to 2");

    nanoPAD2.updateLastNotePlayed(55);
    nanoPAD2.handleSceneSelect(0xff);
    assert.equal(nanoPAD2.selectedScene == 3, true, "scene set to 3");

    nanoPAD2.updateLastNotePlayed(72);
    nanoPAD2.handleSceneSelect(0xff);
    assert.equal(nanoPAD2.selectedScene == 4, true, "scene set to 4");

    nanoPAD2.updateLastNotePlayed(98);
    nanoPAD2.handleSceneSelect(0xff);
    assert.equal(nanoPAD2.selectedScene == 1, true, "scene set to 1");

    // check playstate setting
    assert.equal(nanoPAD2.trackPlayStates.length == nanoPAD2.config.NUM_TRACKS, true,
        "track playstates has " + nanoPAD2.config.NUM_TRACKS + " tracks");

    nanoPAD2.playbackStateObserver(0, 0, 1, true);
    assert.equal(nanoPAD2.playstateForTrack(0) == 0, true, "track playstate set to play for row 1 clip 1");

    nanoPAD2.playbackStateObserver(0, 0, 0, true);
    assert.equal(nanoPAD2.playstateForTrack(0) == -1, true, "track playstate set to stop for row 1 clip 1");

    nanoPAD2.playbackStateObserver(0, 0, 0, false);
    assert.equal(nanoPAD2.playstateForTrack(0) == -1, true, "track playstate unchanged for no queued event for row 1 clip 1");

    // check clip content setting
    assert.equal(nanoPAD2.trackClipContents.length == nanoPAD2.config.NUM_TRACKS, true,
        "track clips content has " + nanoPAD2.config.NUM_TRACKS + " tracks");

    assert.equal(nanoPAD2.trackClipHasContent(0, 2), false, "track clip content default is false");
    
    nanoPAD2.hasContentObserver(0, 2, true);
    assert.equal(nanoPAD2.trackClipHasContent(0, 2), true, "track clip content updated to true");

    nanoPAD2.trackPlayStates[0] = 7;
    nanoPAD2.handleTransportStopped(false);
    assert.equal(-1 == nanoPAD2.trackPlayStates[0], true, "track playstate stopped on transport stop");

});