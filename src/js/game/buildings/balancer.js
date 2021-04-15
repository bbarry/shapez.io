import { enumDirection, enumAngleToDirection, Vector } from "../../core/vector";
import { ItemAcceptorComponent } from "../components/item_acceptor";
import { ItemEjectorComponent } from "../components/item_ejector";
import { enumItemProcessorTypes, ItemProcessorComponent } from "../components/item_processor";
import { Entity } from "../entity";
import { MetaBuilding, defaultBuildingVariant } from "../meta_building";
import { GameRoot } from "../root";
import { enumHubGoalRewards } from "../tutorial_goals";
import { T } from "../../translations";
import { formatItemsPerSecond, generateMatrixRotations } from "../../core/utils";
import { BeltUnderlaysComponent } from "../components/belt_underlays";
import { Loader } from "../../core/loader";
import { SmartBalancerComponent } from "../components/smart_balancer";

const smartRotationVariants = {
    center: "center",
    left: "left",
    right: "right",
    all: "all",
    both: "both",
};

const numberToRotationVariant = {
    0: smartRotationVariants.center,
    1: smartRotationVariants.left,
    2: smartRotationVariants.right,
    3: smartRotationVariants.all,
    4: smartRotationVariants.both,
}



/** @enum {string} */
export const enumBalancerVariants = {
    splitterTriple: "splitter-triple",
    mergerTriple: "merger-triple",
    //do stuff in all this code with this
};


const mergerMatrices = {
    0: generateMatrixRotations([0, 1, 0, 0, 1, 0, 0, 1, 0]),
    1: generateMatrixRotations([0, 1, 0, 1, 1, 0, 0, 1, 0]),
    2: generateMatrixRotations([0, 1, 0, 0, 1, 1, 0, 1, 0]),
    3: generateMatrixRotations([0, 1, 0, 1, 1, 1, 0, 1, 0]),
    4: generateMatrixRotations([0, 1, 0, 1, 1, 1, 0, 0, 0]),
}
const splitterMatrices = {
    0: generateMatrixRotations([0, 1, 0, 0, 1, 0, 0, 1, 0]),
    1: generateMatrixRotations([0, 1, 0, 1, 1, 0, 0, 1, 0]),
    2: generateMatrixRotations([0, 1, 0, 0, 1, 1, 0, 1, 0]),
    3: generateMatrixRotations([0, 1, 0, 1, 1, 1, 0, 1, 0]),
    4: generateMatrixRotations([0, 0, 0, 1, 1, 1, 0, 1, 0])
}


export class MetaBalancerBuilding extends MetaBuilding {
    constructor() {
        super("balancer");
    }

