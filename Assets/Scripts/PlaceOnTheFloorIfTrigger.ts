import { HAND, HEAD, MyWorldQueryHitTest, MyWorldQueryHitResult, MyWorldQueryHitSubscriberRegistration, MyWorldQueryHitSurfaceTypes } from "./MyWorldQueryHitTest"
import { SpawnerBase, SpawnTransform } from "./SpawnerBase"
import WorldCameraFinderProvider from "SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider"

@component
export class PlaceOnTheFloorIfTrigger extends SpawnerBase {

    @input
    worldHitTest: MyWorldQueryHitTest
    registration: MyWorldQueryHitSubscriberRegistration
    camera = WorldCameraFinderProvider.getInstance();
    @input
    @allowUndefined
    placeholder: SceneObject

    onAwake() {
        this.createEvent("OnStartEvent").bind(this.onStart.bind(this))
        this.createEvent("OnEnableEvent").bind(this.onEnable.bind(this))
        this.createEvent("OnDisableEvent").bind(this.onDisable.bind(this))
        this.registration = new MyWorldQueryHitSubscriberRegistration()
        this.registration.receivePlaceholder = true
        this.registration.placeholderByHandOrHead = false
        this.registration.receiveTrigger = true
        this.registration.triggerByHandOrHead = true
        this.registration.subscriber = this.sceneObject
        this.registration.hitCallback = this.onHit.bind(this)
        this.registration.surfaceType = MyWorldQueryHitSurfaceTypes.Floor
    }

    onStart() {
    }

    onEnable() {
        if (this.worldHitTest != null) {
            this.worldHitTest.register(this.registration)
        }
    }

    onDisable() {
        if (this.worldHitTest != null) {
            this.worldHitTest.unregister(this.registration)
        }
    }

    onHit(results: MyWorldQueryHitResult) {
        if (results == null) {
            if (this.placeholder) {
                this.placeholder.enabled = false
            }
        } else {
            // this.printDebugInEditor("Receive", results.handOrHead ? "HAND" : "HEAD", results.currentHitPosition)
            if (results.triggered) {
                this.placeholder.enabled = false
                if (this.objectToSpawn.enabled == false) {
                    // Called when a trigger ends
                    this.spawnObject(results)
                    this.afterPlacement()
                }
            }
            if (this.placeholder && results.handOrHead == this.registration.placeholderByHandOrHead) {
                // this.printDebugInEditor("placeholder", results.handOrHead, results.currentHitPosition)
                this.placeholder.enabled = this.objectToSpawn.enabled == false
                if (this.placeholder.enabled) {
                    this.spawnObject(results)
                }
            }
        }
    }

    getObjectToSpawn(): SceneObject {
        return this.placeholder.enabled ? this.placeholder : this.objectToSpawn
    }

    spawnTrigger(): boolean {
        var cameraLookAt = this.camera.forward()
        //spawn when looking at the floor
        return (cameraLookAt.angleTo(vec3.down()) > 145 * MathUtils.DegToRad)
    }

    computeSpawnTransformation(context): SpawnTransform {
        var results = context as MyWorldQueryHitResult
        console.log("results", results.handOrHead, results.currentHitPosition)
        return new SpawnTransform(results.currentHitPosition, results.currentHitRotationParrallelToGround)
    }

    spawnObjectActionImmediate(tr: SpawnTransform, onComplete: () => void) {
        var objectToSpawn = this.getObjectToSpawn()
        var objTr = objectToSpawn.getTransform()
        objTr.setWorldPosition(tr.position)
        objTr.setWorldRotation(tr.rotation)
        onComplete()
    }

    afterPlacement() {
    }
}
