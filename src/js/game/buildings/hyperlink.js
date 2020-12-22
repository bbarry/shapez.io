import { enumDirection, Vector } from "../../core/vector";
import { SOUNDS } from "../../platform/sound";
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
import { BeltUnderlaysComponent, enumClippedBeltUnderlayType } from "../components/belt_underlays";

/** @enum {string} */
export const enumHyperlinkVariants = {
    hyperlinkEntrance: "hyperlink-entrance",
    hyperlinkExit: "hyperlink-exit",
    //do stuff in all this code with this
};

const overlayMatrices = {
    [defaultBuildingVariant]: generateMatrixRotations([0, 1, 0, 0, 1, 0, 0, 1, 0]),
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

    getPlacementSound(variant) {
        switch(variant){
            case defaultBuildingVariant:
                return SOUNDS.placeBelt;
            default:
                return SOUNDS.placeBuilding;
        }
    }

    getStayInPlacementMode() {
        return true;
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
        return "#9e91ec";
    }

    /**
     * @param {GameRoot} root
     */
    getAvailableVariants(root) {
        let available = [defaultBuildingVariant, enumHyperlinkVariants.hyperlinkEntrance, enumHyperlinkVariants.hyperlinkExit];
        //if (root.hubGoals.isRewardUnlocked(enumHubGoalRewards.reward_splitter)) {
        //    available.push(enumBalancerVariants.splitterTriple);
        //    available.push(enumBalancerVariants.splitter, enumBalancerVariants.splitterInverse);
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
                inputsPerCharge: 1,
                processorType: enumItemProcessorTypes.hyperlink,
            })
        );

        entity.addComponent(new BeltUnderlaysComponent({ underlays: [] }));
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
                
                if(entity.components.ItemAcceptor){entity.removeComponent(ItemAcceptorComponent);}
                if(entity.components.ItemEjector){entity.removeComponent(ItemEjectorComponent);}
                if(!entity.components.HyperlinkAcceptor)
                {
                    entity.addComponent(new HyperlinkAcceptorComponent({slots: [],}))
                }
                entity.components.HyperlinkAcceptor.setSlots([
                    {
                        pos: new Vector(0, 0),
                        directions: [enumDirection.bottom],
                    },
                ]);
                
                if(!entity.components.HyperlinkEjector)
                {
                    entity.addComponent(new HyperlinkEjectorComponent({slots: [],}))
                }
                entity.components.HyperlinkEjector.setSlots([
                    { pos: new Vector(0, 0), direction: enumDirection.top },
                ]);
                break;
            }
            case enumHyperlinkVariants.hyperlinkEntrance: {
                if(entity.components.HyperlinkAcceptor){entity.removeComponent(HyperlinkAcceptorComponent);}
                if(entity.components.ItemEjector){entity.removeComponent(ItemEjectorComponent);}
                if(!entity.components.ItemAcceptor)
                {
                    entity.addComponent(new ItemAcceptorComponent({slots: [],}))
                }
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
                
                if(!entity.components.HyperlinkEjector)
                {
                    entity.addComponent(new HyperlinkEjectorComponent({slots: [],}))
                }
                entity.components.HyperlinkEjector.setSlots([
                    { pos: new Vector(0, 0), direction: enumDirection.top },
                ]);
                entity.components.ItemProcessor.inputsPerCharge = 2;

                entity.components.BeltUnderlays.underlays = [
                    { pos: new Vector(0, 1), direction: enumDirection.left},
                    { pos: new Vector(0, 1), direction: enumDirection.right},
                ];
                break;
            }
            case enumHyperlinkVariants.hyperlinkExit: {
                if(entity.components.ItemAcceptor){entity.removeComponent(ItemAcceptorComponent);}
                if(entity.components.HyperlinkEjector){entity.removeComponent(HyperlinkEjectorComponent);}
                if(!entity.components.ItemEjector)
                {
                    entity.addComponent(new ItemEjectorComponent({slots: [],}))
                }
                entity.components.ItemEjector.setSlots([
                    { pos: new Vector(0, 0), direction: enumDirection.right },
                    { pos: new Vector(0, 0), direction: enumDirection.left },
                ]);
                if(!entity.components.HyperlinkAcceptor)
                {
                    entity.addComponent(new HyperlinkAcceptorComponent({slots: [],}))
                    
                }
                entity.components.HyperlinkAcceptor.setSlots([
                    { pos: new Vector(0, 1), directions: [enumDirection.bottom], },
                ]);
                entity.components.ItemProcessor.type = enumItemProcessorTypes.hyperlinkExit;
                
                
                entity.components.BeltUnderlays.underlays = [
                    { pos: new Vector(0, 0), direction: enumDirection.left },
                    { pos: new Vector(0, 0), direction: enumDirection.right },
                ];
                break;
            }
            default:
                assertAlways(false, "Unknown hyperlink variant: " + variant);
        }
    }
}
