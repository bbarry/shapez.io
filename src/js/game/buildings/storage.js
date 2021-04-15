import { formatBigNumber } from "../../core/utils";
import { enumDirection, Vector } from "../../core/vector";
import { T } from "../../translations";
import { ItemAcceptorComponent } from "../components/item_acceptor";
import { ItemEjectorComponent } from "../components/item_ejector";
import { StorageComponent } from "../components/storage";
import { enumPinSlotType, WiredPinsComponent } from "../components/wired_pins";
import { Entity } from "../entity";
import { defaultBuildingVariant, MetaBuilding } from "../meta_building";
import { GameRoot } from "../root";
import { enumHubGoalRewards } from "../tutorial_goals";

/** @enum {string} */
export const enumStorageVariants = {
    mini: "mini",
};

const storageSize = 5000;
const miniStorageSize = 500;

export class MetaStorageBuilding extends MetaBuilding {
    constructor() {
        super("storage");
    }

    getSilhouetteColor() {
        return "#bbdf6d";
    }

    /**
     * @returns {Array<[string, string]>}
     */
    getAdditionalStatistics(root, variant) {
        let number = storageSize;
        if (variant == enumStorageVariants.mini) {
            number = miniStorageSize;
        }
        return [[T.ingame.buildingPlacement.infoTexts.storage, formatBigNumber(number)]];
    }

    getDimensions(variant) {
        if (variant == enumStorageVariants.mini) {
            return new Vector(1, 1);
        }
        return new Vector(2, 2);
    }

    /**
     * @param {GameRoot} root
     */
    getIsUnlocked(root) {
        return root.hubGoals.isRewardUnlocked(enumHubGoalRewards.reward_storage);
    }

    getAvailableVariants() {
        return [defaultBuildingVariant, enumStorageVariants.mini];
    }

    /**
     * Creates the entity at the given location
     * @param {Entity} entity
     */
    setupEntityComponents(entity) {
        // Required, since the item processor needs this.
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

        entity.addComponent(new StorageComponent({}));

        entity.addComponent(
            new WiredPinsComponent({
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
        const isMini = variant == enumStorageVariants.mini;
        entity.components.Storage.maximumStorage = isMini ? miniStorageSize : storageSize;
        entity.components.ItemEjector.setSlots([
            {
                pos: new Vector(0, 0),
                direction: enumDirection.top,
            },
            {
                pos: isMini ? new Vector(0, 0) : new Vector(1, 0),
                direction: isMini ? enumDirection.right : enumDirection.top,
            },
        ]);
        if (isMini) {
            entity.components.ItemAcceptor.setSlots([
                {
                    pos: new Vector(0, 0),
                    directions: [enumDirection.bottom],
                },
            ]);
        } else {
            entity.components.ItemAcceptor.setSlots([
                {
                    pos: new Vector(0, 1),
                    directions: [enumDirection.bottom],
                },
                {
                    pos: new Vector(1, 1),
                    directions: [enumDirection.bottom],
                },
            ]);
        }

        entity.components.WiredPins.setSlots([
            {
                pos: isMini ? new Vector(0, 0) : new Vector(1, 1),
                direction: enumDirection.right,
                type: enumPinSlotType.logicalEjector,
            },
            {
                pos: isMini ? new Vector(0, 0) : new Vector(0, 1),
                direction: enumDirection.left,
                type: enumPinSlotType.logicalEjector,
            },
        ]);
    }
}
