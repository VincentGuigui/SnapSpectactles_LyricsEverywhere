import { VectorUtils } from "./VectorUtils";
import { HandInputData } from "SpectaclesInteractionKit.lspkg/Providers/HandInputData/HandInputData";
import { HandType } from "SpectaclesInteractionKit.lspkg/Providers/HandInputData/HandType";
import TrackedHand from "SpectaclesInteractionKit.lspkg/Providers/HandInputData/TrackedHand"
import WorldCameraFinderProvider from "SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider"

@component
export class HandFollower extends BaseScriptComponent {
    @input private handFollowObject: SceneObject;
    @input private distanceToHand: number = 5

    private handProvider: HandInputData = HandInputData.getInstance()
    private leftHand = this.handProvider.getHand("left" as HandType);
    private rightHand = this.handProvider.getHand("right" as HandType);
    private camera = WorldCameraFinderProvider.getInstance();
    private noTrackCount = 0;

    onAwake() {
        this.createEvent("UpdateEvent").bind(() => {
            this.update();
        })
        this.handFollowObject.enabled = false;
    }

    update() {
        console.log(this.leftHand)
        if (this.tryShowHandMenu(this.leftHand) || this.tryShowHandMenu(this.rightHand)) 
        {
            this.handFollowObject.enabled = true;
            this.noTrackCount = 0;
        }
        else
        {
            this.noTrackCount++;
            if(this.noTrackCount > 10)
            {
                this.handFollowObject.enabled = false;
            }
        }
    }

    private tryShowHandMenu(hand: TrackedHand): boolean {
        if(!hand.isTracked() )
        {
            return false;
        }
        const currentPosition = hand.pinkyKnuckle.position;
        if(currentPosition != null) {
            console.log("currentHandPosition", currentPosition)
            const knuckleForward = hand.indexKnuckle.forward;
            const cameraForward = this.camera.getTransform().forward;
            const angle = Math.acos(knuckleForward.dot(cameraForward) / (knuckleForward.length * cameraForward.length)) *  180.0 / Math.PI;
            if(Math.abs(angle) > 20)
            {
                return false;
            }
            var directionNextToKnuckle  = hand.handType == "left" ? hand.indexKnuckle.right : 
                hand.indexKnuckle.right.mult(VectorUtils.scalar3(-1));
            
            this.handFollowObject.getTransform().setWorldRotation(hand.indexKnuckle.rotation);
            this.handFollowObject.getTransform().setWorldPosition(
                currentPosition.add(directionNextToKnuckle.mult(VectorUtils.scalar3(this.distanceToHand))));
            return true;
        }
        return false;
    }
}
