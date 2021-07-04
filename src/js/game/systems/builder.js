import { DrawParameters } from "../../core/draw_parameters";
import { BuilderComponent } from "../components/builder";
import { GameSystemWithFilter } from "../game_system_with_filter";

export class BuilderSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [BuilderComponent]);
    }

    update() {
        for (const entity of this.allEntities) {
            const staticComp = entity.components.StaticMapEntity;
            const builderComp = entity.components.Builder;
            builderComp.addBuilder(this.root, staticComp);

            // const mouse = this.root.app.mousePosition;
            // const worldPos = this.root.camera.screenToWorld(mouse);

            // builderComp.traceBuilders(worldPos);
            builderComp.updateBuilders();
        }
    }

    /**
     * Draws all entities
     * @param {DrawParameters} parameters
     */
    draw(parameters) {
        for (const entity of this.allEntities) {
            const builderComp = entity.components.Builder;
            for (const builder of builderComp.builders) {
                const w = 10;

                parameters.context.fillStyle = "yellow";
                parameters.context.fillRect(builder.x - w / 2, builder.y - w / 2, w, w);
            }
        }
    }

    // /**
    //  * Draws a given chunk
    //  * @param {DrawParameters} parameters
    //  * @param {MapChunkView} chunk
    //  */
    // drawChunk(parameters, chunk) {
    //     const contents = chunk.containedEntitiesByLayer.regular;
    //     for (const entity of contents) {
    //         const builderComp = entity.components.Builder;
    //         if (!builderComp) continue;
    //         for (const pos of builderComp.builders) {
    //             const w = 10;

    //             parameters.context.fillStyle = "yellow";
    //             parameters.context.fillRect(pos.x - w / 2, pos.y - w / 2, w, w);
    //         }
    //     }
    // }
}
