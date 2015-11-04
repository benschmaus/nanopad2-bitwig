
var log = function(msg) {
    console.log(msg);
}

var mockClipLauncherSlots = {
    setIndication: function(indication) { },
    addPlaybackStateObserver: function(func) {

    }
};

var mockTrack = { // mock clipLauncherSlots
    getClipLauncherSlots: function() {
        return mockClipLauncherSlots;
    }
};

// test object
var nanoPAD2 = new NanoPAD2(
    { showPopupNotification: log },
    { getChannel: function(i) { return mockTrack }},
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

    // check playstate setting
    nanoPAD2.playbackStateObserver(0, 0, 1, true);
    assert.equal(nanoPAD2.trackPlayStates[0] == 0, true, "track playstate set to play for row 1 clip 1");

    nanoPAD2.playbackStateObserver(0, 0, 0, true);
    assert.equal(nanoPAD2.trackPlayStates[0] == -1, true, "track playstate set to stop for row 1 clip 1");

    nanoPAD2.playbackStateObserver(0, 0, 0, false);
    assert.equal(nanoPAD2.trackPlayStates[0] == -1, true, "track playstate unchanged for no queued event for row 1 clip 1");    
}

);