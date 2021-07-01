import { generateMatrixRotations } from "../../core/utils";
import { enumDirection, Vector } from "../../core/vector";
import { BuilderComponent } from "../components/builder";
import { enumLogicGateType, LogicGateComponent } from "../components/logic_gate";
import { enumPinSlotType, WiredPinsComponent } from "../components/wired_pins";
import { Entity } from "../entity";
import { MetaBuilding } from "../meta_building";
import { GameRoot } from "../root";
import { enumHubGoalRewards } from "../tutorial_goals";

const overlayMatrix = generateMatrixRotations([1, 1, 0, 1, 1, 1, 0, 1, 0]);

export class MetaBuilderBuilding extends MetaBuilding {
    constructor() {
        super("builder");
    }

    getSilhouetteColor() {
        return "#ff0000";
    }

    getIsUnlocked() {
        return true;
    }

    getDimensions() {
        return new Vector(2, 2);
    }

    /**
     * Creates the entity at the given location
     * @param {Entity} entity
     */
    setupEntityComponents(entity) {
        entity.addComponent(new BuilderComponent());
    }
}
