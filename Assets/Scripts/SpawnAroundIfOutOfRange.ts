import { Headlock } from "SpectaclesInteractionKit.lspkg/Components/Interaction/Headlock/Headlock"
import { SpawnTransform } from "./SpawnerBase";
import { SpawnerOutOfRange } from "./SpawnerOutOfRange";
import WorldCameraFinderProvider from "SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider";

@component
export default class SpawnAroundIfOutOfRange extends SpawnerOutOfRange {
  @input
  @hint("Relative to referenceObject orientation (horizontal)")
  changeYaw: boolean = true
  @input
  @showIf("changeYaw", true)
  yawRange: vec2 = new vec2(-10, 10)
  @input
  fixedY: boolean = false
  @input
  @hint("Relative to headlock or horizon (vertical)")
  changePitch: boolean = true
  @input
  @showIf("changePitch", true)
  @hint("Relative to horizon (vertical)")
  pitchRelativeToInitial: boolean = false
  @input
  @showIf("changePitch", true)
  pitchRange: vec2 = new vec2(-10, 10)
  @input
  @allowUndefined
  headlock: Headlock
  @input
  billboard: boolean = false
  @input
  spawnOnLateUpdate: boolean = true
  @input
  respawnOnlyIfNotInFov: boolean = false

  initialPosition: vec3
  camera = WorldCameraFinderProvider.getInstance();

  onAwake() {
    super.onAwake()
  }

  onStart(): void {
    if (this.headlock) {
      this.headlock.lockedYaw = this.changeYaw
      this.headlock.lockedPitch = this.changePitch
      this.spawnOnLateUpdate = true
      this.computeSpawnTransformation()
      this.headlock.snapToOffsetPosition()
      this.spawnObject()
    }
    if (this.pitchRelativeToInitial || this.fixedY)
      this.initialPosition = this.getObjectToSpawn().getTransform().getWorldPosition()
  }

  spawnTrigger(): boolean {
    if (this.respawnOnlyIfNotInFov) {
      if (!this.camera.inFoV(this.getObjectToSpawn().getTransform().getWorldPosition())) {
        return super.spawnTrigger()
      }
      return false
    }
    return super.spawnTrigger()
  }

  computeSpawnTransformation(): SpawnTransform {
    this.printDebugInEditor("computeSpawnTransformation")
    if (this.headlock) {
      this.headlock.lockedYaw = this.changeYaw
      this.headlock.lockedPitch = this.changePitch
      if (this.changeDistance) {
        this.headlock.distance = MathUtils.randomRange(this.distanceRange.x, this.distanceRange.y)
      }
      else {
        this.headlock.distance = this.objectToSpawn.getTransform().getWorldPosition().distance(this.referenceObject.getTransform().getWorldPosition())
      }
      if (this.changeYaw)
        this.headlock.yawOffsetDegrees = MathUtils.randomRange(this.yawRange.x, this.yawRange.y)
      if (this.changePitch)
        this.headlock.pitchOffsetDegrees = MathUtils.randomRange(this.pitchRange.x, this.pitchRange.y)
      // null as handled by headlock
      return new SpawnTransform(null, null)
    }
    return super.computeSpawnTransformation()
  }

  computeSpawnTransformationJIT(tr: SpawnTransform) {


    var trHeadlock = this.headlock.sceneObject.getTransform()
    tr.position = trHeadlock.getWorldPosition()
    if (this.fixedY)
      tr.position.y = this.initialPosition.y
    if (this.pitchRelativeToInitial) {
      var pitchOffset = MathUtils.randomRange(this.pitchRange.x, this.pitchRange.y)
      // use pitchOffset (degrees) to move tr.position compared to this.referenceObject position
      var refPos = vec3.zero()
      var direction = this.initialPosition.sub(refPos).normalize()
      var distance = this.initialPosition.distance(refPos)
      // apply pitch offset
      var pitchOffsetRad = pitchOffset * MathUtils.DegToRad
      direction.y = direction.y + Math.sin(pitchOffsetRad)
      direction = direction.normalize()
      tr.position.y = refPos.add(direction.uniformScale(distance)).y
    }
    if (this.billboard) {
      var flatRefPos = this.referenceObject.getTransform().getWorldPosition()
      flatRefPos.y = 0
      var flatPos = new vec3(tr.position.x, 0, tr.position.z)
      var rot = quat.rotationFromTo(vec3.forward(), flatRefPos.sub(flatPos))
      tr.rotation = rot
    }
    else {
      tr.rotation = trHeadlock.getWorldRotation()
    }
    return tr
  }

  spawnObjectActionWithTransition(tr: SpawnTransform, onComplete: () => void) {
    this.printDebugInEditor("spawnObjectActionWithTransition")
    tr = this.computeSpawnTransformationJIT(tr)
    super.spawnObjectActionWithTransition(tr, onComplete)
  }

  spawnObjectActionImmediate(tr: SpawnTransform, onComplete: () => void) {
    this.printDebugInEditor("spawnObjectActionImmediate")
    tr = this.computeSpawnTransformationJIT(tr)
    super.spawnObjectActionImmediate(tr, onComplete)
  }
}
