import { WordsLyricsDistributor } from './WordsLyricsDistributor'
import { LYRICS_STOP, LYRICS_STOP_DIRTY, LYRICS_WAITING, LYRICS_PAUSE } from './LyricsStates'
import { LyricsData } from './LyricsData';

@component
export class LipSyncLyricsDistributor extends WordsLyricsDistributor {

    animationProvider: AnimatedTextureFileProvider = null;

    @input
    autoPlay = true
    @input
    loop = 1

    onStart() {
        super.onStart()
        var pass = this.sceneObject.getComponent("Component.Image").mainPass
        if (pass.baseTex) {
            this.animationProvider = pass.baseTex.control as AnimatedTextureFileProvider;
            if (this.animationProvider.isOfType('Provider.AnimatedTextureFileProvider')) {
                this.animationProvider.pauseAtFrame(0)
                if (this.autoPlay)
                    this.animationProvider.playFromFrame(0, this.loop)
            }
        }
    }

    setLyrics(lyrics: LyricsData, current: number, template: Text): void {
        if (current == LYRICS_STOP || current == LYRICS_PAUSE)
            this.animationProvider.stop()
        else
            if (current == LYRICS_WAITING) {
                this.animationProvider.pause()

            }
            else {
                this.animationProvider.playFromFrame(this.animationProvider.getCurrentPlayingFrame(), this.loop)
            }

    }
}

