
function Config() {

}
Config.prototype.NUM_TRACKS = 8;
Config.prototype.NUM_SCENES_PER_TRACK=8;

function NanoPAD2(host, mainTrackBank, log, config) {

    this.host = host;
    this.mainTrackBank = mainTrackBank;
    this.log = log;

    if (config == undefined) {
        log("config not passed into constructor so initializing");
        config = new Config();
    } else {
        log("using config provided in constructor");
    }
    this.config = config;

    this.trackPlayStates = [];

    this.trackClipContents = [];

    this.noteToClipLauncherGridMapping = {};

    this.mode = this.CLIP_MODE;

    this.initGrid();
}

// defaut mode, the top row of scene 1 on the nano starts and stops clips
// on track 1 in Bitwig
NanoPAD2.prototype.CLIP_MODE = 1;

// enabled by sending CCs in the upper left or right of the X/Y pad on the nano.
// In scene mode, the top row of scene 1 on the nano starts and stops entire
// scenes in Bitwig
NanoPAD2.prototype.SCENE_MODE = 2;

NanoPAD2.prototype.gridLocationForNote = function(noteNumber) {
    return this.noteToClipLauncherGridMapping[noteNumber];
}

NanoPAD2.prototype.playstateForTrack = function(trackIndex) {
    return this.trackPlayStates[trackIndex];
}

NanoPAD2.prototype.trackClipHasContent = function(row, column) {    
    return this.trackClipContents[row][column];
}

NanoPAD2.prototype.playbackStateObserver = function(rowIndex, slotIndex, playbackState, isQueued) {
    // 0=stopped, 1=playing, 2=recording
    if (isQueued && (playbackState == 0)) {
        log("stop queued, setting track playback state to -1 (stopped) for track " + rowIndex + ", slot=" + slotIndex);
        this.trackPlayStates[rowIndex] = -1;
    } else if (isQueued && (playbackState == 1)) {
        log("play queued, setting track playback state to playing for track " + rowIndex + ", slot=" + slotIndex);
        this.trackPlayStates[rowIndex] = slotIndex;
    }
}

NanoPAD2.prototype.hasContentObserver = function(rowIndex, slotIndex, hasClip) {
    log("setting clip content for row, column "
        + rowIndex + ", " + slotIndex
        + " from " + this.trackClipContents[rowIndex][slotIndex] + " to " + hasClip);
    this.trackClipContents[rowIndex][slotIndex] = hasClip;
}

NanoPAD2.prototype.addTrackObservers = function(i) {
    
    var track = this.mainTrackBank.getChannel(i);
    var clipLauncherSlots = track.getClipLauncherSlots();
    clipLauncherSlots.setIndication(true);

    clipLauncherSlots.addPlaybackStateObserver(
        this.getTrackClipPlaybackObserverFunc(i, this)
    );

    clipLauncherSlots.addHasContentObserver(
        this.getTrackClipHasContentObserverFunc(i, this)
    );
    
}

NanoPAD2.prototype.initGrid = function() {
        
    // top left pad of scene 1 of the nanopad by default sends note on for note number 37 (c#)
    var startNote = 37;
    var increment = 16;
    
        // we do 2 rows at a time to mirror the nanoPAD2 layout of 2 rows
    // of 8 pads spread over 4 scenes for 8 rows * 8 pads total
    var i = 0;
    while (i < this.config.NUM_TRACKS) {

        this.addTrackObservers(i);
        this.addTrackObservers(i+1);

        this.trackPlayStates[i] = -1;
        this.trackPlayStates[i+1] = -1;

        this.trackClipContents[i] = [];
        this.trackClipContents[i+1] = [];

        if (i > 1) {
            startNote += increment;     
        }
        var evenRowStart = startNote-1;

        var colOdd = startNote;
        var colEven = evenRowStart;
        this.log(colEven + ", " + colOdd);

        // now set the cols
        for (var j = 0; j < this.config.NUM_SCENES_PER_TRACK; j++) {
            this.trackClipContents[i][j] = false;
            this.trackClipContents[i+1][j] = false;

            this.noteToClipLauncherGridMapping[colOdd] = { r: i, c: j };
            this.noteToClipLauncherGridMapping[colEven] = { r: i+1, c: j };
            colOdd+=2;
            colEven+=2;
        }

        i+=2;
    }
}

NanoPAD2.prototype.isClipMode = function() {
    return (this.mode == this.CLIP_MODE) ? true : false;
}

NanoPAD2.prototype.updateMode = function(isChannelController, data1, data2) {
    this.mode = this.getControllerMode(isChannelController, data1, data2);

}

NanoPAD2.prototype.getControllerMode = function(isChannelController, data1, data2) {
    var mode = this.mode;
    if (isChannelController) {
        if ((data1 == 0x02) && (data2 > 0x50)) {
            this.host.showPopupNotification("Scene Mode");
            mode = this.SCENE_MODE;
        } else if ((data1 == 0x02) && (data2 < 0x14)) {
            this.host.showPopupNotification("Clip Mode");
            mode = this.CLIP_MODE;
        } else {
            log("status is control change but not CC2");
            mode = this.mode;    
        }
    } else {
        log("status not control change message, no mode change");
        mode = this.mode;
    }
    log("nano mode is " + (mode == this.CLIP_MODE ? "clip" : "scene"));
    return mode;
}

NanoPAD2.prototype.getTrackClipPlaybackObserverFunc = function(index, nanoPad2) {
    return function(slotIndex, playbackState, isQueued) {
        nanoPad2.playbackStateObserver(index, slotIndex, playbackState, isQueued);
    };
}

NanoPAD2.prototype.getTrackClipHasContentObserverFunc = function(index, nanoPad2) {
    return function(slotIndex, hasClip) {
        nanoPad2.hasContentObserver(index, slotIndex, hasClip);
    }
}