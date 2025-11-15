import { LyricsData } from './LyricsData'
import { LyricsSubscriber } from './LyricsSubscriber'
import { Song } from './Song'
import { findComponentInChildren } from 'SpectaclesInteractionKit.lspkg/Utils/SceneObjectUtils'

@component
export class LyricsReader extends BaseScriptComponent {

    private textTemplate: Text
    @input
    private Head: SceneObject = undefined
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

    @input
    lyricsLocations: SceneObject[]
    _lyricsSubscribers: LyricsSubscriber[] = []
    _lyrics: LyricsData = undefined
    _startTime: number = 0
    _currentPosition: number = 0
    private _headAlreadyVisible = false
    private _state = "stopped";

    onAwake() {
        this.registerSubscribers();
        this.textTemplate = this.sceneObject.getComponent("Component.Text")
        this.createEvent("UpdateEvent").bind(() => {
            this.update();
        })
    }

    setSong(song: Song) {
        this._lyrics = song.lyrics
        console.log("LyricsData", song.title, song.lyrics.timed.line.length, "lines")
    }

    registerSubscribers(parent: SceneObject = undefined) {
        var children: SceneObject[]
        if (parent == undefined) {
            children = this.lyricsLocations;
        } else {
            children = parent.children
            for (const component of parent.getComponents("ScriptComponent") as ScriptComponent[]) {
                if (component instanceof LyricsSubscriber) {
                    this._lyricsSubscribers.push(component as LyricsSubscriber)
                }
            }
        }
        // Recursively check children
        for (var i = 0; i < children.length; i++) {
            this.registerSubscribers(children[i]);
        }
    }

    setLyrics(current: number) {
        this._lyricsSubscribers.forEach(lyricsSubscriber => {
            if (lyricsSubscriber as LyricsSubscriber) {
                lyricsSubscriber.setLyrics(this._lyrics, current, this.textTemplate)
            }
        });
    }

    start() {
        if (this._state == "stopped")
            this._startTime = getTime();
        else if (this._state == "paused")
            this._startTime = getTime() - this._currentPosition
        this._state = "playing"
    }

    update() {
        if (this._state == "stopped") {
            this.Singing.enabled = false
            this.Thinking.enabled = false
            this.Hand.enabled = false
            return
        }

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
            this.setLyrics(-1)
        }
    }

    displayLyrics() {
        this._currentPosition = getTime() - this._startTime
        if (this._currentPosition < this._lyrics.timed.line[0].begin)
            this.setLyrics(-1)
        else {
            for (var l = 0; l < this._lyrics.timed.line.length; l++) {
                var line = this._lyrics.timed.line[l]
                if (line.begin < this._currentPosition && this._currentPosition < line.end) {
                    this.setLyrics(l)
                    return;
                }
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
        this.setLyrics(-1)
        this._state = "stopped"
        this._startTime = 0
        this.Singing.enabled = false
        this.Thinking.enabled = false
        this.Hand.enabled = false
    }
}
