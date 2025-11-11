import { LyricsReader } from './LyricsReader'
import { ToggleButton } from 'SpectaclesInteractionKit.lspkg/Components/UI/ToggleButton/ToggleButton';

@component
export class PlayMusic extends BaseScriptComponent {

  @input
  private LyricsReader: LyricsReader

  @input
  private SongTitles: string[] = [
    "Birthday Song",
    "Crazy People",
    "Crowded City",
    "Family Time",
    "Flying through the sky",
    "Light in the Night",
    "Sunshine Dance"
  ]

  @input
  private SongCover: Material[] = []

  @input
  private CurrentSong: number = 1;

  @input
  private PlayMaterial: Material = undefined

  @input
  private PauseMaterial: Material = undefined

  @input
  private PlayPauseImageButton: Image = undefined

  @input
  private StopButton: SceneObject = undefined

  @input("Component.Image")
  private coverImage: Image | undefined

  @input("Component.Text")
  private coverTitle: Text | undefined

  @input("Asset.AudioTrackAsset")
  private _audioTrackAsset: AudioTrackAsset | undefined

  get audioTrackAsset(): AudioTrackAsset | undefined {
    return this._audioTrackAsset
  }
  set audioTrackAsset(track: AudioTrackAsset) {
    this._audioTrackAsset = track

    if (this._audioComponent !== undefined) {
      this._audioComponent.audioTrack = track
    }
  }

  private _audioComponent: AudioComponent | undefined
  private _state = "stopped";

  onAwake() {
    this.createEvent('OnStartEvent').bind(() => {
      this.onStart();
    });
  }

  onStart() {
    this._audioComponent = this.getSceneObject().createComponent("Component.AudioComponent") as AudioComponent
    this._audioComponent.setOnFinish((audioComponent)=>{this.stop()})
    this._audioComponent.playbackMode = Audio.PlaybackMode.LowLatency
  }

  updateCoverFlow() {
    this.coverTitle.text = this.SongTitles[this.CurrentSong];
    this.coverImage.mainMaterial = this.SongCover[this.CurrentSong];
  }

  next() {
    this.CurrentSong = this.CurrentSong + 1;
    if (this.CurrentSong > this.SongTitles.length) {
      this.CurrentSong = 0;
    }
    this.updateCoverFlow();
  }

  previous() {
    this.CurrentSong = this.CurrentSong - 1;
    if (this.CurrentSong < 0) {
      this.CurrentSong = this.SongTitles.length - 1;
    }
    this.updateCoverFlow();
  }

  playPause() {
    if (this._audioComponent == undefined) return;
    if (this._state == "playing") {
      this.PlayPauseImageButton.mainMaterial = this.PlayMaterial
      this._audioComponent.pause()
      this.LyricsReader.pause()
      this._state = "paused";
    } else {
      if (this._state == "stopped") {
        this._audioComponent.audioTrack = this._audioTrackAsset
        this.PlayPauseImageButton.mainMaterial = this.PauseMaterial
        this._audioComponent.play(-1)
      }
      if (this._state == "paused") {
        this.PlayPauseImageButton.mainMaterial = this.PauseMaterial
        this._audioComponent.resume()
      }
      this.LyricsReader.start()
      this._state = "playing";
      this.StopButton.enabled = true
    }
  }

  stop() {
    this._audioComponent.stop(true)
    this.LyricsReader.stop()
    this.StopButton.enabled = false
    this._state = "stopped";
  }

}
