import { BaseItem } from "../base_item";
import { enumColorMixingResults, enumColors } from "../colors";
import {
    enumItemProcessorRequirements,
    enumItemProcessorTypes,
    ItemProcessorComponent,
} from "../components/item_processor";
import { Entity } from "../entity";
import { GameSystemWithFilter } from "../game_system_with_filter";
import { BOOL_TRUE_SINGLETON, isTruthyItem } from "../items/boolean_item";
import { ColorItem, COLOR_ITEM_SINGLETONS } from "../items/color_item";
import { ShapeItem } from "../items/shape_item";
import { enumMergedShape } from "../shape_definition";
/**
 * We need to allow queuing charges, otherwise the throughput will stall
 */
const MAX_QUEUED_CHARGES = 2;

/**
 * Whole data for a produced item
 *
 * @typedef {{
 *   item: BaseItem,
 *   preferredSlot?: number,
 *   requiredSlot?: number,
 *   doNotTrack?: boolean
 * }} ProducedItem
 */

/**
 * Type of a processor implementation
 * @typedef {{
 *   entity: Entity,
 *   items: Array<{ item: BaseItem, sourceSlot: number }>,
 *   itemsBySlot: Object<number, BaseItem>,
 *   outItems: Array<ProducedItem>
 *   }} ProcessorImplementationPayload
 */

