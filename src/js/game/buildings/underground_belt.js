import { Loader } from "../../core/loader";
import { enumDirection, Vector, enumAngleToDirection, enumDirectionToVector } from "../../core/vector";
import { ItemAcceptorComponent } from "../components/item_acceptor";
import { ItemEjectorComponent } from "../components/item_ejector";
import { enumUndergroundBeltMode, UndergroundBeltComponent } from "../components/underground_belt";
import { Entity } from "../entity";
import { MetaBuilding, defaultBuildingVariant } from "../meta_building";
import { GameRoot } from "../root";
import { globalConfig } from "../../core/config";
import { enumHubGoalRewards } from "../tutorial_goals";
import { formatItemsPerSecond, generateMatrixRotations } from "../../core/utils";
import { T } from "../../translations";

/** @enum {string} */
export const arrayUndergroundRotationVariantToMode = [
    enumUndergroundBeltMode.sender,
    enumUndergroundBeltMode.receiver,
    enumUndergroundBeltMode.sender,
    enumUndergroundBeltMode.receiver,
    enumUndergroundBeltMode.sender,
    enumUndergroundBeltMode.receiver,
];

/** @enum {string} */
export const smartUndergroundBeltRotationVariants = {
    center: "center",
    left: "left",
    right: "right",
}

/** @enum {string} */
export const enumUndergroundBeltVariants = {
    tier2: "tier2",
    smart: "smart",
};

export const enumUndergroundBeltVariantToTier = {
    [defaultBuildingVariant]: 0,
    [enumUndergroundBeltVariants.tier2]: 1,
    [enumUndergroundBeltVariants.smart]: 2,
};

const colorsByRotationVariant = ["#6d9dff", "#71ff9c", "#6d9dff", "#71ff9c", "#6d9dff", "#71ff9c"];

const overlayMatrices = [
    // Sender
    generateMatrixRotations([1, 1, 1, 0, 1, 0, 0, 1, 0]),

    // Receiver
    generateMatrixRotations([0, 1, 0, 0, 1, 0, 1, 1, 1]),
    
    // Left Sender
    generateMatrixRotations([1, 1, 1, 1, 1, 0, 0, 0, 0]),

    // Left Receiver
    generateMatrixRotations([0, 0, 0, 1, 1, 0, 1, 1, 1]),
    
    // Right Sender
    generateMatrixRotations([1, 1, 1, 0, 1, 1, 0, 0, 0]),

    // Right Receiver
    generateMatrixRotations([0, 0, 0, 0, 1, 1, 1, 1, 1]),
];

export class MetaUndergroundBeltBuilding extends MetaBuilding {
    constructor() {
        super("underground_belt");
    }

    getSilhouetteColor(variant, rotationVariant) {
        return colorsByRotationVariant[rotationVariant];
    }

    getFlipOrientationAfterPlacement() {
        return true;
    }

    getStayInPlacementMode() {
        return true;
    }

    /**
     * @param {number} rotation
     * @param {number} rotationVariant
     * @param {string} variant
     * @param {Entity} entity
     */
    getSpecialOverlayRenderMatrix(rotation, rotationVariant, variant, entity) {
        return overlayMatrices[rotationVariant][rotation];
    }

    /**
     * @param {GameRoot} root
     * @param {string} variant
     * @returns {Array<[string, string]>}
     */
    getAdditionalStatistics(root, variant) {
        const rangeTiles =
            globalConfig.undergroundBeltMaxTilesByTier[enumUndergroundBeltVariantToTier[variant]];

        const beltSpeed = root.hubGoals.getUndergroundBeltBaseSpeed();
        return [
            [
                T.ingame.buildingPlacement.infoTexts.range,
                T.ingame.buildingPlacement.infoTexts.tiles.replace("<x>", "" + rangeTiles),
            ],
            [T.ingame.buildingPlacement.infoTexts.speed, formatItemsPerSecond(beltSpeed)],
        ];
    }

    /**
     * @param {GameRoot} root
     */
    getAvailableVariants(root) {
        if (root.hubGoals.isRewardUnlocked(enumHubGoalRewards.reward_underground_belt_tier_2)) {
            if (root.hubGoals.isRewardUnlocked(enumHubGoalRewards.reward_underground_belt_tier_3)) {
                return [defaultBuildingVariant, enumUndergroundBeltVariants.tier2, enumUndergroundBeltVariants.smart];
            }
            return [defaultBuildingVariant, enumUndergroundBeltVariants.tier2];
        }
        return super.getAvailableVariants(root);
    }

    /**
     * @param {number} rotationVariant
     * @param {string} variant
     */
    getPreviewSprite(rotationVariant, variant) {
        let suffix = "";
        if (variant !== defaultBuildingVariant) {
            if (variant == enumUndergroundBeltVariants.smart) {
                suffix = "-" + variant + "_" + rotationVariant;
            } else {
                suffix = "-" + variant;
            }
        }

        switch (arrayUndergroundRotationVariantToMode[rotationVariant]) {
            case enumUndergroundBeltMode.sender:
                return Loader.getSprite("sprites/buildings/underground_belt_entry" + suffix + ".png");
            case enumUndergroundBeltMode.receiver:
                return Loader.getSprite("sprites/buildings/underground_belt_exit" + suffix + ".png");
            default:
                assertAlways(false, "Invalid rotation variant");
        }
    }

