import { LyricsData } from './LyricsData'
import { LYRICS_STOP, LYRICS_STOP_DIRTY, LYRICS_WAITING, LYRICS_PAUSE } from './LyricsStates'

@component
export class LyricsSubscriber extends BaseScriptComponent {

    @input
    lyricsOffset: 0

    @input
    fakeLyrics = ""

    onAwake() {

    }

    setLyrics(lyrics: LyricsData, current: number, template: Text) {
        if (current == LYRICS_PAUSE) return
        var lyric = this.findLyric(lyrics, current);
        // Check for Text (2D) component
        var text2D = this.sceneObject.getComponent("Component.Text") as Text;
        if (text2D) {
            text2D.textFill = template.textFill
            text2D.text = lyric;
        }
        // Check for Text3D component
        var text3D = this.sceneObject.getComponent("Component.Text3D") as Text3D;
        if (text3D) {
            text3D.text = lyric;
        }
    }

    protected findLyric(lyrics: LyricsData, current: number): string {
        if (this.fakeLyrics != "") 
            return this.fakeLyrics
        if (lyrics == null || current == LYRICS_STOP) return ""
        if (current == LYRICS_WAITING) return "..."
        current = current + this.lyricsOffset
        if (this.lyricsOffset < 0 && current < 0)
            return ""
        if (current < 0)
            return "..."
        if (current > lyrics.timed.line.length - 1)
            return ""
        return lyrics.timed.line[current].content
    }

    setEnable(enable: boolean = true) {
        this.sceneObject.enabled = enable
    }
}
