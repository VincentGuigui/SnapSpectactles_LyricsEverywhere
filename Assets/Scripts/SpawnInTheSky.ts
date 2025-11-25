import { LSTween } from "LSTween.lspkg/LSTween"
import { SpawnerOutOfRange } from "./SpawnerOutOfRange"
import { SpawnTransform } from "./SpawnerBase"

@component
export class SpawnInTheSky extends SpawnerOutOfRange {

    onAwake() {
        super.onAwake()
    }

    spawnObjectActionWithTransition(tr: SpawnTransform, onComplete: () => void) {
        LSTween.moveToWorld(this.objectToSpawn.getTransform(), tr.position, this.transitionDuration)
            .onComplete(onComplete.bind(this))
            .start() 
    }
}
