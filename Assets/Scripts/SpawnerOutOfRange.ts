import { LSTween } from "LSTween.lspkg/LSTween"

@component
export class SpawnerOutOfRange extends BaseScriptComponent {
    @input
    target: SceneObject
    @input
    @hint("Specifies this distance (in cm) to trigger the respawn")
    distanceThreshold: number
    @input
    changeYaw: boolean = true
    @input
    @hint("Relative to target orientation")
    @showIf("changeYaw", true)
    yawRange: vec2
    @input
    changePitch: boolean = true
    @input
    @hint("Relative to horizon")
    @showIf("changePitch", true)
    pitchRange: vec2
    @input
    changeDistance: boolean = true
    @input
    @hint("Relative to target position")
    @showIf("changeDistance", true)
    distanceRange: vec2
    @input
    @allowUndefined
    debugText: Text
    @input
    printDebug: boolean = false
    @input
    transitionDuration: number = 2000

    private _inTransition = false

    onAwake() {
        this.createEvent("UpdateEvent").bind(() => {
            this.update();
        })
    }


    update() {
        if (this._inTransition) return
        var thisPosition = this.sceneObject.getTransform().getWorldPosition()
        var targetPosition = this.target.getTransform().getWorldPosition()
        var currentDistance = thisPosition.distance(targetPosition);

        if (currentDistance > this.distanceThreshold) {
            var targetRotation = this.target.getTransform().getWorldRotation().toEulerAngles()
            this.debug("rot:" + targetRotation.x * MathUtils.RadToDeg + ", " + targetRotation.y * MathUtils.RadToDeg + ", " + targetRotation.z * MathUtils.RadToDeg + ", ")

            var yaw = targetRotation.y;
            var pitch = 0 // horizon, if it was relative to pov, we would have used targetRotation.x;
            this.debug("yaw:" + yaw + " pitch:" + pitch)
            const finalYaw = (MathUtils.DegToRad * -90) - (
                !this.changeYaw
                    ? yaw
                    : yaw + (MathUtils.randomRange(this.yawRange.x, this.yawRange.y) * MathUtils.DegToRad)
            )
            const finalPitch =
                !this.changePitch
                    ? pitch
                    : (MathUtils.randomRange(this.pitchRange.x, this.pitchRange.y) * MathUtils.DegToRad)

            const distance =
                !this.changeDistance
                    ? currentDistance
                    : (MathUtils.randomRange(this.distanceRange.x, this.distanceRange.y))
            this.debug("y:" + yaw + " p" + pitch + " d" + distance)
            const dir = new vec3(
                Math.cos(finalPitch) * Math.cos(finalYaw),
                Math.sin(finalPitch),
                Math.cos(finalPitch) * Math.sin(finalYaw),
            ).normalize();

            var respawnPosition = targetPosition.add(dir.mult(new vec3(distance, distance, distance)));
            if (this.transitionDuration > 1) {
                this._inTransition = true
                LSTween.moveToWorld(this.sceneObject.getTransform(), respawnPosition, this.transitionDuration).start().onComplete(() => { this._inTransition = false })
                //LSTween.scaleFromToWorld(this.sceneObject.getTransform(), vec3.zero(), vec3.one(), 3000).start()
            }
            else {
                this.sceneObject.getTransform().setWorldPosition(respawnPosition)
            }
        }
    }

    debug(text: string) {
        if (this.debugText) this.debugText.text = text
        if (this.printDebug) console.log(text)
    }
}
