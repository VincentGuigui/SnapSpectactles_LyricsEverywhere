import { LSTween } from "LSTween.lspkg/LSTween"
import { MyWorldQueryHitSubscriberRegistration, MyWorldQueryHitTest } from "./MyWorldQueryHitTest"

@component
export class SpawnerBase extends BaseScriptComponent {
    @input
    worldHitTest: MyWorldQueryHitTest
    registration: MyWorldQueryHitSubscriberRegistration
    @input
    referenceObject: SceneObject
    @input
    objectToSpawn: SceneObject
    @input
    @hint("Specifies this distance (in cm) to trigger the respawn")
    distanceThreshold: number
    @input
    changeYaw: boolean = true
    @input
    @hint("Relative to referenceObject orientation (horizontal)")
    @showIf("changeYaw", true)
    yawRange: vec2
    @input
    changePitch: boolean = true
    @input
    @hint("Relative to horizon (vertical)")
    @showIf("changePitch", true)
    pitchRange: vec2
    @input
    @hint("On the floor")
    @showIf("on the floor or head relative", true)
    onTheFloor: boolean
    @input
    changeDistance: boolean = true
    @input
    @hint("Relative to referenceObject position")
    @showIf("changeDistance", true)
    distanceRange: vec2
    @input
    @allowUndefined
    debugText: Text
    @input
    printDebug: boolean = false
    @input
    transitionDuration: number = 2000
    @input
    @hint("Call to Spawn method will be done by code")
    customSpawn: boolean = false

    isSpawning = false
    hasSpawned = false

    onAwake() {
        this.createEvent("UpdateEvent").bind(this.onUpdate.bind(this));
    }


    onUpdate() {
        if (this.isSpawning) return
        if (!this.customSpawn && this.spawnTrigger()) {
            this.spawnObject()
        }
    }

    spawnTrigger(): boolean {
        return true
    }

    spawnObject() {
        var tr = this.computeSpawnTransformation()
        if (this.transitionDuration > 1) {
            this.isSpawning = true
            this.spawnObjectActionWithTransition(tr, this.onSpawnComplete.bind(this))
        }
        else {
            this.spawnObjectActionImmediate(tr, this.onSpawnComplete.bind(this))
        }
        this.afterSpawnObjectAction()
    }

    computeSpawnTransformation(): SpawnTransform {
        var thisPosition = this.objectToSpawn.getTransform().getWorldPosition()
        var referenceObjectPosition = this.referenceObject.getTransform().getWorldPosition()
        var currentDistance = thisPosition.distance(referenceObjectPosition);
        var referenceObjectRotation = this.referenceObject.getTransform().getWorldRotation()

        var yaw = referenceObjectRotation.y;
        var pitch = 0 // horizon, if it was relative to pov, we would have used referenceObjectRotation.x;
        const finalYaw = (
            !this.changeYaw
                ? yaw
                : yaw + (MathUtils.randomRange(this.yawRange.x, this.yawRange.y) * MathUtils.DegToRad)
        )
        const finalPitch =
            !this.changePitch
                ? pitch
                : (MathUtils.randomRange(this.pitchRange.x, this.pitchRange.y) * MathUtils.DegToRad)

        // this.debug("yaw:" + yaw * MathUtils.RadToDeg + "=>" + finalYaw * MathUtils.RadToDeg)
        // this.debug("pitch:" + pitch * MathUtils.RadToDeg + "=>" + finalPitch * MathUtils.RadToDeg)
        const distance =
            !this.changeDistance
                ? currentDistance
                : (MathUtils.randomRange(this.distanceRange.x, this.distanceRange.y))
        const correctYaw = (MathUtils.DegToRad * -90) - finalYaw
        const dir = new vec3(
            Math.cos(finalPitch) * Math.cos(correctYaw),
            Math.sin(finalPitch),
            Math.cos(finalPitch) * Math.sin(correctYaw),
        ).normalize();

        var respawnPosition = referenceObjectPosition.add(dir.mult(new vec3(distance, distance, distance)));
        return new SpawnTransform(respawnPosition, this.objectToSpawn.getTransform().getWorldRotation())
    }

    spawnObjectActionWithTransition(tr: SpawnTransform, onComplete: () => void) {
        LSTween.rawTween(this.transitionDuration)
            .onComplete(() => {
                this.objectToSpawn.getTransform().setWorldPosition(tr.position)
                this.objectToSpawn.getTransform().setWorldRotation(tr.rotation)
                onComplete()
            })
            .start()
    }

    spawnObjectActionImmediate(tr: SpawnTransform, onComplete: () => void) {
        this.objectToSpawn.getTransform().setWorldPosition(tr.position)
        this.objectToSpawn.getTransform().setWorldRotation(tr.rotation)
        onComplete()
    }

    afterSpawnObjectAction() {
        this.objectToSpawn.enabled = true
    }

    onSpawnComplete() {
        this.isSpawning = false
        this.hasSpawned = true
    }

    unspawnObject() {
        this.onUnspawnComplete()
    }

    onUnspawnComplete() {
        this.objectToSpawn.enabled = false
        this.hasSpawned = false
        this.isSpawning = false
    }

    debug(text: string) {
        if (this.debugText) this.debugText.text = text
        if (this.printDebug) console.log(text)
    }
}
export class SpawnTransform {
    position: vec3
    rotation: quat
    constructor(position: vec3, rotation: quat) {
        this.position = position
        this.rotation = rotation
    }

}
