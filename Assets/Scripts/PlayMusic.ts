import { ToggleButton } from 'SpectaclesInteractionKit.lspkg/Components/UI/ToggleButton/ToggleButton';
//import * as fs from 'LensStudio:FileSystem';


@component
export class PlayMusic extends BaseScriptComponent {

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
  private musicsList = [
  {"title":"Birthday Song","cover":"birthday song.jpg"},
  {"title":"Crazy People","cover":"crazy people.jpg"},
  {"title":"Crowded City","cover":"crowded city.jpg"},
  {"title":"Family Time","cover":"family time.jpg"},
  {"title":"Flying through the sky","cover":"flying through the sky.jpg"},
  {"title":"Sunshine Dance","cover":"SunshineDance_3m45.jpg"},
  {"title":"Light in the Night","cover":"light in the night.jpg"}
  ];

  private coverIndex = 1;


  onAwake() {
    this.createEvent('OnStartEvent').bind(() => {
      this.onStart();
    });
  }
  
  private isPlaying = false;
  onStart() {
    this._audioComponent = this.getSceneObject().createComponent("Component.AudioComponent") as AudioComponent
    this._audioComponent.playbackMode = Audio.PlaybackMode.LowLatency

    // This script assumes that a ToggleButton (and Interactable + Collider) component have already been instantiated on the SceneObject.
    var tg=  ToggleButton.getTypeName()
    console.log(tg)
    let toggleButton = this.sceneObject.getComponent(tg);

    let onStateChangedCallback = (state: boolean) => {
    
    this.updateCoverFlow();

    //toggleButton.onStateChanged.add(onStateChangedCallback);
  };
  }

  playPause() {
    if (this._audioComponent == undefined) return;
    if (!this.isPlaying) {
      this._audioComponent.audioTrack = this._audioTrackAsset
      console.log("Play")
      this._audioComponent.play(1)
      this.isPlaying = true;
    } else {
      console.log("Pause")
      this._audioComponent.pause()
      this.isPlaying = false;
    }
  }

  updateCoverFlow() {
      console.log("coverIndex", this.coverIndex)
  //    script.coverImage.mainMaterial.texture = musicsList[coverIndex].cover;
      this.coverTitle.text = this.musicsList[this.coverIndex].title;
  }


next() {
    console.log("next")
    this.coverIndex = this.coverIndex + 1;
    if (this.coverIndex > this.musicsList.length) {
        this.coverIndex = 0;
    }
    this.updateCoverFlow();
}

previous(){
    this.coverIndex = this.coverIndex - 1;
    if (this.coverIndex < 0) {
        this.coverIndex = this.musicsList.length - 1;
    }
    this.updateCoverFlow();

}
}