export class ItemProcessorSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [ItemProcessorComponent]);

        /**
         * @type {Object<enumItemProcessorTypes, function(ProcessorImplementationPayload) : string>}
         */
        this.handlers = {
            [enumItemProcessorTypes.hyperlink]: this.process_HYPERLINK,
            [enumItemProcessorTypes.balancer]: this.process_BALANCER,
            [enumItemProcessorTypes.cutter]: this.process_CUTTER,
            [enumItemProcessorTypes.cutterQuad]: this.process_CUTTER_QUAD,
            [enumItemProcessorTypes.cutterLaser]: this.process_CUTTER_LASER,
            [enumItemProcessorTypes.rotater]: this.process_ROTATER,
            [enumItemProcessorTypes.rotaterCCW]: this.process_ROTATER_CCW,
            [enumItemProcessorTypes.rotater180]: this.process_ROTATER_180,
            [enumItemProcessorTypes.stacker]: this.process_STACKER,
            [enumItemProcessorTypes.smartStacker]: this.process_SMART_STACKER,
            [enumItemProcessorTypes.shapeMerger]: this.process_SHAPE_MERGER,
            [enumItemProcessorTypes.trash]: this.process_TRASH,
            [enumItemProcessorTypes.mixer]: this.process_MIXER,
            [enumItemProcessorTypes.painter]: this.process_PAINTER,
            [enumItemProcessorTypes.painterDouble]: this.process_PAINTER_DOUBLE,
            [enumItemProcessorTypes.painterQuad]: this.process_PAINTER_QUAD,
            [enumItemProcessorTypes.hub]: this.process_HUB,
            [enumItemProcessorTypes.reader]: this.process_READER,
        };

        // Bind all handlers
        for (const key in this.handlers) {
            this.handlers[key] = this.handlers[key].bind(this);
        }
    }
    update() {
        for (let i = 0; i < this.allEntities.length; ++i) {
            const entity = this.allEntities[i];
            const processorComp = entity.components.ItemProcessor;
            let ejectorComp = entity.components.HyperlinkEjector;
            if (!ejectorComp) {
                ejectorComp = entity.components.ItemEjector;
            }

            for (let chargeIndex = 0; ; chargeIndex++) {
                // Check if we have an open queue spot and can start a new charge
                if (this.canProcess(entity)) {
                    if (!processorComp.makeCharges && processorComp.inputSlots[0]) {
                        for (let i = 0; i < processorComp.inputSlots.length; ++i) {
                            const slot = processorComp.inputSlots[i].sourceSlot;
                            const item = processorComp.inputSlots[i].item;
                            const isOnMap = this.root.camera.getIsMapOverlayActive();
                            const isOffWindow = this.root.app.unloaded || !this.root.app.pageVisible;
                            if (
                                ejectorComp.canEjectOnSlot(slot) &&
                                (this.isAcceptorSlotFree(entity, slot) || isOnMap || isOffWindow)
                            ) {
                                if (ejectorComp.tryEject(slot, item)) {
                                    processorComp.inputSlots.splice(i, 1);
                                }
                            }
                        }
                    } else if (processorComp.ongoingCharges.length < MAX_QUEUED_CHARGES) {
                        this.startNewCharge(entity);
                    }
                }

                if (chargeIndex >= 1 || processorComp.ongoingCharges.length == 0) {
                    break;
                }

                const currentCharge = processorComp.ongoingCharges[chargeIndex];

                // Process next charge
                if (currentCharge.remainingTime > 0.0) {
                    const deltaTime = this.root.dynamicTickrate.deltaSeconds + processorComp.bonusTime;
                    currentCharge.remainingTime -= deltaTime;
                    processorComp.bonusTime = 0;
                    if (currentCharge.remainingTime > 0.0) {
                        // This charge is not finished, so don't process the next one
                        break;
                    }
                    if (currentCharge.remainingTime < 0.0) {
                        // Add bonus time, this is the time we spent too much
                        processorComp.bonusTime += -currentCharge.remainingTime;
                    }
                }
                // Check if it finished
                if (currentCharge.remainingTime <= 0.0) {
                    if (!currentCharge.items) {
                        this.processCharge(entity);
                    }
                    const itemsToEject = currentCharge.items;
                    // Go over all items and try to eject them
                    for (let j = 0; j < itemsToEject.length; ++j) {
                        const { item, requiredSlot, preferredSlot } = itemsToEject[j];

                        let slot = null;

                        if (requiredSlot !== null && requiredSlot !== undefined) {
                            // We have a slot override, check if that is free
                            if (ejectorComp.canEjectOnSlot(requiredSlot)) {
                                slot = requiredSlot;
                            }
                        } else if (preferredSlot !== null && preferredSlot !== undefined) {
                            // We have a slot preference, try using it but otherwise use a free slot

                            if (
                                ejectorComp.canEjectOnSlot(preferredSlot) &&
                                preferredSlot !== ejectorComp.lastUsedSlot
                            ) {
                                slot = preferredSlot;
                                ejectorComp.lastUsedSlot = slot;
                            } else {
                                if (!entity.components.HyperlinkAcceptor && ejectorComp.slots[2]) {
                                    slot = ejectorComp.getNextFreeSlotForTriple(
                                        preferredSlot,
                                        ejectorComp.lastUsedSlot
                                    );
                                    if (slot !== null) {
                                        ejectorComp.lastUsedSlot = slot;
                                    }
                                } else {
                                    slot = ejectorComp.getFirstFreeSlot();
                                }
                            }
                        } else {
                            // We can eject on any slot
                            slot = ejectorComp.getFirstFreeSlot();
                        }
                        if (slot !== null) {
                            // Alright, we can actually eject
                            if (!ejectorComp.tryEject(slot, item)) {
                                assert(false, "Failed to eject");
                            } else {
                                itemsToEject.splice(j, 1);
                                j -= 1;
                            }
                        }
                    }

                    // If the charge was entirely emptied to the outputs, start the next charge
                    if (itemsToEject.length === 0) {
                        processorComp.ongoingCharges.shift();
                        chargeIndex--;
                    }
                }
            }
        }
    }
    /**
     * Returns true if a acceptor slot is not accepting an item
     * @param {Entity} entity
     * @param {number} slotIndex The slot index
     * @returns {boolean}
     */
    isAcceptorSlotFree(entity, slotIndex) {
        assert(
            entity.components.ItemAcceptor,
            "To accept items, the building needs to have an Item Acceptor"
        );
        const acceptorComp = entity.components.ItemAcceptor;
        for (let i = 0; i < acceptorComp.itemConsumptionAnimations.length; ++i) {
            const isSlot = acceptorComp.itemConsumptionAnimations[i].slotIndex == slotIndex;
            if (isSlot) {
                return false;
            }
        }
        return true;
    }

    /**
     * Returns true if the entity should accept the given item on the given slot.
     * This should only be called with matching items! I.e. if a color item is expected
     * on the given slot, then only a color item must be passed.
     * @param {Entity} entity
     * @param {BaseItem} item The item to accept
     * @param {number} slotIndex The slot index
     * @returns {boolean}
     */
    checkRequirements(entity, item, slotIndex) {
        const itemProcessorComp = entity.components.ItemProcessor;
        const pinsComp = entity.components.WiredPins;

        switch (itemProcessorComp.processingRequirement) {
            case enumItemProcessorRequirements.painterQuad: {
                if (slotIndex === 0) {
                    // Always accept the shape
                    return true;
                }

                // Check the network value at the given slot
                const network = pinsComp.slots[slotIndex - 1].linkedNetwork;
                const slotIsEnabled = network && network.hasValue() && isTruthyItem(network.currentValue);
                if (!slotIsEnabled) {
                    return false;
                }
                return true;
            }

            case enumItemProcessorRequirements.shapeMerger: {
                // @ts-ignore
                //if (!(item.definition.layers.length == 1)) {
                //    return false;
                //}
                // @ts-ignore
                //const layer = item.definition.layers[0];
                //for (let quad = 0; quad < 4; ++quad) {
                //    if (layer[quad] && enumMergedShape[layer[quad].subShape]) {
                //        return false;
                //    }
                //}
                return true;
            }
            // By default, everything is accepted
            default:
            case enumItemProcessorRequirements.smartStacker:
                return true;
        }
    }

    /**
     * Checks whether it's possible to process something
     * @param {Entity} entity
     */
    canProcess(entity) {
        const processorComp = entity.components.ItemProcessor;

        switch (processorComp.processingRequirement) {
            // DEFAULT
            // By default, we can start processing once all inputs are there
            case null:
            case enumItemProcessorRequirements.shapeMerger: {
                const hasInputs = processorComp.inputSlots.length >= processorComp.inputsToProcess;
                return hasInputs;
            }

            case enumItemProcessorRequirements.smartStacker: {
                const hasEnoughInputs = processorComp.inputSlots.length >= processorComp.inputsToProcess;

                /** @type {Object.<number, { item: BaseItem, sourceSlot: number }>} */
                const itemsBySlot = {};
                for (let i = 0; i < processorComp.inputSlots.length; ++i) {
                    itemsBySlot[processorComp.inputSlots[i].sourceSlot] = processorComp.inputSlots[i];
                }

                if (!itemsBySlot[0]) {
                    return false;
                }
                if (!hasEnoughInputs) {
                    return false;
                }
                return true;
            }

            // QUAD PAINTER
            // For the quad painter, it might be possible to start processing earlier
            case enumItemProcessorRequirements.painterQuad: {
                const pinsComp = entity.components.WiredPins;

                /** @type {Object.<number, { item: BaseItem, sourceSlot: number }>} */
                const itemsBySlot = {};
                for (let i = 0; i < processorComp.inputSlots.length; ++i) {
                    itemsBySlot[processorComp.inputSlots[i].sourceSlot] = processorComp.inputSlots[i];
                }

                // First slot is the shape, so if it's not there we can't do anything
                if (!itemsBySlot[0]) {
                    return false;
                }

                const shapeItem = /** @type {ShapeItem} */ (itemsBySlot[0].item);
                const slotStatus = [];

                // Check which slots are enabled
                for (let i = 0; i < 4; ++i) {
                    // Extract the network value on the Nth pin
                    const network = pinsComp.slots[i].linkedNetwork;
                    const networkValue = network && network.hasValue() ? network.currentValue : null;

                    // If there is no "1" on that slot, don't paint there
                    if (!isTruthyItem(networkValue)) {
                        slotStatus.push(false);
                        continue;
                    }

                    slotStatus.push(true);
                }

                // All slots are disabled
                if (!slotStatus.includes(true)) {
                    return false;
                }

                // Check if all colors of the enabled slots are there
                for (let i = 0; i < slotStatus.length; ++i) {
                    if (slotStatus[i] && !itemsBySlot[1 + i]) {
                        // A slot which is enabled wasn't enabled. Make sure if there is anything on the quadrant,
                        // it is not possible to paint, but if there is nothing we can ignore it
                        for (let j = 0; j < 4; ++j) {
                            const layer = shapeItem.definition.layers[j];
                            if (layer && layer[i]) {
                                return false;
                            }
                        }
                    }
                }

                return true;
            }

            default:
                assertAlways(false, "Unknown requirement for " + processorComp.processingRequirement);
        }
    }

    /**
     * Starts a new charge for the entity
     * @param {Entity} entity
     */
    startNewCharge(entity) {
        //want it so that it only starts the charge when it has enough paint (if applicable) so we
        //need to store the amount of paint somewhere array

        // also need to only do handler at the END
        const processorComp = entity.components.ItemProcessor;
        // First, take items
        // add as many as needed for
        processorComp.currentItems.push(processorComp.inputSlots);

        processorComp.inputSlots = []; // for now

        // Queue Charge
        let baseSpeed = this.root.hubGoals.getProcessorBaseSpeed(processorComp.type);
        if (entity.components.HyperlinkAcceptor && !entity.components.Hyperlink) {
            baseSpeed *= 3;
        }
        processorComp.ongoingCharges.push({
            items: null,
            remainingTime: 1 / baseSpeed,
        });
    }

    /**
     * Processes a charge
     * @param {Entity} entity
     */
    processCharge(entity) {
        const processorComp = entity.components.ItemProcessor;

        const items = processorComp.currentItems.shift();
        /** @type {Object<string, BaseItem>} */
        const itemsBySlot = {};
        for (let i = 0; i < items.length; ++i) {
            itemsBySlot[items[i].sourceSlot] = items[i].item;
        }

        /** @type {Array<ProducedItem>} */
        const outItems = [];

        /** @type {function(ProcessorImplementationPayload) : void} */
        const handler = this.handlers[processorComp.type];
        assert(handler, "No handler for processor type defined: " + processorComp.type);

        // Call implementation
        handler({
            entity,
            items,
            itemsBySlot,
            outItems,
        });

        // Track produced items
        for (let i = 0; i < outItems.length; ++i) {
            if (!outItems[i].doNotTrack) {
                this.root.signals.itemProduced.dispatch(outItems[i].item);
            }
        }

        processorComp.ongoingCharges[0].items = outItems;
    }

    /**
     * @param {ProcessorImplementationPayload} payload
     */
    process_HYPERLINK(payload) {
        assert(
            payload.entity.components.HyperlinkEjector || payload.entity.components.HyperlinkAcceptor,
            "To be a hyperlink, the building needs to have a hyperlink part"
        );
        const availableSlots = payload.entity.components.HyperlinkEjector.slots.length;

        const processorComp = payload.entity.components.ItemProcessor;

        const nextSlot = processorComp.nextOutputSlot++ % availableSlots;
        if (payload.entity.components.ItemEjector) {
            for (let i = 0; i < payload.items.length; ++i) {
                payload.outItems.push({
                    item: payload.items[i].item,
                    preferredSlot: (nextSlot + i) % availableSlots,
                    doNotTrack: true,
                });
            }
        } else {
            for (let i = 0; i < payload.items.length; ++i) {
                payload.outItems.push({
                    item: payload.items[i].item,
                    preferredSlot: (nextSlot + i) % availableSlots,
                    doNotTrack: true,
                });
            }
        }

        return true;
    }

    process_BALANCER(payload) {
        assert(
            payload.entity.components.ItemEjector,
            "To be a balancer, the building needs to have an ejector"
        );
        const availableSlots = payload.entity.components.ItemEjector.slots.length;
        const processorComp = payload.entity.components.ItemProcessor;

        const nextSlot = processorComp.nextOutputSlot++ % availableSlots;

        for (let i = 0; i < payload.items.length; ++i) {
            payload.outItems.push({
                item: payload.items[i].item,
                preferredSlot: (nextSlot + i) % availableSlots,
                doNotTrack: true,
            });
        }
        return true;
    }

    /**
     * @param {ProcessorImplementationPayload} payload
     */
    process_CUTTER(payload) {
        const inputItem = /** @type {ShapeItem} */ (payload.items[0].item);
        assert(inputItem instanceof ShapeItem, "Input for cut is not a shape");
        const inputDefinition = inputItem.definition;
        const rotation = payload.entity.components.StaticMapEntity.rotation;
        const cutDefinitions = this.root.shapeDefinitionMgr.shapeActionCutHalf(inputDefinition, rotation);

        for (let i = 0; i < cutDefinitions.length; ++i) {
            const definition = cutDefinitions[i];
            if (!definition.isEntirelyEmpty()) {
                payload.outItems.push({
                    item: this.root.shapeDefinitionMgr.getShapeItemFromDefinition(definition),
                    requiredSlot: i,
                });
            }
        }
    }

    /**
     * @param {ProcessorImplementationPayload} payload
     */
    process_CUTTER_QUAD(payload) {
        const inputItem = /** @type {ShapeItem} */ (payload.items[0].item);
        assert(inputItem instanceof ShapeItem, "Input for cut is not a shape");
        const inputDefinition = inputItem.definition;

        const cutDefinitions = this.root.shapeDefinitionMgr.shapeActionCutQuad(inputDefinition);

        for (let i = 0; i < cutDefinitions.length; ++i) {
            const definition = cutDefinitions[i];
            if (!definition.isEntirelyEmpty()) {
                payload.outItems.push({
                    item: this.root.shapeDefinitionMgr.getShapeItemFromDefinition(definition),
                    requiredSlot: i,
                });
            }
        }
    }

    process_CUTTER_LASER(payload) {
        const inputItem = /** @type {ShapeItem} */ (payload.items[0].item);
        assert(inputItem instanceof ShapeItem, "Input for cut is not a shape");
        const pinsComp = payload.entity.components.WiredPins;
        let wantedCorners = [0, 1, 2, 3];
        let unwantedCorners = [];
        for (let i = 0; i < 4; ++i) {
            const network = pinsComp.slots[i].linkedNetwork;
            const networkValue = network && network.hasValue() ? network.currentValue : null;
            if (networkValue && isTruthyItem(networkValue)) {
                wantedCorners.splice(i - 4 + wantedCorners.length, 1);
                unwantedCorners.push(i);
            }
        }
        const inputDefinition = inputItem.definition;
        const allDefinitons = this.root.shapeDefinitionMgr.shapeActionCutLaser(
            inputDefinition,
            wantedCorners,
            unwantedCorners
        );
        for (let i = 0; i < allDefinitons.length; ++i) {
            if (!allDefinitons[i].isEntirelyEmpty()) {
                payload.outItems.push({
                    item: this.root.shapeDefinitionMgr.getShapeItemFromDefinition(allDefinitons[i]),
                    requiredSlot: i,
                });
            }
        }
    }

    /**
     * @param {ProcessorImplementationPayload} payload
     */
    process_ROTATER(payload) {
        const inputItem = /** @type {ShapeItem} */ (payload.items[0].item);
        assert(inputItem instanceof ShapeItem, "Input for rotation is not a shape");
        const inputDefinition = inputItem.definition;

        const rotatedDefinition = this.root.shapeDefinitionMgr.shapeActionRotateCW(inputDefinition);
        payload.outItems.push({
            item: this.root.shapeDefinitionMgr.getShapeItemFromDefinition(rotatedDefinition),
        });
    }

    /**
     * @param {ProcessorImplementationPayload} payload
     */
    process_ROTATER_CCW(payload) {
        const inputItem = /** @type {ShapeItem} */ (payload.items[0].item);
        assert(inputItem instanceof ShapeItem, "Input for rotation is not a shape");
        const inputDefinition = inputItem.definition;

        const rotatedDefinition = this.root.shapeDefinitionMgr.shapeActionRotateCCW(inputDefinition);
        payload.outItems.push({
            item: this.root.shapeDefinitionMgr.getShapeItemFromDefinition(rotatedDefinition),
        });
    }

    /**
     * @param {ProcessorImplementationPayload} payload
     */
    process_ROTATER_180(payload) {
        const inputItem = /** @type {ShapeItem} */ (payload.items[0].item);
        assert(inputItem instanceof ShapeItem, "Input for rotation is not a shape");
        const inputDefinition = inputItem.definition;

        const rotatedDefinition = this.root.shapeDefinitionMgr.shapeActionRotate180(inputDefinition);
        payload.outItems.push({
            item: this.root.shapeDefinitionMgr.getShapeItemFromDefinition(rotatedDefinition),
        });
    }

    /**
     * @param {ProcessorImplementationPayload} payload
     */
    process_STACKER(payload) {
        const lowerItem = /** @type {ShapeItem} */ (payload.itemsBySlot[0]);
        const upperItem = /** @type {ShapeItem} */ (payload.itemsBySlot[1]);

        assert(lowerItem instanceof ShapeItem, "Input for lower stack is not a shape");
        assert(upperItem instanceof ShapeItem, "Input for upper stack is not a shape");

        const stackedDefinition = this.root.shapeDefinitionMgr.shapeActionStack(
            lowerItem.definition,
            upperItem.definition
        );
        payload.outItems.push({
            item: this.root.shapeDefinitionMgr.getShapeItemFromDefinition(stackedDefinition),
        });
    }

    /**
     * @param {ProcessorImplementationPayload} payload
     */
    process_SMART_STACKER(payload) {
        const mainItem = /** @type {ShapeItem} */ (payload.itemsBySlot[0]);
        const item1 = /** @type {ShapeItem} */ (payload.itemsBySlot[1]);
        const item2 = /** @type {ShapeItem} */ (payload.itemsBySlot[2]);
        const item3 = /** @type {ShapeItem} */ (payload.itemsBySlot[3]);

        assert(mainItem, "Must have a base item to stack with.");
        assert(item1 || item2 || item3, "Must have something to stack with.");

        const stackedDefinition = this.root.shapeDefinitionMgr.shapeActionSmartStack(
            mainItem.definition,
            item1 ? item1.definition : null,
            item2 ? item2.definition : null,
            item3 ? item3.definition : null
        );
        payload.outItems.push({
            item: this.root.shapeDefinitionMgr.getShapeItemFromDefinition(stackedDefinition),
        });
    }

    /**
     * @param {ProcessorImplementationPayload} payload
     */
    process_SHAPE_MERGER(payload) {
        const item1 = /** @type {ShapeItem} */ (payload.itemsBySlot[0]);
        const item2 = /** @type {ShapeItem} */ (payload.itemsBySlot[1]);

        assert(item1 instanceof ShapeItem, "Input for item 1 is not a shape");
        assert(item2 instanceof ShapeItem, "Input for item 2 is not a shape");

        const combinedDefinition = this.root.shapeDefinitionMgr.shapeActionMerge(
            item1.definition,
            item2.definition
        );
        payload.outItems.push({
            item: this.root.shapeDefinitionMgr.getShapeItemFromDefinition(combinedDefinition),
        });
    }

    /**
     * @param {ProcessorImplementationPayload} payload
     */
    process_TRASH(payload) {
        // Do nothing ..
    }

    /**
     * @param {ProcessorImplementationPayload} payload
     */
    process_MIXER(payload) {
        // Find both colors and combine them
        const item1 = /** @type {ColorItem} */ (payload.items[0].item);
        const item2 = /** @type {ColorItem} */ (payload.items[1].item);
        assert(item1 instanceof ColorItem, "Input for color mixer is not a color");
        assert(item2 instanceof ColorItem, "Input for color mixer is not a color");

        const color1 = item1.color;
        const color2 = item2.color;

        // Try finding mixer color, and if we can't mix it we simply return the same color
        const mixedColor = enumColorMixingResults[color1][color2];
        let resultColor = color1;
        if (mixedColor) {
            resultColor = mixedColor;
        }
        payload.outItems.push({
            item: COLOR_ITEM_SINGLETONS[resultColor],
        });
    }

    /**
     * @param {ProcessorImplementationPayload} payload
     */
    process_PAINTER(payload) {
        const shapeItem = /** @type {ShapeItem} */ (payload.itemsBySlot[0]);
        const colorItem = /** @type {ColorItem} */ (payload.itemsBySlot[1]);

        const colorizedDefinition = this.root.shapeDefinitionMgr.shapeActionPaintWith(
            shapeItem.definition,
            colorItem.color
        );

        payload.outItems.push({
            item: this.root.shapeDefinitionMgr.getShapeItemFromDefinition(colorizedDefinition),
        });
    }

    /**
     * @param {ProcessorImplementationPayload} payload
     */
    process_PAINTER_DOUBLE(payload) {
        const shapeItem1 = /** @type {ShapeItem} */ (payload.itemsBySlot[0]);
        const shapeItem2 = /** @type {ShapeItem} */ (payload.itemsBySlot[1]);
        const colorItem = /** @type {ColorItem} */ (payload.itemsBySlot[2]);

        assert(shapeItem1 instanceof ShapeItem, "Input for painter is not a shape");
        assert(shapeItem2 instanceof ShapeItem, "Input for painter is not a shape");
        assert(colorItem instanceof ColorItem, "Input for painter is not a color");

        const colorizedDefinition1 = this.root.shapeDefinitionMgr.shapeActionPaintWith(
            shapeItem1.definition,
            colorItem.color
        );

        const colorizedDefinition2 = this.root.shapeDefinitionMgr.shapeActionPaintWith(
            shapeItem2.definition,
            colorItem.color
        );
        payload.outItems.push({
            item: this.root.shapeDefinitionMgr.getShapeItemFromDefinition(colorizedDefinition1),
        });

        payload.outItems.push({
            item: this.root.shapeDefinitionMgr.getShapeItemFromDefinition(colorizedDefinition2),
        });
    }

    /**
     * @param {ProcessorImplementationPayload} payload
     */
    process_PAINTER_QUAD(payload) {
        const shapeItem = /** @type {ShapeItem} */ (payload.itemsBySlot[0]);
        assert(shapeItem instanceof ShapeItem, "Input for painter is not a shape");

        /** @type {Array<enumColors>} */
        const colors = [null, null, null, null];
        for (let i = 0; i < 4; ++i) {
            if (payload.itemsBySlot[i + 1]) {
                colors[i] = /** @type {ColorItem} */ (payload.itemsBySlot[i + 1]).color;
            }
        }

        const colorizedDefinition = this.root.shapeDefinitionMgr.shapeActionPaintWith4Colors(
            shapeItem.definition,
            /** @type {[string, string, string, string]} */ (colors)
        );

        payload.outItems.push({
            item: this.root.shapeDefinitionMgr.getShapeItemFromDefinition(colorizedDefinition),
        });
    }

    /**
     * @param {ProcessorImplementationPayload} payload
     */
    process_READER(payload) {
        // Pass through the item
        const item = payload.itemsBySlot[0];
        payload.outItems.push({
            item,
            doNotTrack: true,
        });

        // Track the item
        const readerComp = payload.entity.components.BeltReader;
        readerComp.lastItemTimes.push(this.root.time.now());
        readerComp.lastItem = item;
    }

    /**
     * @param {ProcessorImplementationPayload} payload
     */
    process_HUB(payload) {
        const hubComponent = payload.entity.components.Hub;
        assert(hubComponent, "Hub item processor has no hub component");

        for (let i = 0; i < payload.items.length; ++i) {
            const item = /** @type {ShapeItem} */ (payload.items[i].item);
            this.root.hubGoals.handleDefinitionDelivered(item.definition);
        }
    }
}
