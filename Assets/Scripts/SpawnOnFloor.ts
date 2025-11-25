import { LSTween } from "LSTween.lspkg/LSTween";
import Easing from "LSTween.lspkg/TweenJS/Easing";
import { MyWorldQueryHitResult, MyWorldQueryHitSubscriberRegistration, MyWorldQueryHitTest } from "./MyWorldQueryHitTest";
import WorldCameraFinderProvider from "SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider";
import { SpawnerOutOfRange } from "./SpawnerOutOfRange";
import { SpawnTransform } from "./SpawnerBase";

@component
export class SpawnOnFloor extends SpawnerOutOfRange {
    @input
    worldHitTest: MyWorldQueryHitTest
    registration: MyWorldQueryHitSubscriberRegistration
    camera = WorldCameraFinderProvider.getInstance();
    latestQueryResult : MyWorldQueryHitResult

    onAwake() {
        // this.createEvent("OnEnableEvent").bind(this.onEnable.bind(this))
        // this.createEvent("OnDisableEvent").bind(this.onDisable.bind(this))
        this.registration = new MyWorldQueryHitSubscriberRegistration(true, false, false, this.onHit.bind(this))
    }

    // onEnable() {
    //     if (this.worldHitTest != null) {
    //         console.log("Register SpawnOnFloor")
    //         this.worldHitTest.register(this.registration)
    //     }
    // }

    // onDisable() {
    //     if (this.worldHitTest != null) {
    //         console.log("Unregister SpawnOnFloor and scale to 0")
    //         this.worldHitTest.unregister(this.registration)
    //         this.targetObject.getTransform().setWorldScale(vec3.zero())
    //     }
    // }

    onUpdate() {
        if (this.isSpawning || this.hasSpawned) {
            console.log("Unregister SpawnOnFloor because already spawned")
            this.worldHitTest.unregister(this.registration)
        }
        if (this.isSpawning) return
        if (this.hasSpawned) {
            //detect lookaway
            if (!this.camera.inFoV(this.objectToSpawn.getTransform().getWorldPosition()))
                this.unspawnObject()
        }
        else {
            if (this.spawnTrigger()){
                console.log("May spawn after hit test", this.objectToSpawn.name)
                this.worldHitTest.register(this.registration)
                // children will spawn using WorldQueryHitTest
            }
            else 
                this.worldHitTest.unregister(this.registration)
        }

        /*
    if (cameraLookAt.angleTo(vec3.down()) > 40 * MathUtils.DegToRad
        && cameraLookAt.angleTo(vec3.down()) < 50 * MathUtils.DegToRad
        && cameraLookAt.angleTo(vec3.right()) > 30 * MathUtils.DegToRad
        && cameraLookAt.angleTo(vec3.right()) < 40 * MathUtils.DegToRad) {
        console.log("Spawn Rabbit")
        this.Sidewalk.enabled = true
        // children will spawn using WorldQueryHitTest
    }
    if (this.Sidewalk.enabled) {
        if (!this.camera.getComponent().isSphereVisible(this.Sidewalk.children[0].getTransform().getWorldPosition().add(vec3.up().uniformScale(50)), 150)) {
            console.log("Unspawn Rabbit")
            this.Sidewalk.children[0].enabled = false
            this.Sidewalk.enabled = false
        }
    }*/
    }

    spawnTrigger(): boolean {
        var cameraLookAt = this.camera.forward()
        //spawn when looking at the floor
        return (cameraLookAt.angleTo(vec3.down()) > 145 * MathUtils.DegToRad)
    }

    onHit(results: MyWorldQueryHitResult) {
        this.latestQueryResult = results
        if (results == null) {
        } else {
            this.spawnObject()
        }
    }

    computeSpawnTransformation(): SpawnTransform {
        return new SpawnTransform(this.latestQueryResult.currentHitPosition, this.latestQueryResult.currentHitRotationParrallelToGround)
    }

    spawnObjectActionWithTransition(tr: SpawnTransform, onComplete: () => void) {
        var objTr = this.objectToSpawn.getTransform()
        objTr.setWorldPosition(tr.position)
        objTr.setWorldRotation(tr.rotation)
        LSTween.scaleFromToLocal(objTr, vec3.zero(), vec3.one(), this.transitionDuration).easing(Easing.Elastic.InOut)
            .start()
            .onComplete(this.onSpawnComplete.bind(this))
    }

    unspawnObject() {
        LSTween.scaleFromToLocal(this.objectToSpawn.getTransform(), vec3.one(), vec3.zero(), this.transitionDuration).easing(Easing.Elastic.InOut)
            .start()
            .onComplete(this.onUnspawnComplete.bind(this))

    }
}
