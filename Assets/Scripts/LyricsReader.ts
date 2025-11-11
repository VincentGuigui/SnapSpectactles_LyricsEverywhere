import { LyricsData } from './LyricsData'

@component
export class LyricsReader extends BaseScriptComponent {

    private textTemplate: Text
    @input
    private Head: SceneObject = undefined
    @input
    private HeadBinding: Head = undefined
    @input
    private Hand: SceneObject = undefined
    @input
    private Thinking: SceneObject = undefined
    @input
    private Singing: SceneObject = undefined
    @input
    private Floor: SceneObject = undefined
    @input
    private Wall: SceneObject = undefined
    @input
    private Signage: SceneObject = undefined
    @input
    private Sky: SceneObject = undefined

    @input Lyrics: string = undefined

    _lyricsLocations: SceneObject[]
    _lyrics: LyricsData = undefined
    _startTime: number = 0
    _currentPosition: number = 0
    private _headAlreadyVisible = false
    private _state = "stopped";

    onAwake() {
        this._lyricsLocations = [
            this.Hand, this.Thinking, this.Singing, this.Floor, this.Wall, this.Signage, this.Sky
        ]

        this.textTemplate = this.sceneObject.getComponent("Component.Text")
        this.setAllTexts(undefined, "Lyrics")
        this._lyrics = JSON.parse(this.Lyrics)
        this.createEvent("UpdateEvent").bind(() => {
            this.update();
        })
    }

    setAllTexts(obj: SceneObject = undefined, newText: string) {
        if (obj == undefined) {
            for (var i = 0; i < this._lyricsLocations.length; i++) {
                this.setAllTexts(this._lyricsLocations[i], newText);
            }
        } else {
            this.setText(obj, newText);
            // Recursively check children
            for (var i = 0; i < obj.getChildrenCount(); i++) {
                this.setAllTexts(obj.getChild(i), newText);
            }
        }
    }

    setText(obj: SceneObject, newText: string) {
        // Check for Text (2D) component
        var text2D = obj.getComponent("Component.Text") as Text;
        if (text2D) {
            text2D.text = newText;
            text2D.textFill = this.textTemplate.textFill
        }
        // Check for Text3D component
        var text3D = obj.getComponent("Component.Text3D") as Text3D;
        if (text3D) {
            text3D.text = newText;
        }
    }

    start() {
        if (this._state == "stopped")
            this._startTime = getTime();
        else if (this._state == "paused")
            this._startTime = getTime() - this._currentPosition
        this._state = "playing"
    }

    update() {
        if (this._state == "stopped") return

        var headIsVisible = this.Head.isEnabledInHierarchy
        if (!headIsVisible) {
            this._headAlreadyVisible = false
        }
        if (headIsVisible && !this._headAlreadyVisible) {
            this._headAlreadyVisible = true
            var split = Math.random() > 0.5
            this.Singing.enabled = split
            this.Thinking.enabled = !split
        }

        // display priority 
        this.Hand.enabled = !headIsVisible;

        if (this._state == "playing") {
            this.displayLyrics()
        }
        else {
            this.setAllTexts(undefined, "")
        }
    }

    displayLyrics() {
        this._currentPosition = getTime() - this._startTime
        for (var l = 0; l < this._lyrics.timed.line.length; l++) {
            var line = this._lyrics.timed.line[l]
            if (line.begin < this._currentPosition && this._currentPosition < line.end) {
                this.setAllTexts(undefined, line.content)
                return;
            }
        }
    }

    pause() {
        this._state = "paused"
        this.Singing.enabled = false
        this.Thinking.enabled = false
        this.Hand.enabled = false
    }

    stop() {
        this.setAllTexts(undefined, "")
        this._state = "stopped"
        this._startTime = 0
        this.Singing.enabled = false
        this.Thinking.enabled = false
        this.Hand.enabled = false
    }
}