    /**
     * @param {number} rotationVariant
     * @param {string} variant
     */
    getBlueprintSprite(rotationVariant, variant) {
        let suffix = "";
        if (variant !== defaultBuildingVariant) {
            if (variant == enumUndergroundBeltVariants.smart) {
                suffix = "-" + variant + "_" + rotationVariant;
            } else {
                suffix = "-" + variant;
            }
        }

        switch (arrayUndergroundRotationVariantToMode[rotationVariant]) {
            case enumUndergroundBeltMode.sender:
                return Loader.getSprite("sprites/blueprints/underground_belt_entry" + suffix + ".png");
            case enumUndergroundBeltMode.receiver:
                return Loader.getSprite("sprites/blueprints/underground_belt_exit" + suffix + ".png");
            default:
                assertAlways(false, "Invalid rotation variant");
        }
    }

    /**
     * @param {number} rotationVariant
     * @param {string} variant
     */
    getSprite(rotationVariant, variant) {
        return this.getPreviewSprite(rotationVariant, variant);
    }

    /**
     * @param {GameRoot} root
     */
    getIsUnlocked(root) {
        return root.hubGoals.isRewardUnlocked(enumHubGoalRewards.reward_tunnel);
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

        entity.addComponent(new UndergroundBeltComponent({}));
        entity.addComponent(
            new ItemAcceptorComponent({
                slots: [],
            })
        );
    }

    /**
     * Should compute the optimal rotation variant on the given tile
     * @param {object} param0
     * @param {GameRoot} param0.root
     * @param {Vector} param0.tile
     * @param {number} param0.rotation
     * @param {string} param0.variant
     * @param {Layer} param0.layer
     * @param {Entity=} param0.entity
     * @return {{ rotation: number, rotationVariant: number, connectedEntities?: Array<Entity> }}
     */
    computeOptimalDirectionAndRotationVariantAtTile({ root, tile, rotation, variant, layer, entity }) {
        const searchDirection = enumAngleToDirection[rotation];
        const searchVector = enumDirectionToVector[searchDirection];
        const tier = enumUndergroundBeltVariantToTier[variant];

        const targetRotation = (rotation + 180) % 360;
        const targetSenderRotation = rotation;
        const originalTile = tile;
        for (
            let searchOffset = 1;
            searchOffset <= globalConfig.undergroundBeltMaxTilesByTier[tier];
            ++searchOffset
        ) {
            tile = tile.addScalars(searchVector.x, searchVector.y);

            const contents = root.map.getTileContent(tile, "regular");
            if (contents) {
                
                const undergroundComp = contents.components.UndergroundBelt;
                if (undergroundComp && undergroundComp.tier === tier) {
                    const staticComp = contents.components.StaticMapEntity;
                    if (staticComp.rotation === targetRotation) {
                        if (undergroundComp.mode !== enumUndergroundBeltMode.sender) {
                            // If we encounter an underground receiver on our way which is also faced in our direction, we don't accept that
                            break;
                        }
                        if(tier == 2) {
                            return this.computeBestVariantForSmart(root, originalTile, targetRotation, enumUndergroundBeltMode.receiver, entity, contents);
                        } else {
                            return {
                                rotation: targetRotation,
                                rotationVariant: 1,
                                connectedEntities: [contents],
                            };
                        }
                        
                    } else if (staticComp.rotation === targetSenderRotation) {
                        // Draw connections to receivers
                        if (undergroundComp.mode === enumUndergroundBeltMode.receiver) {
                            if(tier == 2) {
                                return this.computeBestVariantForSmart(root, originalTile, rotation, enumUndergroundBeltMode.sender, entity, contents);
                            } else {
                                return {
                                    rotation: rotation,
                                    rotationVariant: 0,
                                    connectedEntities: [contents],
                                };
                            }
                        } else {
                            break;
                        }
                    }
                }
            }
        }
        if(tier == 2) {
            return this.computeBestVariantForSmart(root, originalTile, rotation, enumUndergroundBeltMode.sender, entity, null);
        } else {
            return {
                rotation,
                rotationVariant: 0,
            };
        }
        
    }

