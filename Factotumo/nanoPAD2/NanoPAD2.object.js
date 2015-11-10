
function Config() {

}
Config.prototype.NUM_TRACKS = 8;
Config.prototype.NUM_SCENES_PER_TRACK=8;

function NanoPAD2(host, mainTrackBank, log, config) {

    this.host = host;
    this.mainTrackBank = mainTrackBank;
    this.transport = host.createTransport();
    this.log = log;

    if (config == undefined) {
        log("config not passed into constructor so initializing");
        config = new Config();
    } else {
        log("using config provided in constructor");
    }
    this.config = config;

    // keeps track of what clip, if any, is playing on each track
    this.trackPlayStates = [];

    // keeps track of which scenes have clips for each track
    this.trackClipContents = [];

    // top left pad of scene 1 of the nanopad by default sends note on for note number 37 (c#)
    this.startNote = 37;
    this.increment = 16;

    // maps note on messages from the nanoPAD2 to the clip launcher grid
    // rows are tracks and columns are clips
    this.noteToClipLauncherGridMapping = {};

    // see CLIP_MODE and SCENE_MODE
    this.mode = this.CLIP_MODE;

    // track which scene (1-4) is selected on the nanopad2
    this.selectedScene = -1;

    // keeps track of last note played on the nano, used to determine scene
    // on the nano
    this.lastNotePlayed = -1;

    this.isTransportPlaying = false;
    this.transport.addIsPlayingObserver(
        this.getIsPlayingObserverFunc(this)
    );

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
    return this.trackClipContents[row][column] || false;
}

NanoPAD2.prototype.playbackStateObserver = function(rowIndex, slotIndex, playbackState, isQueued) {
    log("transport playing=" + this.isTransportPlaying + ", row=" + rowIndex + ", slot=" + slotIndex + ", playbackState=" + playbackState);
    // 0=stopped, 1=playing, 2=recording
    if (playbackState == 0) {
        log("setting track playback state to -1 (stopped) for track " + rowIndex + ", slot=" + slotIndex);
        this.trackPlayStates[rowIndex] = -1;
    } else if (playbackState >= 1) {
        log("setting track playback state to playing/recording for track " + rowIndex + ", slot=" + slotIndex);
        this.trackPlayStates[rowIndex] = slotIndex;
    }
}

NanoPAD2.prototype.hasContentObserver = function(rowIndex, slotIndex, hasClip) {
    log("setting clip content for row, column "
        + rowIndex + ", " + slotIndex
        + " from " + this.trackClipContents[rowIndex][slotIndex] + " to " + hasClip);
    this.trackClipContents[rowIndex][slotIndex] = hasClip;
}

NanoPAD2.prototype.handleTransportStopped = function(isPlaying) {
    this.isTransportPlaying = isPlaying;
    
    if (isPlaying == false) {
        log("transport stopped, setting playstate to stopped for all tracks");
        // set playstate to -1 (stopped) for all tracks if the
        // transport is stopped
        for (var i = 0; i < this.config.NUM_TRACKS; i++) {
            this.trackPlayStates[i] = -1;
        }
    }
    
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
    var startNote = this.startNote;
    // we do 2 rows at a time to mirror the nanoPAD2 layout of 2 rows
    // of 8 pads spread over 4 scenes for 8 rows * 8 pads total
    for (var i = 0; i < this.config.NUM_TRACKS; i+=2) {

        this.doRows(i);

        if (i > 1) {
            startNote += this.increment;     
        }
        
        this.doColumns(startNote, i);
    }
}

NanoPAD2.prototype.doRows = function(i) {
        this.trackPlayStates[i] = -1;
        this.trackPlayStates[i+1] = -1;

        this.trackClipContents[i] = [];
        this.trackClipContents[i+1] = [];

        this.addTrackObservers(i);
        this.addTrackObservers(i+1);

}

NanoPAD2.prototype.doColumns = function(startNote, i) {
        var evenRowStart = startNote-1;
        var colOdd = startNote;
        var colEven = evenRowStart;
        this.log(colEven + ", " + colOdd);

        // now set the cols
        for (var j = 0; j < this.config.NUM_SCENES_PER_TRACK; j++) {
            this.noteToClipLauncherGridMapping[colOdd] = { r: i, c: j };
            this.noteToClipLauncherGridMapping[colEven] = { r: i+1, c: j };
            colOdd+=2;
            colEven+=2;
        }
}

NanoPAD2.prototype.isClipMode = function() {
    return (this.mode == this.CLIP_MODE) ? true : false;
}

NanoPAD2.prototype.updateMode = function(isChannelController, data1, data2) {
    this.mode = this.getControllerMode(isChannelController, data1, data2);

}

NanoPAD2.prototype.updateLastNotePlayed = function(noteNumber) {
    this.lastNotePlayed = noteNumber;
}

NanoPAD2.prototype.handleSceneSelect = function(sysex) {
    log("last note played=" + this.lastNotePlayed);

    // can't find the nano scene unless we know the last note played
    // when we do then we know we're moving to the next highest scene
    // at which point we can just increment the scene on each sysex message
    if ((this.lastNotePlayed != -1) && (this.selectedScene == -1)) {
        var notesInScene = 16;
        // the 1st two pads are already accounted for so don't add them
        // to the range
        var noteRange = this.startNote + notesInScene-2;
        for (var i = 0; i < 4; i++) {
            log("start=" + this.startNote + ", noteRange="+noteRange);
            if (this.lastNotePlayed < noteRange) {
                this.selectedScene = ((i+2) % 4) || 4;
                break;
            }
            noteRange += notesInScene;
        }
    } else if ((this.lastNotePlayed != -1) && (this.selectedScene != -1)) {
        log("scene is already set so just incrementing");
        this.selectedScene = ((this.selectedScene + 1) % 4) || 4;
    } else {
        log("note not played on nano yet so can't locate current scene");
    }

    if (this.selectedScene != -1) {
        this.host.showPopupNotification("Nano Scene " + this.selectedScene);
    }
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
NanoPAD2.prototype.getIsPlayingObserverFunc = function(nanoPad2) {
    return function(isPlaying) {
        nanoPad2.handleTransportStopped(isPlaying);
    }
}