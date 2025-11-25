import WorldCameraFinderProvider from 'SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider'
import { LyricsData } from './LyricsData'
import { LyricsSubscriber } from './LyricsSubscriber'
import { Song } from './Song'
import { findAllScriptComponentsInChildren, findScriptComponentInChildren, findScriptComponentInSelfOrParents } from "SpectaclesInteractionKit.lspkg/Utils/SceneObjectUtils"
import { LyricsDistributor } from './LyricsDistributor'
import { LYRICS_STOP, LYRICS_STOP_DIRTY, LYRICS_WAITING, LYRICS_PAUSE } from './LyricsStates'
import { FloorHitTest } from './FloorHitTest'

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
    private Sidewalk: SceneObject = undefined
    @input
    private Wall: SceneObject = undefined
    @input
    private Signage: SceneObject = undefined
    @input
    private Sky: SceneObject = undefined

    private camera = WorldCameraFinderProvider.getInstance();

    @input
    lyricsLocations: SceneObject[]
    private _lyricsSubscribers: LyricsSubscriber[] = []
    private _lyrics: LyricsData = undefined
    private _startTime: number = 0
    private _currentPosition: number = 0
    private _currentLine = LYRICS_STOP_DIRTY
    private _headAlreadyVisible = false
    private _state = "stopped";
    private _floorDistributor: LyricsDistributor

    onAwake() {
        this.textTemplate = this.sceneObject.getComponent("Component.Text")
        this.createEvent("OnStartEvent").bind(() => { this.onStart() })
        this.createEvent("UpdateEvent").bind(() => { this.onUpdate() })
    }

    onStart() {
        this.registerSubscribers();
        this._floorDistributor = findScriptComponentInChildren(this.Floor, LyricsDistributor, 50)
    }

    setSong(song: Song) {
        this._lyrics = song.lyrics
        console.log("LyricsData", song.title, song.lyrics.timed.line.length, "lines")
    }

    registerSubscribers() {
        this.lyricsLocations.forEach(location => {
            var subs = findAllScriptComponentsInChildren(location, LyricsSubscriber)
            subs.forEach(sub => {
                console.log("Register LyricsSub", sub.getSceneObject().name)
                this._lyricsSubscribers.push(sub)
            });
        })
    }

    onUpdate() {

        // HEAD
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

        // HAND
        // display Hand if no Head visible
        this.Hand.enabled = !headIsVisible;

        var cameraLookAt = this.camera.forward()

        // FLOOR DANCE STEPS
        // display floor if look at the floor
        if (cameraLookAt.angleTo(vec3.down()) > 145 * MathUtils.DegToRad) {
            this.Floor.enabled = true
            // children will spawn using WorldQueryHitTest
        } else {
            // if camera lookat is leaving the floor and DanceStep not visible anymore
            if (!this._floorDistributor.isEnabledInHierarchy)
                this.Floor.enabled = false;
        }

        // Floor steps has been placed
        if (this._floorDistributor.isEnabledInHierarchy) {
            this._floorDistributor.setLyricsOnce(this._lyrics, this.getLyricsIndex(), this.textTemplate)
        }

        // SIDEWALK
        // console.log("spawn rabbit ?", cameraLookAt.angleTo(vec3.down())*MathUtils.RadToDeg, cameraLookAt.angleTo(vec3.right())*MathUtils.RadToDeg)
        // if (cameraLookAt.angleTo(vec3.down()) > 40 * MathUtils.DegToRad
        //     && cameraLookAt.angleTo(vec3.down()) < 50 * MathUtils.DegToRad
        //     && cameraLookAt.angleTo(vec3.right()) > 30 * MathUtils.DegToRad
        //     && cameraLookAt.angleTo(vec3.right()) < 40 * MathUtils.DegToRad) {
        //     console.log("Spawn Rabbit")
        //     this.Sidewalk.enabled = true
        //     // children will spawn using WorldQueryHitTest
        // }
        // if (this.Sidewalk.enabled) {
        //     if (!this.camera.getComponent().isSphereVisible(this.Sidewalk.children[0].getTransform().getWorldPosition().add(vec3.up().uniformScale(50)), 150)) {
        //         console.log("Unspawn Rabbit")
        //         this.Sidewalk.children[0].enabled = false
        //         this.Sidewalk.enabled = false
        //     }
        // }

        // PROPAGATION
        if (this._state == "playing") {
            this.propagateLyrics(this.getLyricsIndex())

        } else if (this._state == "paused") {
            this.propagateLyrics(LYRICS_PAUSE)
        } else if (this._state == "stopped") {
            this.propagateLyrics(LYRICS_STOP)
        }
    }

    getLyricsIndex() {
        if (this._state == "stopped") return LYRICS_STOP
        this._currentPosition = getTime() - this._startTime
        if (this._currentPosition < this._lyrics.timed.line[0].begin)
            return LYRICS_WAITING
        else {
            for (var l = 0; l < this._lyrics.timed.line.length; l++) {
                var line = this._lyrics.timed.line[l]
                if (line.begin < this._currentPosition && this._currentPosition < line.end) {
                    return l
                }
            }
        }
        return LYRICS_STOP
    }


    propagateLyrics(current: number) {
        if (current != this._currentLine) {
            this._currentLine = current

            this._lyricsSubscribers.forEach(lyricsSubscriber => {
                if (lyricsSubscriber as LyricsSubscriber) {
                    lyricsSubscriber.setLyrics(this._lyrics, current, this.textTemplate)
                }
            });
        }
    }

    play() {
        if (this._state == "stopped")
            this._startTime = getTime();
        else if (this._state == "paused")
            this._startTime = getTime() - this._currentPosition
        this._state = "playing"
    }

    pause() {
        this._state = "paused"
        this.Singing.enabled = false
        this.Thinking.enabled = false
        this.Hand.enabled = false
    }

    stop() {
        this._state = "stopped"
        this._startTime = 0
        this._currentLine = LYRICS_STOP_DIRTY
        this.propagateLyrics(LYRICS_STOP)
        this.Singing.enabled = false
        this.Thinking.enabled = false
        this.Hand.enabled = false
        this.Floor.enabled = false
    }
}
