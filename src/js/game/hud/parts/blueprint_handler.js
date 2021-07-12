import { BaseHUDPart } from "../base_hud_part";
import { HubComponent } from "../../components/hub";
import { Entity } from "../../entity";
import { DrawParameters } from "../../../core/draw_parameters";
import { globalConfig } from "../../../core/config";
import { THEME } from "../../theme";

export class HUDBlueprintHandler extends BaseHUDPart {
    initialize() {
        /**
         * Array of blueprints to update all per tick
         * @type {Set<Entity>}
         */
        this.avaibleBlueprints = new Set();

        /**
         * Array of all avaible blueprints to draw building progress bars
         * @type {Set<Entity>}
         */
        this.allBlueprints = new Set();

        /**
         * Array of blueprints to update all per tick
         * @type {Set<Entity>}
         */
        this.builders = new Set();

        this.initializeBindings();
    }

    initializeBindings() {
        this.root.signals.entityManuallyPlaced.add(this.onEntityManuallyPlaced, this);
        this.root.signals.entityAdded.add(this.onEntityAdded, this);
        this.root.signals.entityQueuedForDestroy.add(this.onEntityDestroyed, this);
    }

    /**
     * Callback when an entity got placed, used to remove belts between underground belts
     * @param {Entity} entity
     */
    onEntityManuallyPlaced(entity) {
        const isBlueprint = entity.components.StaticMapEntity.isBlueprint;
        assert(isBlueprint, "Tried to add not blueprint building as blueprint !");
        this.avaibleBlueprints.add(entity);
        this.allBlueprints.add(entity);
    }

    /**
     * Called when an entity got added
     * @param {Entity} entity
     */
    onEntityAdded(entity) {
        const isBlueprint = entity.components.StaticMapEntity.isBlueprint;
        if (this.avaibleBlueprints.has(entity)) this.avaibleBlueprints.delete(entity);
        if (this.allBlueprints.has(entity)) this.allBlueprints.delete(entity);
        assert(!isBlueprint, "Tried to add blueprint as builder!");
        const builderComp = entity.components.Builder;
        if (builderComp) {
            this.builders.add(entity);
        }
    }

    /**
     * Handles the destroy callback and makes sure we clean our list
     * @param {Entity} entity
     */
    onEntityDestroyed(entity) {
        const builderComp = entity.components.Builder;
        const isBlueprint = entity.components.StaticMapEntity.isBlueprint;
        if (isBlueprint && this.allBlueprints.has(entity)) {
            this.avaibleBlueprints.delete(entity);
            assert(
                this.allBlueprints.has(entity),
                "Tried to delete blueprint from list but that builder doesn't exist on list"
            );
            this.allBlueprints.delete(entity);
            return;
        } else if (builderComp) {
            assert(
                this.builders.has(entity),
                "Tried to delete builder from list but that builder doesn't exist on list"
            );
            this.builders.delete(entity);
        }
    }

    update() {
        if (this.builders.size == 0) {
            // Add hubs to builders
            this.root.entityMgr.getAllWithComponent(HubComponent).forEach(e => {
                this.builders.add(e);
            });
        }

        for (const blueprint of this.avaibleBlueprints) {
            for (const builder of this.builders) {
                const builderComp = builder.components.Builder;
                if (builderComp.tryTracingBlueprint(blueprint)) {
                    this.avaibleBlueprints.delete(blueprint);
                    break;
                }
            }
        }
    }

    /**
     *
     * @param {DrawParameters} parameters
     */
    draw(parameters) {
        for (const entity of this.allBlueprints) {
            const staticComp = entity.components.StaticMapEntity;

            const ctx = parameters.context;

            const rect = staticComp.getTileSpaceBounds().allScaled(globalConfig.tileSize);
            const off = 1;
            const w = rect.w - 2 * off;
            const h = globalConfig.tileSize / 8;
            const x = rect.left() + off;
            const y = rect.bottom() - h;

            const duration = staticComp.getBuildingDuration();
            const progress = staticComp.buildingProgress;

            ctx.fillStyle = THEME.map.background;
            ctx.fillRect(x, y, w, h);

            ctx.fillStyle = THEME.map.zone.borderSolid;
            ctx.fillRect(x, y, (w / duration) * progress, h);

            ctx.lineWidth = THEME.items.outlineWidth;
            ctx.strokeStyle = THEME.items.outline;
            ctx.beginRoundedRect(x, y, w, h, 1);
            ctx.stroke();
        }
    }
}
