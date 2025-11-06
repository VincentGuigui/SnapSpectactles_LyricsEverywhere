// Main Controller
//
// Made with Easy Lens

//@input Component.ScriptComponent coverImage0
//@input Component.ScriptComponent prevButton
//@input Component.ScriptComponent playPauseButton
//@input Component.ScriptComponent nextButton
//@input Component.ScriptComponent coverTitle
//@input Component.ScriptComponent lyricsText
//@input Component.ScriptComponent touchEvents


try {

// --- Hardcoded Musics.json data ---
const musicsList = [
    {
        "title": "Sunshine Dance",
        "image": "Assets/Music/Covers/SunshineDance.jpg"
    },
    {
        "title": "Moonlight Groove",
        "image": "Assets/Music/Covers/MoonlightGroove.jpg"
    },
    {
        "title": "Starry Skies",
        "image": "Assets/Music/Covers/StarrySkies.jpg"
    }
    // Add more tracks/images here if needed
];

// --- Hardcoded LRC lyrics for Sunshine Dance ---
const lrcData = `
[00:00.00][ar:Sunshine Dance Crew][ti:Sunshine Dance]
[00:07.50]Let the sunshine in your heart
[00:13.20]Feel the rhythm, let it start
[00:19.00]Raise your hands and move your feet
[00:24.80]Dancing in the summer heat
[00:30.45]Sunshine, sunshine, come alive
[00:36.10]We’re all here to feel the vibe
[00:41.80]Celebrate, don’t hesitate
[00:47.55]Sunshine Dance, it’s not too late
[00:53.00][by:Music by HappyBeats]
[00:53.70]Everybody now, jump in line
[00:59.20]Let your worries all unwind
[01:04.70]Smiles are shining, hearts are free
[01:10.40]Join the dance and sing with me
[01:16.00]Sunshine, sunshine, fill the sky
[01:21.70]Energy is flying high
[01:27.40]Celebrate, don’t hesitate
[01:33.00]Sunshine Dance, it’s not too late
[01:38.60]Sunshine Dance, it’s not too late
`;

// --- LRC Parsing ---
function parseEnhancedLRC(lrc) {
    const lines = lrc.split('\n');
    const result = [];
    function parseTimecode(tc) {
        const match = tc.match(/(\d{2}):(\d{2})(?:\.(\d{2}))?/);
        if (!match) { return null; }
        const min = parseInt(match[1]);
        const sec = parseInt(match[2]);
        const centi = match[3] ? parseInt(match[3]) : 0;
        return min * 60 + sec + centi / 100;
    }
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) { continue; }
        const timeTags = [];
        let tagMatch;
        const timeTagRegex = /\[(\d{2}:\d{2}(?:\.\d{2})?)\]/g;
        const metaTagRegex = /\[([a-z]{2,}:[^\]]+)\]/g;
        line = line.replace(metaTagRegex, '');
        while ((tagMatch = timeTagRegex.exec(line)) !== null) {
            timeTags.push(tagMatch[1]);
        }
        line = line.replace(timeTagRegex, '').trim();
        if (!timeTags.length) {
            const inlineRegex = /<(\d{2}:\d{2}(?:\.\d{2})?)>/g;
            let lastIndex = 0;
            let lyricParts = [];
            let inlineMatch;
            while ((inlineMatch = inlineRegex.exec(line)) !== null) {
                if (inlineMatch.index > lastIndex) {
                    lyricParts.push({
                        time: null,
                        text: line.substring(lastIndex, inlineMatch.index)
                    });
                }
                lyricParts.push({
                    time: parseTimecode(inlineMatch[1]),
                    text: ''
                });
                lastIndex = inlineMatch.index + inlineMatch[0].length;
            }
            if (lastIndex < line.length) {
                lyricParts.push({
                    time: null,
                    text: line.substring(lastIndex)
                });
            }
            let currentText = '';
            for (let j = 0; j < lyricParts.length; j++) {
                if (lyricParts[j].time != null) {
                    if (currentText.trim().length > 0) {
                        result.push({ time: lyricParts[j].time, text: currentText.trim() });
                    }
                    currentText = '';
                }
                currentText = currentText + lyricParts[j].text;
            }
            if (currentText.trim().length > 0) {
                if (result.length > 0) {
                    result[result.length - 1].text = result[result.length - 1].text + ' ' + currentText.trim();
                }
            }
            continue;
        }
        for (let t = 0; t < timeTags.length; t++) {
            const time = parseTimecode(timeTags[t]);
            if (line.length > 0) {
                result.push({ time: time, text: line });
            }
        }
    }
    result.sort(function(a, b) {
        return a.time - b.time;
    });
    return result;
}
const lyricsArray = parseEnhancedLRC(lrcData);
let currentLyricIndex = 0;

