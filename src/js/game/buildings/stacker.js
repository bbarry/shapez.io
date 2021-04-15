import { formatItemsPerSecond } from "../../core/utils";
import { enumDirection, Vector } from "../../core/vector";
import { T } from "../../translations";
import { ItemAcceptorComponent } from "../components/item_acceptor";
import { ItemEjectorComponent } from "../components/item_ejector";
import {
    enumItemProcessorTypes,
    enumItemProcessorRequirements,
    ItemProcessorComponent,
} from "../components/item_processor";
import { Entity } from "../entity";
import { defaultBuildingVariant, MetaBuilding } from "../meta_building";
import { GameRoot } from "../root";
import { enumHubGoalRewards } from "../tutorial_goals";

/** @enum {string} */
export const enumStackerVariants = {
    smart: "smart",
};
export class MetaStackerBuilding extends MetaBuilding {
    constructor() {
        super("stacker");
    }

    getSilhouetteColor() {
        return "#9fcd7d";
    }

    getDimensions(variant) {
        if (variant === enumStackerVariants.smart) {
            return new Vector(3, 1);
        }
        return new Vector(2, 1);
    }

    /**
     * @param {GameRoot} root
     * @returns {Array<[string, string]>}
     */
    getAdditionalStatistics(root) {
        const speed = root.hubGoals.getProcessorBaseSpeed(enumItemProcessorTypes.stacker);
        return [[T.ingame.buildingPlacement.infoTexts.speed, formatItemsPerSecond(speed)]];
    }

    /**
     * @param {GameRoot} root
     */
    getIsUnlocked(root) {
        return root.hubGoals.isRewardUnlocked(enumHubGoalRewards.reward_stacker);
    }

    /**
     * @param {GameRoot} root
     */
    getAvailableVariants(root) {
        let available = [defaultBuildingVariant];
        if (root.hubGoals.isRewardUnlocked(enumHubGoalRewards.reward_smart_stacker)) {
            available.push(enumStackerVariants.smart);
        }
        return available;
    }
    /**
     * Creates the entity at the given location
     * @param {Entity} entity
     */
    setupEntityComponents(entity) {
        entity.addComponent(
            new ItemProcessorComponent({
                inputsToProcess: 2,
            })
        );

        entity.addComponent(
            new ItemEjectorComponent({
                slots: [],
            })
        );
        entity.addComponent(
            new ItemAcceptorComponent({
                slots: [],
            })
        );
    }

    /**
     *
     * @param {Entity} entity
     * @param {number} rotationVariant
     * @param {string} variant
     */
    updateVariants(entity, rotationVariant, variant) {
        const isSmart = variant == enumStackerVariants.smart;
        entity.components.ItemProcessor.type = isSmart
            ? enumItemProcessorTypes.smartStacker
            : enumItemProcessorTypes.stacker;
        entity.components.ItemProcessor.processingRequirement = isSmart
            ? enumItemProcessorRequirements.smartStacker
            : null;

        entity.components.ItemEjector.setSlots([{ pos: new Vector(0, 0), direction: enumDirection.top }]);
        if (isSmart) {
            entity.components.ItemAcceptor.setSlots([
                {
                    pos: new Vector(0, 0),
                    directions: [enumDirection.left],
                    filter: "shape",
                },
                {
                    pos: new Vector(0, 0),
                    directions: [enumDirection.bottom],
                    filter: "shape",
                },
                {
                    pos: new Vector(1, 0),
                    directions: [enumDirection.bottom],
                    filter: "shape",
                },
                {
                    pos: new Vector(2, 0),
                    directions: [enumDirection.bottom],
                    filter: "shape",
                },
            ]);
        } else {
            entity.components.ItemAcceptor.setSlots([
                {
                    pos: new Vector(0, 0),
                    directions: [enumDirection.bottom],
                    filter: "shape",
                },
                {
                    pos: new Vector(1, 0),
                    directions: [enumDirection.bottom],
                    filter: "shape",
                },
            ]);
        }
    }
}
