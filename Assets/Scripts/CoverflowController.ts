import { LyricsData } from './LyricsData';
import { Song } from './Song';
import { Songs } from './Songs';
import { LyricsReader } from './LyricsReader'

@component
export class CoverflowController extends BaseScriptComponent {

  @input
  private LyricsReader: LyricsReader

  @input
  private SongsObject: Songs

  @input
  private CurrentSong: number = 6

  @input
  private PlayMaterial: Material = undefined

  @input
  private PauseMaterial: Material = undefined

  @input
  private PlayPauseImageButton: Image = undefined

  @input
  private StopButton: SceneObject = undefined

  @input
  private coverImage: Image | undefined

  @input
  private coverTitle: Text | undefined

  @input
  @allowUndefined
  private _audioComponent: AudioComponent | undefined
  private _state = "stopped";

  onAwake() {
    this.createEvent('OnStartEvent').bind(() => {
      this.onStart();
    });

  }

  onStart() {
    this._audioComponent.setOnFinish((audioComponent)=>{this.stop()})
    this._audioComponent.playbackMode = Audio.PlaybackMode.LowLatency
    this.updateCoverFlow();
  }

  updateCoverFlow() {
    var sunshineDanceIndex = 6
    this.coverTitle.text = this.SongsObject.Songs[this.CurrentSong].title
    this.coverImage.mainMaterial = this.SongsObject.Songs[this.CurrentSong].cover
    this.LyricsReader.setSong(this.SongsObject.Songs[sunshineDanceIndex])
    if (this._audioComponent !== undefined) {
      var track:AudioTrackAsset = this.SongsObject.Songs[sunshineDanceIndex].track
      this._audioComponent.audioTrack = track as AudioTrackAsset
    }
  }

  next() {
    this.CurrentSong = this.CurrentSong + 1;
    if (this.CurrentSong >= this.SongsObject.Songs.length) {
      this.CurrentSong = 0;
    }
    this.updateCoverFlow();
  }

  previous() {
    this.CurrentSong = this.CurrentSong - 1
    if (this.CurrentSong < 0) {
      this.CurrentSong = this.SongsObject.Songs.length - 1
    }
    this.updateCoverFlow();
  }

  playPause() {
    if (this._audioComponent == undefined) return;
    if (this._state == "playing") {
      this.PlayPauseImageButton.mainMaterial = this.PlayMaterial
      this._audioComponent.pause()
      this.LyricsReader.pause()
      this._state = "paused"
    } else {
      this.PlayPauseImageButton.mainMaterial = this.PauseMaterial
      if (this._state == "stopped") {
        this._audioComponent.play(-1)
      }
      if (this._state == "paused") {
        this._audioComponent.resume()
      }
      this.LyricsReader.start()
      this._state = "playing"
      this.StopButton.enabled = true
    }
  }

  stop() {
    this._audioComponent.stop(true)
    this.LyricsReader.stop()
    this.StopButton.enabled = false
    this.PlayPauseImageButton.mainMaterial = this.PlayMaterial
    this._state = "stopped"
  }

}