// --- Cover Flow State ---
let coverIndex = 0;
let isPlaying = false;

// --- UI Layout constants (relative positions to palm anchor) ---
const COVER_OFFSET = new vec2(0, 0); // coverImage0 centered at palm
const TITLE_OFFSET = new vec2(0, 0.18); // coverTitle below cover image
const BUTTON_Y_OFFSET = 0.15; // Vertical offset for prev/next buttons relative to cover center
const BUTTON_X_GAP = 0.28; // Horizontal distance from palm to prev/next buttons
const PLAY_BUTTON_OFFSET = new vec2(0, 0.26); // play/pause button below title

// --- Lyrics Display ---
function updateLyricDisplay() {
    if (lyricsArray.length === 0) {
        script.lyricsText.text = "No lyrics loaded.";
        return;
    }
    const entry = lyricsArray[currentLyricIndex];
    const minutes = Math.floor(entry.time / 60);
    const seconds = Math.floor(entry.time % 60);
    const centis = Math.floor((entry.time - Math.floor(entry.time)) * 100);
    const timeStr = minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0') + '.' + centis.toString().padStart(2, '0');
    script.lyricsText.text = timeStr + "  " + entry.text;
}

// --- UI Button Tap Detection ---
function isTapOnSticker(sticker, tapX, tapY) {
    const pos = sticker.position;
    const scale = sticker.scale;
    const xMin = pos.x - scale.x / 2;
    const xMax = pos.x + scale.x / 2;
    const yMin = pos.y - scale.y / 2;
    const yMax = pos.y + scale.y / 2;
    return tapX >= xMin && tapX <= xMax && tapY >= yMin && tapY <= yMax;
}

// --- Touch Events on UI ---
script.touchEvents.onTap.add(function(tapX, tapY) {
    // UI: Prev
    if (isTapOnSticker(script.prevButton, tapX, tapY)) {
        coverIndex = coverIndex - 1;
        if (coverIndex < 0) {
            coverIndex = musicsList.length - 1;
        }
        updateCoverFlowUI();
        setPlayPauseButtonIcon();
        // Designer: update coverImage0's image asset if needed
        return;
    }
    // UI: Next
    if (isTapOnSticker(script.nextButton, tapX, tapY)) {
        coverIndex = coverIndex + 1;
        if (coverIndex >= musicsList.length) {
            coverIndex = 0;
        }
        updateCoverFlowUI();
        setPlayPauseButtonIcon();
        // Designer: update coverImage0's image asset if needed
        return;
    }
    // UI: Play/Pause
    if (isTapOnSticker(script.playPauseButton, tapX, tapY)) {
        if (isPlaying) {
            pauseAudio();
        } else {
            playAudio();
        }
        return;
    }
    // UI: Central area (not on any button) advances lyrics
    if (!isTapOnSticker(script.prevButton, tapX, tapY) &&
        !isTapOnSticker(script.nextButton, tapX, tapY) &&
        !isTapOnSticker(script.playPauseButton, tapX, tapY)) {
        if (lyricsArray.length === 0) { return; }
        currentLyricIndex = currentLyricIndex + 1;
        if (currentLyricIndex >= lyricsArray.length) {
            currentLyricIndex = 0;
        }
        updateLyricDisplay();
    }
});

// --- Initialize state on load ---
updateCoverFlowUI();
updateLyricDisplay();
setPlayPauseButtonIcon();

} catch(e) {
  print("error in controller");
  print(e);
}
