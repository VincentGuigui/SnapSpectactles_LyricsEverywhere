import { LyricsData } from './LyricsData'
import { LYRICS_STOP, LYRICS_STOP_DIRTY, LYRICS_WAITING, LYRICS_PAUSE } from './LyricsStates'
import { LyricsSubscriber } from './LyricsSubscriber'
import { findAllComponentsInChildren } from "SpectaclesInteractionKit.lspkg/Utils/SceneObjectUtils"

@component
export class WordsLyricsDistributor extends LyricsSubscriber {
    @input
    lyricsOffset: 0
    @input
    parentObject: SceneObject
    @input
    withFutureLyrics = true
    @input
    withRemainerObject = false
    @input
    centeredAcrossObjects = false

    alreadySet = false
    lyricsText: Text[] = []

    onAwake() {
        this.createEvent("OnStartEvent").bind(this.onStart.bind(this))
    }

    onStart() {
        var texts = findAllComponentsInChildren(this.sceneObject, "Component.Text")
        texts.forEach(text => {
            this.lyricsText.push(text as Text)
        });

    }

    override setLyrics(lyrics: LyricsData, current: number, template: Text) {
        var wordsToDistribute: string[] = []
        if (this.fakeLyrics == "" && (current == LYRICS_STOP || current == LYRICS_WAITING)) {
            for (let i = 0; i < this.lyricsText.length; i++) {
                wordsToDistribute.push("")
            }
        }
        else {
            while (wordsToDistribute.length < this.lyricsText.length) {
                var lyric = this.findLyric(lyrics, current);
                if (lyric == "") {
                    for (let i = wordsToDistribute.length; i < this.lyricsText.length; i++) {
                        wordsToDistribute.push('')
                    }
                    break
                }
                var words = lyric.split(' ')
                words.forEach(word => {
                    // if (wordsToDistribute.length < this.lyricsText.length)
                    wordsToDistribute.push(word)
                })
                if (this.withFutureLyrics)
                    current++
                else {
                    break
                }
            }
        }
        var skipStart = 0
        var skipEnd = 0
        var diff = this.lyricsText.length  - wordsToDistribute.length
        if (diff > 0) {
            if (this.centeredAcrossObjects) {
                if (diff % 2 == 0) {
                    skipStart = skipEnd = diff / 2
                }
                else {
                    skipStart = Math.floor(diff / 2)
                    skipEnd = Math.ceil(diff / 2)
                }
            }
            else {
                skipEnd = this.lyricsText.length - wordsToDistribute.length
            }
        }
        for (let i = 0; i < skipStart; i++) {
            this.lyricsText[i].textFill = template.textFill
            this.lyricsText[i].text = '';
        }
        for (let i = skipStart; i < this.lyricsText.length - skipEnd; i++) {
            this.lyricsText[i].textFill = template.textFill
            if (i - skipStart < wordsToDistribute.length)
                this.lyricsText[i].text = wordsToDistribute[i - skipStart];
            else
                this.lyricsText[i].text = '';
        }
        for (let i = this.lyricsText.length - skipEnd; i < this.lyricsText.length; i++) {
            this.lyricsText[i].textFill = template.textFill
            this.lyricsText[i].text = '';
        }
        if (this.withRemainerObject) {
            this.lyricsText[this.lyricsText.length - 1].text = wordsToDistribute.slice(this.lyricsText.length - 1, wordsToDistribute.length).join(" ")
        }
    }

    setLyricsOnce(lyrics: LyricsData, current: number, template: Text) {
        if (this.alreadySet) {
            return
        }
        this.alreadySet = true
        this.setLyrics(lyrics, current, template)
    }

    reset() {
        this.alreadySet = false
        this.parentObject.enabled = false
    }
}
