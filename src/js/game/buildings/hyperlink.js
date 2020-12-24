import { Loader } from "../../core/loader";
import { enumAngleToDirection, enumDirection, Vector } from "../../core/vector";
import { SOUNDS } from "../../platform/sound";
import { ItemAcceptorComponent } from "../components/item_acceptor";
import { ItemEjectorComponent } from "../components/item_ejector";
import { HyperlinkComponent } from "../components/hyperlink";
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
import { isTrueItem } from "../items/boolean_item";

/** @enum {string} */
export const enumHyperlinkVariants = {
    hyperlinkEntrance: "hyperlink_entrance",
    hyperlinkExit: "hyperlink_exit",
    //do stuff in all this code with this
};

export const arrayHyperlinkVariantToRotation = [enumDirection.top, enumDirection.left, enumDirection.right];

export const hyperlinkOverlayMatrices = {
    [enumDirection.top]: generateMatrixRotations([0, 1, 0, 0, 1, 0, 0, 1, 0]),
    [enumDirection.left]: generateMatrixRotations([0, 0, 0, 1, 1, 0, 0, 1, 0]),
    [enumDirection.right]: generateMatrixRotations([0, 0, 0, 0, 1, 1, 0, 1, 0]),
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
            case undefined:
                return SOUNDS.placeBelt;
            default:
                return SOUNDS.placeBuilding;
        }
    }

    getRotateAutomaticallyWhilePlacing(variant){
        switch(variant){
            case defaultBuildingVariant:
            case undefined:
                return true;
            default:
                return false;
        }
    }

    getHasDirectionLockAvailable(variant) {
        switch(variant){
            case defaultBuildingVariant:
            case undefined:
                return true;
            default:
                return false;
        }
    }
    
    getStayInPlacementMode(variant) {
        switch(variant){
            case defaultBuildingVariant:
            case undefined:
                return true;
            default:
                return false;
        }
    }

    getSprite(rotationVariant, variant) {
        if(variant !== defaultBuildingVariant){
            return Loader.getSprite(
                "sprites/buildings/" +
                    this.id +
                    (variant === defaultBuildingVariant ? "" : "-" + variant) +
                    ".png"
            );
        }
        switch (arrayHyperlinkVariantToRotation[rotationVariant]) {
            case enumDirection.top: {
                return Loader.getSprite("sprites/buildings/hyperlink.png");
            }
            case enumDirection.left: {
                return Loader.getSprite("sprites/buildings/hyperlink_left.png");
            }
            case enumDirection.right: {
                return Loader.getSprite("sprites/buildings/hyperlink_right.png");
            }
            default: {
                assertAlways(false, "Invalid hyperlink rotation variant");
            }
        }
    }
    getIsRotateable() {
        return true;
    }


    getBlueprintSprite(rotationVariant, variant) {
        if(variant !== defaultBuildingVariant){
            return Loader.getSprite(
                "sprites/blueprints/" +
                    this.id +
                    (variant === defaultBuildingVariant ? "" : "-" + variant) +
                    ".png"
            );
        }
        switch (arrayHyperlinkVariantToRotation[rotationVariant]) {
            case enumDirection.top: {
                return Loader.getSprite("sprites/blueprints/hyperlink.png");
            }
            case enumDirection.left: {
                return Loader.getSprite("sprites/blueprints/hyperlink_left.png");
            }
            case enumDirection.right: {
                return Loader.getSprite("sprites/blueprints/hyperlink_right.png");
            }
            default: {
                assertAlways(false, "Invalid belt rotation variant");
            }
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
        const speed = (root.hubGoals.getProcessorBaseSpeed(enumItemProcessorTypes.hyperlink) / 2);
        return [[T.ingame.buildingPlacement.infoTexts.speed, formatItemsPerSecond(speed)]];
    }
    
    getSilhouetteColor() {
        return "#9e91ec";
    }

    /**
     * @param {GameRoot} root
     */
    getAvailableVariants(root) {
        return [defaultBuildingVariant, enumHyperlinkVariants.hyperlinkEntrance, enumHyperlinkVariants.hyperlinkExit];
    }

    /**
     * @param {GameRoot} root
     */
    getIsUnlocked(root) {
        return true;
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
        entity.addComponent(new HyperlinkComponent({}));
        entity.addComponent(new BeltUnderlaysComponent({ underlays: [] }));
    }

    /**
     *
     * @param {Entity} entity
     * @param {number} rotationVariant
     * @param {string} variant
     */
    updateVariants(entity, rotationVariant, variant) {
        entity.components.Hyperlink.direction = arrayHyperlinkVariantToRotation[rotationVariant];
        switch (variant) {
            case defaultBuildingVariant: {
                if(entity.components.BeltUnderlays){entity.removeComponent(BeltUnderlaysComponent);}
                if(entity.components.ItemAcceptor){entity.removeComponent(ItemAcceptorComponent);}
                if(entity.components.ItemEjector){entity.removeComponent(ItemEjectorComponent);}
                if(!entity.components.HyperlinkEjector){entity.addComponent(new HyperlinkEjectorComponent({slots: [],}));}
                if(!entity.components.HyperlinkAcceptor){
                    entity.addComponent(new HyperlinkAcceptorComponent({slots: [],}))
                }
                entity.components.HyperlinkAcceptor.setSlots([{
                    pos: new Vector(0, 0), directions: [enumDirection.bottom], },
                ]);
                

                switch (arrayHyperlinkVariantToRotation[rotationVariant]) {
                    case enumDirection.top: {
                        entity.components.HyperlinkEjector.setSlots([
                            { pos: new Vector(0, 0), direction: enumDirection.top },
                        ]);
                        break;
                    }
                    case enumDirection.left: {
                        entity.components.HyperlinkEjector.setSlots([
                            { pos: new Vector(0, 0), direction: enumDirection.left },
                        ]);
                        break;
                    }
                    case enumDirection.right: {
                        entity.components.HyperlinkEjector.setSlots([
                            { pos: new Vector(0, 0), direction: enumDirection.right },
                        ]);
                        break;
                    }
                    default: {
                        assertAlways(false, "Invalid hyperlink rotation variant");
                    }
                }
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
                if(!entity.components.BeltUnderlays){
                    entity.addComponent(new BeltUnderlaysComponent({ underlays: [] }));
                }
                entity.components.BeltUnderlays.underlays = [
                    { pos: new Vector(0, 1), direction: enumDirection.left},
                    { pos: new Vector(0, 1), direction: enumDirection.right},
                ];
                break;
            }
            case enumHyperlinkVariants.hyperlinkExit: {
                if(entity.components.ItemAcceptor){entity.removeComponent(ItemAcceptorComponent);}
                if(entity.components.HyperlinkEjector){entity.removeComponent(HyperlinkEjectorComponent);}
                if(!entity.components.ItemEjector){
                    entity.addComponent(new ItemEjectorComponent({slots: [],}))
                }
                entity.components.ItemEjector.setSlots([
                    { pos: new Vector(0, 0), direction: enumDirection.right },
                    { pos: new Vector(0, 0), direction: enumDirection.left },
                ]);
                if(!entity.components.HyperlinkAcceptor){
                    entity.addComponent(new HyperlinkAcceptorComponent({slots: [],}))
                }
                entity.components.HyperlinkAcceptor.setSlots([
                    { pos: new Vector(0, 1), directions: [enumDirection.bottom], },
                ]);
                entity.components.ItemProcessor.type = enumItemProcessorTypes.hyperlinkExit;
                
                if(!entity.components.BeltUnderlays){
                    entity.addComponent(new BeltUnderlaysComponent({ underlays: [] }));
                }
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

    /**
     * Should compute the optimal rotation variant on the given tile
     * @param {object} param0
     * @param {GameRoot} param0.root
     * @param {Vector} param0.tile
     * @param {number} param0.rotation
     * @param {string} param0.variant
     * @param {Layer} param0.layer
     * @return {{ rotation: number, rotationVariant: number, connectedEntities?: Array<Entity> }}
     */
    computeOptimalDirectionAndRotationVariantAtTile({ root, tile, rotation, variant, layer }) {
        if(variant !== defaultBuildingVariant){
            return {
                rotation: 0,
                rotationVariant: 0,
            };
        }
        const topDirection = enumAngleToDirection[rotation];
        const rightDirection = enumAngleToDirection[(rotation + 90) % 360];
        const bottomDirection = enumAngleToDirection[(rotation + 180) % 360];
        const leftDirection = enumAngleToDirection[(rotation + 270) % 360];

        const { ejectors, acceptors } = root.logic.getEjectorsAndAcceptorsAtTile(tile, true);

        let hasBottomEjector = false;
        let hasRightEjector = false;
        let hasLeftEjector = false;

        let hasTopAcceptor = false;
        let hasLeftAcceptor = false;
        let hasRightAcceptor = false;

        // Check all ejectors
        for (let i = 0; i < ejectors.length; ++i) {
            const ejector = ejectors[i];

            if (ejector.toDirection === topDirection) {
                hasBottomEjector = true;
            } else if (ejector.toDirection === leftDirection) {
                hasRightEjector = true;
            } else if (ejector.toDirection === rightDirection) {
                hasLeftEjector = true;
            }
        }

        // Check all acceptors
        for (let i = 0; i < acceptors.length; ++i) {
            const acceptor = acceptors[i];
            if (acceptor.fromDirection === bottomDirection) {
                hasTopAcceptor = true;
            } else if (acceptor.fromDirection === rightDirection) {
                hasLeftAcceptor = true;
            } else if (acceptor.fromDirection === leftDirection) {
                hasRightAcceptor = true;
            }
        }

        // Soo .. if there is any ejector below us we always prioritize
        // this ejector
        if (!hasBottomEjector) {
            // When something ejects to us from the left and nothing from the right,
            // do a curve from the left to the top

            if (hasRightEjector && !hasLeftEjector) {
                return {
                    rotation: (rotation + 270) % 360,
                    rotationVariant: 2,
                };
            }

            // When something ejects to us from the right and nothing from the left,
            // do a curve from the right to the top
            if (hasLeftEjector && !hasRightEjector) {
                return {
                    rotation: (rotation + 90) % 360,
                    rotationVariant: 1,
                };
            }
        }

        // When there is a top acceptor, ignore sides
        // NOTICE: This makes the belt prefer side turns *way* too much!
        if (!hasTopAcceptor) {
            // When there is an acceptor to the right but no acceptor to the left,
            // do a turn to the right
            if (hasRightAcceptor && !hasLeftAcceptor) {
                return {
                    rotation,
                    rotationVariant: 2,
                };
            }

            // When there is an acceptor to the left but no acceptor to the right,
            // do a turn to the left
            if (hasLeftAcceptor && !hasRightAcceptor) {
                return {
                    rotation,
                    rotationVariant: 1,
                };
            }
        }

        return {
            rotation,
            rotationVariant: 0,
        };
    }
}
