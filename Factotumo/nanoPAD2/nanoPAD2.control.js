loadAPI(1);

host.defineController(
	"Factotumo", "nanoPAD2 - Factotumo",
	"1.0", "ae945665-8dd6-4615-8294-fc06e4a02c0b"
);

host.defineMidiPorts(1,0);

// set to 1 for console logging
var enableDebugLogging = 1;

var mainTrackBank;

var NUM_TRACKS = 8;
var NUM_SCENES_PER_TRACK = 8;

var trackPlayStates = [];

var noteToClipLauncherGridMapping;

function init() {

	var firstIn = host.getMidiInPort(0);
	
	firstIn.setMidiCallback(onMidi);
	firstIn.setSysexCallback(onSysex)

	// since we're using the nano note messages for clip launching we don't
	// need them for note inputs
	//var noteInput = firstIn.createNoteInput("");
	//noteInput.setShouldConsumeEvents(false);	

	// we support 8 tracks with 8 scenes
	mainTrackBank = host.createMainTrackBank(NUM_TRACKS, 0, NUM_SCENES_PER_TRACK);

	noteToClipLauncherGridMapping = getNoteToClipLauncherGridMapping();	

	for (var i = 0; i < NUM_TRACKS; i++) {
		trackPlayStates[i] = -1;
		var track = mainTrackBank.getChannel(i);
		var clipLauncherSlots = track.getClipLauncherSlots();
	
		clipLauncherSlots.addPlaybackStateObserver(
			getTrackSlotObserverFunc(
				i,
				function(rowIndex, slotIndex, playbackState, isQueued) {
					// 0=stopped, 1=playing, 2=recording
					if (isQueued && (playbackState == 0)) {
						log("stop queued, setting track playback state to -1 (stopped) for track " + rowIndex + ", slot=" + slotIndex);
						trackPlayStates[rowIndex] = -1;
					} else if (isQueued && (playbackState == 1)) {
						log("play queued, setting track playback state to playing for track " + rowIndex + ", slot=" + slotIndex);
						trackPlayStates[rowIndex] = slotIndex;
					}
				}
			)
		);

	}

	log("init done.");
}

function onMidi(status, data1, data2) {
	log("onMidi(status=" + status + ", data1=" + data1 + ", data2=" + data2 + ")");

	// we use note on messages to control clip launching
	if (status == 144) {
		var noteMapping = noteToClipLauncherGridMapping[data1];
		log("handling note on for note number " + data1 + " grid location: row=" + noteMapping.r + ", col=" + noteMapping.c);
		if (trackPlayStates[noteMapping.r] == -1) {
			log("launching clip on track " + noteMapping.r + ", clip " + noteMapping.c);
			mainTrackBank.getChannel(noteMapping.r).getClipLauncherSlots().launch(noteMapping.c);
		} else {
			// this track is already playing a clip.  stop playing if the pad pressed matches
			// the playing clip otherwise launch a new clip on the track.
			if (trackPlayStates[noteMapping.r] == noteMapping.c) {
				log("stopping track " + noteMapping.r + ", clip " + noteMapping.c);
				mainTrackBank.getChannel(noteMapping.r).getClipLauncherSlots().stop();
			} else {
				log("track " + noteMapping.r + " already playing clip " + trackPlayStates[noteMapping.r] + ", launching new clip " + noteMapping.c);
				mainTrackBank.getChannel(noteMapping.r).getClipLauncherSlots().launch(noteMapping.c);
			}
			
		}
		
	}
}

function getNoteToClipLauncherGridMapping() {
	var noteToClipLauncherGridMapping = {};
	
	// top left pad of scene 1 of the nanopad by default sends note on for note number 37 (c#)
	var startNote = 37;
	var increment = 16;
	
	var i = 0;
	while (i < 8) {
		if (i > 1) {
			startNote += increment;	    
	    }
	    var evenRowStart = startNote-1;

	    var colOdd = startNote;
	    var colEven = evenRowStart;
	    log(colEven + ", " + colOdd);

	    // now set the cols
	    for (var j = 0; j < 8; j++) {
		    noteToClipLauncherGridMapping[colOdd] = { r: i, c: j };
		    noteToClipLauncherGridMapping[colEven] = { r: i+1, c: j };
		    colOdd+=2;
		    colEven+=2;
	    }

	    i+=2;
	}
	return noteToClipLauncherGridMapping;
}

function getTrackSlotObserverFunc(index, f) {
	return function(slotIndex, playbackState, isQueued) {
		f(index, slotIndex, playbackState, isQueued);
	};
}

function onSysex(data) {
	log("data=" + data);
}

function exit() {
	log("exit.");
}

function log(msg) {
	if (enableDebugLogging) {
		println(msg);
	}
}