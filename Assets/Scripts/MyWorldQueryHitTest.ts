import { InteractorTriggerType } from "SpectaclesInteractionKit.lspkg/Core/Interactor/Interactor"
import WorldCameraFinderProvider from "SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider"

// import required modules
const WorldQueryModule = require("LensStudio:WorldQueryModule")
const SIK = require("SpectaclesInteractionKit.lspkg/SIK").SIK
const EPSILON = 0.01
const MIN_DISTANCE_TO_FLOOR = 100;
const HAND = true
const HEAD = false

@component
export class MyWorldQueryHitTest extends BaseScriptComponent {

    @input
    surfaceClassification = false
    @input
    filter = false
    @input
    printDebug = false


    private primaryInteractor
    private hitTestSession: HitTestSession
    private camera = WorldCameraFinderProvider.getInstance()
    private rayStart: vec3
    private subs: Map<boolean, MyWorldQueryHitSubscriberRegistration[]> = new Map()
    private placeholderSubs: Map<boolean, MyWorldQueryHitSubscriberRegistration[]> = new Map()
    private placeholderFloorSubs: Map<boolean, MyWorldQueryHitSubscriberRegistration[]> = new Map()
    private triggeredSubs: Map<boolean, MyWorldQueryHitSubscriberRegistration[]> = new Map()
    private triggeredFloorSubs: Map<boolean, MyWorldQueryHitSubscriberRegistration[]> = new Map()
    private headPlaceholderFloorSubs: Map<boolean, MyWorldQueryHitSubscriberRegistration[]> = new Map()
    public currentHitPosition: vec3
    public currentHitRotation: quat
    public currentHitRotationParrallelToGround: quat
    subscribers: MyWorldQueryHitSubscriberRegistration[] = []


    printDebugInEditor(...data: any[]) {
        if (this.printDebug && global.deviceInfoSystem.isEditor)
            console.log(data)
    }

    onAwake() {
        // create update event
        this.createEvent("UpdateEvent").bind(this.onUpdate.bind(this))
    }

    isRegistered(registration: MyWorldQueryHitSubscriberRegistration): boolean {
        return this.subscribers.indexOf(registration) > -1

    }

    register(registration: MyWorldQueryHitSubscriberRegistration) {
        this.printDebugInEditor("WorldQuery Register", registration.subscriber.name)
        if (!this.isRegistered(registration)) {
            this.subscribers.push(registration)
            this.buildSubsCache()
        }
    }

    unregister(registration: MyWorldQueryHitSubscriberRegistration) {
        if (this.removeFromArray(this.subscribers, registration)) {
            this.printDebugInEditor("WorldQuery Unregister", registration.subscriber.name)
            this.buildSubsCache()
        }
    }

    private buildSubsCache() {
        [HAND, HEAD].forEach(handOrHead => {
            this.subs.set(handOrHead, this.subscribers.filter((sub) => { return (sub.receiveTrigger && sub.triggerByHand == handOrHead) || (sub.receivePlaceholder && sub.placeholderByHand == handOrHead) }))
            this.placeholderSubs.set(handOrHead, this.subs.get(handOrHead).filter((sub, index, arr) => { return sub.receivePlaceholder }))
            this.placeholderFloorSubs.set(handOrHead, this.placeholderSubs.get(handOrHead).filter((sub, index, arr) => { return sub.surfaceType == MyWorldQueryHitSurfaceTypes.Floor }))
            this.triggeredSubs.set(handOrHead, this.subs.get(handOrHead).filter((sub, index, arr) => { return sub.receiveTrigger }))
            this.triggeredFloorSubs.set(handOrHead, this.triggeredSubs.get(handOrHead).filter((sub, index, arr) => { return sub.surfaceType == MyWorldQueryHitSurfaceTypes.Floor }))
        });
    }

    private removeFromArray(arr: MyWorldQueryHitSubscriberRegistration[], element: MyWorldQueryHitSubscriberRegistration) {
        var index = arr.indexOf(element)
        if (index > -1) {
            arr.splice(index, 1)
            return true
        }
        return false
    }

    private createHitTestSession() {
        // create hit test session with options
        this.printDebugInEditor("WorldQuery start")
        var options = HitTestSessionOptions.create()
        options.filter = this.filter
        this.hitTestSession = WorldQueryModule.createHitTestSessionWithOptions(options)
    }

