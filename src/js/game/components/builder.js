import { textSpanIntersectsWithPosition } from "typescript";
import { globalConfig } from "../../core/config";
import { Vector } from "../../core/vector";
import { types } from "../../savegame/serialization";
import { registerBuildingVariant } from "../building_codes";
import { Component } from "../component";
import { Entity } from "../entity";
import { GameRoot } from "../root";
import { StaticMapEntityComponent } from "./static_map_entity";

class Builder extends Vector {
    /**
     * @param {GameRoot} root
     * @param {number} x
     * @param {number} y
     */
    constructor(root, x, y) {
        super(x, y);
        this.root = root;

        this.startingPos = new Vector(x, y);

        /**
         * @type {Entity}
         */
        this.tracing;

        /**
         * @type {Vector}
         */
        this.tracingPos;

        this.vel = new Vector();
        this.acc = new Vector();
    }

    update() {
        const tracing = this.tracing ? this.tracingPos : this.startingPos;
        const mag = this.tracing ? 0.4 : 0.4;
        const limit = this.tracing ? 2.5 : 1;
        const pos = tracing.subScalars(this.x, this.y);
        const norm = pos.normalize();
        this.acc = norm.multiplyScalar(mag);

        this.vel.addInplace(this.acc);

        if (this.vel.x > limit) this.vel.x = limit;
        if (this.vel.y > limit) this.vel.y = limit;

        this.x += this.vel.x;
        this.y += this.vel.y;

        if (!this.isWorking) return;

        const staticComp = this.tracing.components.StaticMapEntity;
        if (staticComp.isBlueprint) {
            const tickRate = this.root.dynamicTickrate.currentTickRate;
            staticComp.buildingProgress += 1 / tickRate;
            if (!staticComp.isBlueprint) {
                this.root.signals.entityAdded.dispatch(this.tracing);
                this.resetTracing();
            }
        }
    }

    get isWorking() {
        if (!this.tracing) return false;
        const staticComp = this.tracing.components.StaticMapEntity;
        assert(staticComp.isBlueprint, "Trying to build not blueplan building!");

        const tileSize = globalConfig.tileSize;
        const rect = staticComp.getTileSpaceBounds().allScaled(tileSize);
        return rect.containsPoint(this.x, this.y);
    }

    /**
     * Tries to trace entity
     * @param {Entity} blueplan
     */
    tryTracing(blueplan) {
        if (this.tracing) return false;

        const staticComp = blueplan.components.StaticMapEntity;
        const center = staticComp.getTileSpaceBounds().getCenter().toWorldSpace();
        this.tracing = blueplan;
        this.tracingPos = center.copy();

        return true;
    }

    /**
     * Resets traced entity
     */
    resetTracing() {
        this.tracing = null;
        this.tracingPos = null;
    }
}

export class BuilderComponent extends Component {
    static getId() {
        return "Builder";
    }

    // static getSchema() {
    //     return {
    //         builders: types.array(types.vector),
    //     };
    // }

    constructor() {
        super();

        this.maxBuilders = 1;

        /**
         * Array of builders
         * @type {Array<Builder>}
         */
        this.builders = [];
    }

    /**
     * Adds new builder
     * @param {GameRoot} root
     * @param {StaticMapEntityComponent} staticComp
     */
    addBuilder(root, staticComp) {
        if (this.builders.length >= this.maxBuilders) return;
        const origin = staticComp.origin.toWorldSpace();
        const tileSize = staticComp.getTileSize().toWorldSpace();
        const center = origin.addScalars(tileSize.x / 2, tileSize.y / 2);
        this.builders.push(new Builder(root, center.x, center.y));
    }

    updateBuilders() {
        for (const builder of this.builders) {
            builder.update();
        }
    }

    /**
     * @param {Entity} blueplan
     * @returns {Boolean}
     */
    tryTracingBlueplan(blueplan) {
        const staticComp = blueplan.components.StaticMapEntity;
        assert(staticComp.isBlueprint, "Trying to build not blueplan building!");

        for (const builder of this.builders) {
            if (builder.tryTracing(blueplan)) return true;
        }

        return false;
    }
}
