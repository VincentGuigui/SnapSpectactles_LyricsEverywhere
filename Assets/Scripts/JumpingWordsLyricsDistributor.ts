import { LSTween } from 'LSTween.lspkg/LSTween'
import Easing from 'LSTween.lspkg/TweenJS/Easing'
import { WordsLyricsDistributor } from './WordsLyricsDistributor'
import { JumpingVector } from './JumpingVector'

@component
export class JumpingWordsLyricsDistributor extends WordsLyricsDistributor {
    @input
    transitionDuration = 2000
    @input
    totalDuration = 8000

    override setEnable(enable: boolean) {
        super.setEnable(true)
        var i = 0
        var stepDuration = this.transitionDuration / this.sceneObject.children.length
        this.sceneObject.children.forEach(element => {
            var jumpingVector: JumpingVector
            for (const component of element.getComponents("Component.ScriptComponent") as ScriptComponent[]) {
                if (component instanceof JumpingVector) {
                    jumpingVector = component as JumpingVector
                }
            }
            if (jumpingVector) {
                LSTween.moveOffset(element.getTransform(), jumpingVector.vector, 2 * stepDuration)
                    .delay(stepDuration * i)
                    .easing(Easing.Elastic.Out)
                    .start().onComplete(() => {
                        LSTween.moveOffset(element.getTransform(), jumpingVector.vector.uniformScale(-1), stepDuration)
                            .delay(this.totalDuration)
                            .easing(Easing.Elastic.In)
                            .start()
                    })
            }
            i++
        })
        LSTween.rawTween(this.transitionDuration).delay(this.totalDuration + this.transitionDuration)
            .onComplete(() => {
                this.reset()
            }).start()
    }
}

