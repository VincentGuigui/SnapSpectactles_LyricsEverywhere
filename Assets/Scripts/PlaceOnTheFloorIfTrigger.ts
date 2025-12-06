import { MyWorldQueryHitTest, MyWorldQueryHitResult, MyWorldQueryHitSubscriberRegistration, MyWorldQueryHitSurfaceTypes } from "./MyWorldQueryHitTest"
import { SpawnerBase, SpawnTransform } from "./SpawnerBase"
import WorldCameraFinderProvider from "SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider"

@component
export class PlaceOnTheFloorIfTrigger extends SpawnerBase {

    @input
    worldHitTest: MyWorldQueryHitTest
    registration: MyWorldQueryHitSubscriberRegistration
    latestQueryResult: MyWorldQueryHitResult
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
        this.registration.placeholderByHand = false
        this.registration.receiveTrigger = true
        this.registration.triggerByHand = true
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
        this.latestQueryResult = results
        if (results == null) {
            if (this.placeholder) {
                this.placeholder.enabled = false
            }
        } else {
            if (results.triggered) {
                this.placeholder.enabled = false
                if (this.objectToSpawn.enabled == false) {
                    // Called when a trigger ends
                    this.spawnObject()
                    this.afterPlacement()
                }
            }
            if (this.placeholder) {
                this.placeholder.enabled = this.objectToSpawn.enabled == false
                if (this.placeholder.enabled) {
                    this.spawnObject()
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

    computeSpawnTransformation(): SpawnTransform {
        return new SpawnTransform(this.latestQueryResult.currentHitPosition, this.latestQueryResult.currentHitRotationParrallelToGround)
    }

    spawnObjectActionImmediate(tr: SpawnTransform, onComplete: () => void) {
        var objectToSpawn = this.getObjectToSpawn()
        this.printDebugInEditor("spawnObjectActionImmediate", objectToSpawn.name)
        var objTr = objectToSpawn.getTransform()
        objTr.setWorldPosition(tr.position)
        objTr.setWorldRotation(tr.rotation)
    }

    afterPlacement() {
    }
}