    getDimensions(variant) {
        switch (variant) {
            case defaultBuildingVariant:
                return new Vector(2, 1);
            case enumBalancerVariants.splitterTriple:
            case enumBalancerVariants.mergerTriple:
                return new Vector(1, 1);
            default:
                assertAlways(false, "Unknown balancer variant: " + variant);
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
        let matrix = null;
        switch (variant) {
            case enumBalancerVariants.mergerTriple:
                matrix = mergerMatrices[rotationVariant];
                break;
            case enumBalancerVariants.splitterTriple:
                matrix = splitterMatrices[rotationVariant];
                break;
            default:
                matrix = null;
                break;

        }
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
        switch(variant)
        {
            case defaultBuildingVariant:
                speedMultiplier = 2;
                break;
            default:
                break;

        }

        const speed =
            (root.hubGoals.getProcessorBaseSpeed(enumItemProcessorTypes.balancer) / 2) * speedMultiplier;
        return [[T.ingame.buildingPlacement.infoTexts.speed, formatItemsPerSecond(speed)]];
    }

    getSilhouetteColor() {
        return "#555759";
    }


    /**
     * @param {number} rotationVariant
     * @param {string} variant
     */
    getPreviewSprite(rotationVariant, variant) {
        switch(variant) {
            case enumBalancerVariants.mergerTriple:
            case enumBalancerVariants.splitterTriple:
                return Loader.getSprite(
                    "sprites/buildings/balancer" + "-" + variant + "_" + numberToRotationVariant[rotationVariant] + ".png"
                    );
            default:
                return Loader.getSprite(
                    "sprites/buildings/" +
                        this.id +
                        (variant === defaultBuildingVariant ? "" : "-" + variant) +
                        ".png"
                );
        }
    }

    /**
     * @param {number} rotationVariant
     * @param {string} variant
     */
    getBlueprintSprite(rotationVariant, variant) {
        switch(variant) {
            case enumBalancerVariants.mergerTriple:
            case enumBalancerVariants.splitterTriple:
                return Loader.getSprite(
                    "sprites/blueprints/balancer" + "-" + variant + "_" + numberToRotationVariant[rotationVariant] + ".png"
                    );
            default:
                return Loader.getSprite(
                    "sprites/blueprints/" +
                        this.id +
                        (variant === defaultBuildingVariant ? "" : "-" + variant) +
                        ".png"
                );
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
    getAvailableVariants(root) {
        let available = [defaultBuildingVariant];
        if (root.hubGoals.isRewardUnlocked(enumHubGoalRewards.reward_merger)) {
            available.push(enumBalancerVariants.mergerTriple);
        }

        if (root.hubGoals.isRewardUnlocked(enumHubGoalRewards.reward_splitter)) {
            available.push(enumBalancerVariants.splitterTriple);
        }

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
            new ItemAcceptorComponent({
                slots: [], // set later
            })
        );

        entity.addComponent(
            new ItemProcessorComponent({
                inputsToProcess: 1,
                processorType: enumItemProcessorTypes.balancer,
            })
        );

        entity.addComponent(
            new ItemEjectorComponent({
                slots: [], // set later
                renderFloatingItems: false,
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
                if (entity.components.SmartBalancer) {entity.removeComponent(SmartBalancerComponent);}
                entity.components.ItemAcceptor.setSlots([
                    {
                        pos: new Vector(0, 0),
                        directions: [enumDirection.bottom],
                    },
                    {
                        pos: new Vector(1, 0),
                        directions: [enumDirection.bottom],
                    },
                ]);

                entity.components.ItemEjector.setSlots([
                    { pos: new Vector(0, 0), direction: enumDirection.top },
                    { pos: new Vector(1, 0), direction: enumDirection.top },
                ]);

                entity.components.BeltUnderlays.underlays = [
                    { pos: new Vector(0, 0), direction: enumDirection.top },
                    { pos: new Vector(1, 0), direction: enumDirection.top },
                ];

                break;
            }

            case enumBalancerVariants.mergerTriple:
            case enumBalancerVariants.splitterTriple: {
                if (!entity.components.SmartBalancer) {
                    entity.addComponent(new SmartBalancerComponent({variant: variant}));
                }
                entity.components.BeltUnderlays.underlays = [
                    { pos: new Vector(0, 0), direction: enumDirection.top },
                ];
                switch (numberToRotationVariant[rotationVariant]) {
                    case smartRotationVariants.center:
                        entity.components.ItemEjector.setSlots([{ pos: new Vector(0, 0), direction: enumDirection.top },]) 
                        entity.components.ItemAcceptor.setSlots([{ pos: new Vector(0, 0), directions: [enumDirection.bottom] },]);
                        break;
                    case smartRotationVariants.left:
                    case smartRotationVariants.right: {
                        if (variant === enumBalancerVariants.mergerTriple) {
                            entity.components.ItemEjector.setSlots([{ pos: new Vector(0, 0), direction: enumDirection.top },])
                            entity.components.ItemAcceptor.setSlots([
                                { pos: new Vector(0, 0), directions: [enumDirection.bottom] },
                                {
                                    pos: new Vector(0, 0), 
                                    directions: numberToRotationVariant[rotationVariant] == smartRotationVariants.left 
                                    ? [enumDirection.left]
                                    : [enumDirection.right]
                                },
                            ]);
                        } else {
                            entity.components.ItemAcceptor.setSlots([{ pos: new Vector(0, 0), directions: [enumDirection.bottom] },])
                            entity.components.ItemEjector.setSlots([
                                { pos: new Vector(0, 0), direction: enumDirection.top },
                                {
                                    pos: new Vector(0, 0), 
                                    direction: numberToRotationVariant[rotationVariant] == smartRotationVariants.left 
                                    ? enumDirection.left
                                    : enumDirection.right
                                },
                            ]);
                        }
                        break;
                    }
                    case smartRotationVariants.all: {
                        if (variant === enumBalancerVariants.mergerTriple) {
                            entity.components.ItemEjector.setSlots([{ pos: new Vector(0, 0), direction: enumDirection.top },])
                            entity.components.ItemAcceptor.setSlots([
                                { pos: new Vector(0, 0), directions: [enumDirection.left] },
                                { pos: new Vector(0, 0), directions: [enumDirection.bottom] },
                                { pos: new Vector(0, 0), directions: [enumDirection.right] },
                            ]);
                        } else {
                            entity.components.ItemAcceptor.setSlots([{ pos: new Vector(0, 0), directions: [enumDirection.bottom] },]);
                            entity.components.ItemEjector.setSlots([
                                { pos: new Vector(0, 0), direction: enumDirection.left },
                                { pos: new Vector(0, 0), direction: enumDirection.top },
                                { pos: new Vector(0, 0), direction: enumDirection.right },])
                        }
                        break;
                    }
                    case smartRotationVariants.both: {
                        if (variant === enumBalancerVariants.mergerTriple) {
                            entity.components.ItemEjector.setSlots([{ pos: new Vector(0, 0), direction: enumDirection.top },])
                            entity.components.ItemAcceptor.setSlots([
                                { pos: new Vector(0, 0), directions: [enumDirection.left] },
                                { pos: new Vector(0, 0), directions: [enumDirection.right] },
                            ]);
                        } else {
                            entity.components.ItemAcceptor.setSlots([{ pos: new Vector(0, 0), directions: [enumDirection.bottom] },]);
                            entity.components.ItemEjector.setSlots([
                                { pos: new Vector(0, 0), direction: enumDirection.left },
                                { pos: new Vector(0, 0), direction: enumDirection.right },
                            ])
                        }
                        break;
                    }
                }
                break;
            }
            default:
                assertAlways(false, "Unknown balancer variant: " + variant);
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
        if (variant == defaultBuildingVariant) {
            return {
                rotation,
                rotationVariant: 0,
            };
        }
        const topDirection = enumAngleToDirection[rotation];
        const rightDirection = enumAngleToDirection[(rotation + 90) % 360];
        const bottomDirection = enumAngleToDirection[(rotation + 180) % 360];
        const leftDirection = enumAngleToDirection[(rotation + 270) % 360];

        const { ejectors, acceptors } = root.logic.getEjectorsAndAcceptorsAtTile(tile, false, false);


        let rotationVariant = 0;

        let hasRightConnector = false;
        let hasLeftConnector = false;
        let hasCenterConnector = false;
        if (variant == enumBalancerVariants.mergerTriple) {
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
        }
        
        if(hasRightConnector) {
            rotationVariant = hasLeftConnector 
                ? hasCenterConnector
                    ? 3
                    : 4
                : 2;
        } else if (hasLeftConnector) {
            rotationVariant = 1;
        }

        return {
            rotation,
            rotationVariant: rotationVariant,
        };
    }
}