    /**
     * Should compute the optimal rotation variant on the given tile
     * @param {GameRoot} root
     * @param {Vector} tile
     * @param {number} rotation
     * @param {string} mode
     * @param {Entity} thisEntity
     * @param {Entity} contents
     * @return {{ rotation: number, rotationVariant: number, connectedEntities?: Array<Entity> }}
     */
    computeBestVariantForSmart( root, tile, rotation, mode, thisEntity, contents ) {
        const isSender = mode == enumUndergroundBeltMode.sender;

        const oldRotationVariant = thisEntity ? thisEntity.components.UndergroundBelt.rotationVariant : null;
        const topDirection = enumAngleToDirection[rotation];
        const rightDirection = enumAngleToDirection[(rotation + 90) % 360];
        const bottomDirection = enumAngleToDirection[(rotation + 180) % 360];
        const leftDirection = enumAngleToDirection[(rotation + 270) % 360];

        const { ejectors, acceptors } = root.logic.getEjectorsAndAcceptorsAtTile(tile, false);
        
        let hasCenterConnector = false;
        let hasRightConnector = false;
        let hasLeftConnector = false;
        if (mode !== enumUndergroundBeltMode.receiver) {
            for (let i = 0; i < ejectors.length; ++i) {
                const ejector = ejectors[i];
    
                if (ejector.toDirection === leftDirection) {
                    hasRightConnector = true;
                } else if (ejector.toDirection === rightDirection) {
                    hasLeftConnector = true;
                } else if (ejector.toDirection === topDirection) {
                    hasCenterConnector = true;
                }
            }
            if(oldRotationVariant == 0 && hasCenterConnector) {
                return {rotation: rotation, rotationVariant: 0, connectedEntities: contents ? [contents] : [], };
            } else if (oldRotationVariant == 2 && hasLeftConnector) {
                return {rotation: rotation, rotationVariant: 2, connectedEntities: contents ? [contents] : [], };
            } else if (oldRotationVariant == 4 && hasRightConnector) {
                return {rotation: rotation, rotationVariant: 4, connectedEntities: contents ? [contents] : [], };
            }
            
            
        } else {
            for (let i = 0; i < acceptors.length; ++i) {
                const acceptor = acceptors[i];
                if (acceptor.fromDirection === rightDirection) {
                    hasLeftConnector = true;
                } else if (acceptor.fromDirection === leftDirection) {
                    hasRightConnector = true;
                } else if (acceptor.fromDirection === bottomDirection) {
                    hasCenterConnector = true;
                }
            }
            if(oldRotationVariant == 1 && hasCenterConnector) {
                return {rotation: rotation, rotationVariant: 1, connectedEntities: contents ? [contents] : [], };
            } else if (oldRotationVariant == 3 && hasLeftConnector) {
                return {rotation: rotation, rotationVariant: 3, connectedEntities: contents ? [contents] : [], };
            } else if (oldRotationVariant == 5 && hasRightConnector) {
                return {rotation: rotation, rotationVariant: 5, connectedEntities: contents ? [contents] : [], };
            }
            
            
        }
        const connections = [hasCenterConnector, hasLeftConnector, hasRightConnector];
        let totalConnections = 0;
        for (let i = 0; i < 3; ++i) {
            if (connections[i]) {
                totalConnections++;
            }
        }
        let rotationVariant = isSender ? 0 : 1;
        if (totalConnections !== 1) {
            //keep old rotation variant
            rotationVariant = oldRotationVariant && totalConnections > 0 ? oldRotationVariant : isSender ? 0 : 1;
        } else if (hasCenterConnector) {
            rotationVariant = 0;
            if (!isSender) {
                rotationVariant = 1;
            }
        } else if (hasLeftConnector) {
            rotationVariant = 2;
            if (!isSender) {
                rotationVariant = 3;
            }
        } else {
            rotationVariant = 4;
            if (!isSender) {
                rotationVariant = 5;
            }
        }
        return {
            rotation: rotation,
            rotationVariant: rotationVariant,
            connectedEntities: contents ? [contents] : [],
        };
    }

    /**
     *
     * @param {Entity} entity
     * @param {number} rotationVariant
     * @param {string} variant
     */
    updateVariants(entity, rotationVariant, variant) {
        entity.components.UndergroundBelt.tier = enumUndergroundBeltVariantToTier[variant];
        entity.components.UndergroundBelt.rotationVariant = rotationVariant;
        switch (arrayUndergroundRotationVariantToMode[rotationVariant]) {
            case enumUndergroundBeltMode.sender: {
                entity.components.UndergroundBelt.mode = enumUndergroundBeltMode.sender;
                entity.components.ItemEjector.setSlots([]);
                entity.components.ItemAcceptor.setSlots([
                    {
                        pos: new Vector(0, 0),
                        directions: 
                            rotationVariant == 0 
                                ? [enumDirection.bottom]
                                : rotationVariant == 2
                                    ? [enumDirection.left]
                                    : [enumDirection.right],
                    },
                ]);
                return;
            }
            case enumUndergroundBeltMode.receiver: {
                entity.components.UndergroundBelt.mode = enumUndergroundBeltMode.receiver;
                entity.components.ItemAcceptor.setSlots([]);
                entity.components.ItemEjector.setSlots([
                    {
                        pos: new Vector(0, 0),
                        direction: rotationVariant == 1 
                        ? enumDirection.top
                        : rotationVariant == 3
                            ? enumDirection.left
                            : enumDirection.right,
                    },
                ]);
                return;
            }
            default:
                assertAlways(false, "Invalid rotation variant");
        }
    }
}
