import { LyricsData } from './LyricsData'

@component
export class LyricsSubscriber extends BaseScriptComponent {

    @input 
    lyricsOffset:0

    onAwake() {

    }

    setLyrics(lyrics:LyricsData, current:number, template: Text){
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

    private findLyric(lyrics:LyricsData, current:number) : string {
        current = current + this.lyricsOffset
        if (this.lyricsOffset < 0 && current < 0)
            return ""
        if (current < 0)
            return "..."
        if (current > lyrics.timed.line.length - 1)
            return ""
        return lyrics.timed.line[current].content
    }

}
