import { MyWorldQueryHitTest, MyWorldQueryHitResult, MyWorldQueryHitSubscriberRegistration, MyWorldQueryHitSurfaceTypes } from "./MyWorldQueryHitTest"
import WorldCameraFinderProvider from "SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider"

@component
export class PlaceOnTheFloorOnce extends BaseScriptComponent {

    @input
    objectToPlace: SceneObject
    @input
    hideWhenNotPlaced = true
    @input
    worldHitTest: MyWorldQueryHitTest
    registration: MyWorldQueryHitSubscriberRegistration
    latestQueryResult: MyWorldQueryHitResult
    camera = WorldCameraFinderProvider.getInstance();

    onAwake() {
        this.objectToPlace.enabled = !this.hideWhenNotPlaced
        this.createEvent("OnStartEvent").bind(this.onStart.bind(this))
        this.createEvent("OnEnableEvent").bind(this.onEnable.bind(this))
        this.createEvent("OnDisableEvent").bind(this.onDisable.bind(this))
        this.registration = new MyWorldQueryHitSubscriberRegistration()
        this.registration.receivePlaceholder = true
        this.registration.placeholderByHandOrHead = false
        this.registration.receiveTrigger = false
        this.registration.triggerByHandOrHead = false
        this.registration.subscriber = this.sceneObject
        this.registration.hitCallback = this.onHit.bind(this)
        this.registration.surfaceType = MyWorldQueryHitSurfaceTypes.Floor
    }

    onStart() {
        this.onEnable()
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
            this.objectToPlace.enabled = !this.hideWhenNotPlaced
        } else {
            var tr = this.objectToPlace.getTransform()
            var pos = tr.getWorldPosition()
            pos.y = this.latestQueryResult.currentHitPosition.y
            tr.setWorldPosition(pos)
            this.objectToPlace.enabled = true
            this.enabled = false
        }
    }
}
