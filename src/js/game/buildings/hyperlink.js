import { enumDirection, Vector } from "../../core/vector";
import { ItemAcceptorComponent } from "../components/item_acceptor";
import { ItemEjectorComponent } from "../components/item_ejector";
import { HyperlinkAcceptorComponent } from "../components/hyperlink_acceptor";
import { HyperlinkEjectorComponent } from "../components/hyperlink_ejector";
import { enumItemProcessorTypes, ItemProcessorComponent } from "../components/item_processor";
import { Entity } from "../entity";
import { MetaBuilding, defaultBuildingVariant } from "../meta_building";
import { GameRoot } from "../root";
import { enumHubGoalRewards } from "../tutorial_goals";
import { T } from "../../translations";
import { formatItemsPerSecond, generateMatrixRotations } from "../../core/utils";
import { BeltUnderlaysComponent } from "../components/belt_underlays";

/** @enum {string} */
export const enumHyperlinkVariants = {
    hyperlinkEntrance: "hyperlink-entrance",
    hyperlinkExit: "hyperlink-exit",
    //do stuff in all this code with this
};

const overlayMatrices = {
    [defaultBuildingVariant]: generateMatrixRotations([1, 0, 1, 1, 0, 1, 1, 0, 1]),
    [enumHyperlinkVariants.hyperlinkEntrance]: null,
    [enumHyperlinkVariants.hyperlinkExit]: null,
};

export class MetaHyperlinkBuilding extends MetaBuilding {
    constructor() {
        super("hyperlink");
    }

    getDimensions(variant) {
        switch (variant) {
            case defaultBuildingVariant:
                return new Vector(1, 1);
            case enumHyperlinkVariants.hyperlinkEntrance:
            case enumHyperlinkVariants.hyperlinkExit:
                return new Vector(1, 2);
            default:
                assertAlways(false, "Unknown hyperlink variant: " + variant);
        }
    }

    /**
     * @param {number} rotation
     * @param {number} rotationVariant
     * @param {string} variant
     * @param {Entity} entity
     * @returns {Array<number>|null}
     */
    getSpecialOverlayRenderMatrix(rotation, rotationVariant, variant, entity) {
        const matrix = overlayMatrices[variant];
        if (matrix) {
            return matrix[rotation];
        }
        return null;
    }

    /**
     * @param {GameRoot} root
     * @param {string} variant
     * @returns {Array<[string, string]>}
     */
    getAdditionalStatistics(root, variant) {
        let speedMultiplier = 1;

        const speed =
            (root.hubGoals.getProcessorBaseSpeed(enumItemProcessorTypes.hyperlink) / 2) * speedMultiplier;
        return [[T.ingame.buildingPlacement.infoTexts.speed, formatItemsPerSecond(speed)]];
    }
    
    getSilhouetteColor() {
        return "#555759";
    }

    /**
     * @param {GameRoot} root
     */
    getAvailableVariants(root) {
        let available = [defaultBuildingVariant, enumHyperlinkVariants.hyperlinkEntrance, enumHyperlinkVariants.hyperlinkExit];
        //if (root.hubGoals.isRewardUnlocked(enumHubGoalRewards.reward_splitter)) {
        //    available.push(enumBalancerVariants.splitterTriple);
        //    //available.push(enumBalancerVariants.splitter, enumBalancerVariants.splitterInverse);
        //}

        return available;
    }

    /**
     * @param {GameRoot} root
     */
    getIsUnlocked(root) {
        return root.hubGoals.isRewardUnlocked(enumHubGoalRewards.reward_balancer);
    }

    /**
     * Creates the entity at the given location
     * @param {Entity} entity
     */
    setupEntityComponents(entity) {

        entity.addComponent(
            new ItemProcessorComponent({
                inputsPerCharge: 2,
                processorType: enumItemProcessorTypes.hyperlink,
            })
        );
        
        entity.addComponent(
            new HyperlinkAcceptorComponent({
                slots: [], // set later
            })
        );
        entity.addComponent(
            new HyperlinkEjectorComponent({
                slots: [], // set later
            })
        );
        entity.addComponent(
            new ItemAcceptorComponent({
                slots: [], // set later
            })
        );
        entity.addComponent(
            new ItemEjectorComponent({
                slots: [], // set later
            })
        );

        //entity.addComponent(new BeltUnderlaysComponent({ underlays: [] }));
    }

    /**
     *
     * @param {Entity} entity
     * @param {number} rotationVariant
     * @param {string} variant
     */
    updateVariants(entity, rotationVariant, variant) {
        switch (variant) {
            case defaultBuildingVariant: {
            

                entity.components.HyperlinkAcceptor.setSlots([
                    {
                        pos: new Vector(0, 0),
                        directions: [enumDirection.bottom],
                    },
                ]);
                

                entity.components.HyperlinkEjector.setSlots([
                    { pos: new Vector(0, 0), direction: enumDirection.top },
                ]);

                break;
            }
            case enumHyperlinkVariants.hyperlinkEntrance: {
            
                entity.components.ItemAcceptor.setSlots([
                    {
                        pos: new Vector(0, 1),
                        directions: [enumDirection.left],
                    },
                    {
                        pos: new Vector(0, 1),
                        directions: [enumDirection.right],
                    },
                ]);
                

                entity.components.HyperlinkEjector.setSlots([
                    { pos: new Vector(0, 0), direction: enumDirection.top },
                ]);

                break;
            }
            case enumHyperlinkVariants.hyperlinkExit: {
            
                entity.components.ItemEjector.setSlots([
                    {
                        pos: new Vector(0, 0),
                        directions: [enumDirection.left],
                    },
                    {
                        pos: new Vector(0, 0),
                        directions: [enumDirection.right],
                    },
                ]);
                
                entity.components.HyperlinkAcceptor.setSlots([
                    { pos: new Vector(0, 1), direction: enumDirection.bottom },
                ]);

                break;
            }
            default:
                assertAlways(false, "Unknown hyperlink variant: " + variant);
        }
    }
}
