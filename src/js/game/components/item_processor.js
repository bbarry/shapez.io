import { types } from "../../savegame/serialization";
import { BaseItem } from "../base_item";
import { Component } from "../component";

/** @enum {string} */
export const enumItemProcessorTypes = {
    hyperlink: "hyperlink",
    balancer: "balancer",
    cutter: "cutter",
    cutterQuad: "cutterQuad",
    cutterLaser: "cutterLaser",
    rotater: "rotater",
    rotaterCCW: "rotaterCCW",
    rotater180: "rotater180",
    stacker: "stacker",
    smartStacker: "smartStacker",
    shapeMerger: "shapeMerger",
    trash: "trash",
    mixer: "mixer",
    painter: "painter",
    painterDouble: "painterDouble",
    painterQuad: "painterQuad",
    hub: "hub",
    filter: "filter",
    reader: "reader",
};

/** @enum {string} */
export const enumItemProcessorRequirements = {
    painterQuad: "painterQuad",
    shapeMerger: "shapeMerger",
    smartStacker: "smartStacker",
};

/** @typedef {{
 *  item: BaseItem,
 *  requiredSlot?: number,
 *  preferredSlot?: number
 * }} EjectorItemToEject */

/** @typedef {{
 *  remainingTime: number,
 *  items: Array<EjectorItemToEject>,
 * }} EjectorCharge */

export class ItemProcessorComponent extends Component {
    static getId() {
        return "ItemProcessor";
    }

    static getSchema() {
        return {
            nextOutputSlot: types.uint,
        };
    }

    /**
     *
     * @param {object} param0
     * @param {enumItemProcessorTypes=} param0.processorType Which type of processor this is
     * @param {enumItemProcessorRequirements=} param0.processingRequirement Applied processing requirement
     * @param {number=} param0.inputsToProcess How many items this machine needs until it can start working
     * @param {number=} param0.chargesPerInput How many items this machine outputs with each charge
     * @param {boolean=} param0.makeCharges Whether or not to instantly output to required slots with no processing
     *
     */
    constructor({
        processorType = enumItemProcessorTypes.balancer,
        processingRequirement = null,
        inputsToProcess = 1,
        makeCharges = true,
        fixedOutput = false,
    }) {
        super();

        // Which slot to emit next, this is only a preference and if it can't emit
        // it will take the other one. Some machines ignore this (e.g. the balancer) to make
        // sure the outputs always match
        this.nextOutputSlot = 0;

        // Type of the processor
        this.type = processorType;

        // Type of processing requirement
        this.processingRequirement = processingRequirement;

        // How many inputs we need for one charge
        this.inputsToProcess = inputsToProcess;

        /**
         * Our current inputs
         * @type {Array<{ item: BaseItem, sourceSlot: number }>}
         */
        this.inputSlots = [];

        /**
         * Whether or not to make charges
         * @type {Array<Array<{ item: BaseItem, sourceSlot: number }>>}
         */
        this.currentItems = [];

        /**
         * What we are currently processing, empty if we don't produce anything rn
         * requiredSlot: Item *must* be ejected on this slot
         * preferredSlot: Item *can* be ejected on this slot, but others are fine too if the one is not usable
         * @type {Array<EjectorCharge>}
         */
        this.ongoingCharges = [];

        /**
         * How much processing time we have left from the last tick
         * @type {number}
         */
        this.bonusTime = 0;

        /**
         * Whether or not to make charges
         * @type {boolean}
         */
        this.makeCharges = makeCharges;
    }

    /**
     * Tries to take the item
     * @param {BaseItem} item
     * @param {number} sourceSlot
     */
    tryTakeItem(item, sourceSlot) {
        if (this.type === enumItemProcessorTypes.hub || this.type === enumItemProcessorTypes.trash) {
            // Hub has special logic .. not really nice but efficient.
            this.inputSlots.push({ item, sourceSlot });
            return true;
        }

        // Check that we only take one item per slot
        for (let i = 0; i < this.inputSlots.length; ++i) {
            const slot = this.inputSlots[i];
            if (slot.sourceSlot === sourceSlot) {
                return false;
            }
        }

        this.inputSlots.push({ item, sourceSlot });
        return true;
    }
}
