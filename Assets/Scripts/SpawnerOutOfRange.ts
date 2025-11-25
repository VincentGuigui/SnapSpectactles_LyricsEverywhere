import { LSTween } from "LSTween.lspkg/LSTween"
import { MyWorldQueryHitSubscriberRegistration, MyWorldQueryHitTest } from "./MyWorldQueryHitTest"
import { SpawnerBase } from "./SpawnerBase"

@component
export class SpawnerOutOfRange extends SpawnerBase {
    @input
    @hint("Specifies this distance (in cm) to trigger the respawn")
    distanceThreshold: number

    onAwake() {
        this.createEvent("UpdateEvent").bind(this.onUpdate.bind(this));
    }

    spawnTrigger() {
        if (this.isSpawning) return false
        var thisPosition = this.objectToSpawn.getTransform().getWorldPosition()
        var referenceObjectPosition = this.referenceObject.getTransform().getWorldPosition()
        var currentDistance = thisPosition.distance(referenceObjectPosition);

        if (currentDistance > this.distanceThreshold) {
            if (this.printDebug)
                console.log("spawnTrigger", true)
            return true
        }
        if (this.printDebug)
            console.log("spawnTrigger", false)
        return false
    }
}
