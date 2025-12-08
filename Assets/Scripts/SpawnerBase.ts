import { LSTween } from "LSTween.lspkg/LSTween"

@component
export class SpawnerBase extends BaseScriptComponent {
    @input
    objectToSpawn: SceneObject
    @input
    transitionDuration: number = 2000
    @input
    @hint("Call to Spawn method will be done by code")
    customSpawn: boolean = false
    @input
    spawnOnLateUpdate: boolean = false
    isSpawning = false
    hasSpawned = false
    mustCallSpawnOnLateUpdate = false
    nextTransformation: SpawnTransform

    @input
    printDebug: boolean = false
        printDebugInEditor(...data: any[]) {
        if (this.printDebug && global.deviceInfoSystem.isEditor)
            console.log(data)
    }

    onAwake() {
        this.createEvent("UpdateEvent").bind(this.onUpdate.bind(this));
        this.createEvent("OnStartEvent").bind(this.onStart.bind(this));
        this.createEvent("LateUpdateEvent").bind(this.onLateUpdate.bind(this));
    }

    onStart() {
    }

    onUpdate() {
        if (this.isSpawning) return
        if (!this.customSpawn && this.spawnTrigger()) {
            this.printDebugInEditor("Must spawnObject")
            this.spawnObject()
        }
    }

    onLateUpdate() {
        if (this.mustCallSpawnOnLateUpdate)
            this.callSpawnObjectAction()
    }

    spawnTrigger(): boolean {
        this.printDebugInEditor("spawntrigger", this.sceneObject.name)
        return true
    }

    callSpawnObjectAction() {
        this.mustCallSpawnOnLateUpdate = false
        if (this.transitionDuration > 1)
            this.spawnObjectActionWithTransition(this.nextTransformation, this.onSpawnComplete.bind(this))
        else
            this.spawnObjectActionImmediate(this.nextTransformation, this.onSpawnComplete.bind(this))
    }

    spawnObject(context = null) {
        this.printDebugInEditor("spawnObject", this.sceneObject.name)
        this.isSpawning = true
        this.nextTransformation = this.computeSpawnTransformation(context)
        if (this.spawnOnLateUpdate) {
            this.mustCallSpawnOnLateUpdate = true
        }
        else {
            this.callSpawnObjectAction()
        }

        this.afterSpawnObjectAction()
    }

    computeSpawnTransformation(context = null): SpawnTransform {
        var thisPosition = this.getObjectToSpawn().getTransform().getWorldPosition()
        var thisRotation = this.getObjectToSpawn().getTransform().getWorldRotation()
        this.nextTransformation = new SpawnTransform(thisPosition, thisRotation)
        return this.nextTransformation
    }

    spawnObjectActionWithTransition(tr: SpawnTransform, onComplete: () => void) {
        this.printDebugInEditor("spawnObjectActionWithTransition")
        if (tr.position != null)
            LSTween.moveToWorld(this.getObjectToSpawn().getTransform(), tr.position, this.transitionDuration).start()
        if (tr.rotation != null)
            LSTween.rotateToWorld(this.getObjectToSpawn().getTransform(), tr.rotation, this.transitionDuration)
                .onComplete(onComplete)
                .start()
        if (tr.position != null && tr.rotation != null)
            LSTween.rawTween(this.transitionDuration)
                .onComplete(onComplete)
                .start()
        else
            onComplete()
    }

    spawnObjectActionImmediate(tr: SpawnTransform, onComplete: () => void) {
        this.printDebugInEditor("spawnObjectActionImmediate")
        this.getObjectToSpawn().getTransform().setWorldPosition(tr.position)
        this.getObjectToSpawn().getTransform().setWorldRotation(tr.rotation)
        onComplete()
    }

    getObjectToSpawn(): SceneObject {
        return this.objectToSpawn
    }

    afterSpawnObjectAction() {
        this.getObjectToSpawn().enabled = true
    }

    onSpawnComplete() {
        this.printDebugInEditor("onSpawnComplete")

        this.isSpawning = false
        this.hasSpawned = true
    }

    unspawnObject() {
        this.onUnspawnComplete()
    }

    onUnspawnComplete() {
        this.getObjectToSpawn().enabled = false
        this.hasSpawned = false
        this.isSpawning = false
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