    private stopHitTestSession() {
        this.printDebugInEditor("WorldQuery Stop")
        this.hitTestSession.stop()
        this.hitTestSession = null
    }

    onUpdate() {
        if (this.subscribers.length > 0 && this.hitTestSession == null) {
            this.createHitTestSession()
        }
        if (this.subscribers.length == 0 && this.hitTestSession != null) {
            this.stopHitTestSession()
            return
        }
        if (this.hitTestSession == null) {
            return
        }
        if (this.subs.get(HAND).length > 0) {
            this.primaryInteractor = SIK.InteractionManager.getTargetingInteractors().shift()
            if (this.primaryInteractor &&
                this.primaryInteractor.isActive() &&
                this.primaryInteractor.isTargeting()
            ) {
                this.rayStart = new vec3(this.primaryInteractor.startPoint.x, this.primaryInteractor.startPoint.y, this.primaryInteractor.startPoint.z + 30)
                const rayEnd = this.primaryInteractor.endPoint
                this.hitTestSession.hitTest(this.rayStart, rayEnd, this.onHandHitTestResult.bind(this))
            }
            else {
                this.onHandHitTestResult(null)
            }
        }
        else {
            if (this.subs.get(HEAD).length > 0) {
                this.rayStart = this.camera.getWorldPosition()
                const rayEnd = this.camera.getForwardPosition(300, false)
                this.hitTestSession.hitTest(this.rayStart, rayEnd, this.onGazeHitTestResult.bind(this))
            }
        }
    }

    onHitTestResultCore(results: WorldQueryHitTestResult, triggerByHand: boolean) {
        if (results == null) {
            this.subs.get(triggerByHand).forEach(sub => { sub.hitCallback(null) })
            return
        }

        // get hit information
        const hitPosition: vec3 = results.position
        const hitNormal: vec3 = results.normal
        // identifying the direction the object should look at based on the normal of the hit location.

        // hit horizontal plane
        if (1 - Math.abs(hitNormal.normalize().dot(vec3.up())) < EPSILON &&
            this.rayStart.y - hitPosition.y > MIN_DISTANCE_TO_FLOOR
        ) {
            var lookDirection = this.camera.forward()
            var worldHitResult = new MyWorldQueryHitResult()
            worldHitResult.handHit = triggerByHand
            worldHitResult.triggered = false
            worldHitResult.currentHitPosition = hitPosition
            worldHitResult.currentHitRotation = quat.lookAt(lookDirection, hitNormal)
            lookDirection.y = 0
            worldHitResult.currentHitRotationParrallelToGround = quat.lookAt(lookDirection, hitNormal)
            this.placeholderFloorSubs.get(triggerByHand).forEach(sub => { sub.hitCallback(worldHitResult) })
            if (this.triggeredFloorSubs.get(triggerByHand).length > 0)
                if (
                    this.primaryInteractor.previousTrigger !== InteractorTriggerType.None &&
                    this.primaryInteractor.currentTrigger === InteractorTriggerType.None
                ) {
                    this.printDebugInEditor("WorldQuery Triggered")
                    worldHitResult.triggered = true
                    this.triggeredFloorSubs.get(triggerByHand).forEach(sub => { sub.hitCallback(worldHitResult) })
                }
        }
    }

    onGazeHitTestResult(results: WorldQueryHitTestResult) {
        this.onHitTestResultCore(results, false);
    }

    onHandHitTestResult(results: WorldQueryHitTestResult) {
        this.onHitTestResultCore(results, true);
    }
}


export enum MyWorldQueryHitSurfaceTypes {
    Floor,
    Ceiling,
    Wall
}

export class MyWorldQueryHitSubscriberRegistration {
    receivePlaceholder: boolean
    placeholderByHand: boolean
    receiveTrigger: boolean
    triggerByHand: boolean
    surfaceType: MyWorldQueryHitSurfaceTypes
    subscriber: SceneObject
    hitCallback: (results: MyWorldQueryHitResult) => void
    constructor() {
    }
}


export class MyWorldQueryHitResult {
    rawResults: MyWorldQueryHitResult
    handHit: boolean
    triggered: boolean
    currentHitPosition: vec3
    currentHitRotation: quat
    currentHitRotationParrallelToGround: quat
}

