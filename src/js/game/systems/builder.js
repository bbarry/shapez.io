import trim from "trim";
import { THIRDPARTY_URLS } from "../../core/config";
import { DialogWithForm } from "../../core/modal_dialog_elements";
import { FormElementInput, FormElementItemChooser } from "../../core/modal_dialog_forms";
import { fillInLinkIntoTranslation } from "../../core/utils";
import { T } from "../../translations";
import { BaseItem } from "../base_item";
import { enumColors } from "../colors";
import { BuilderComponent } from "../components/builder";
import { ConstantSignalComponent } from "../components/constant_signal";
import { Entity } from "../entity";
import { GameSystemWithFilter } from "../game_system_with_filter";
import { BOOL_FALSE_SINGLETON, BOOL_TRUE_SINGLETON } from "../items/boolean_item";
import { COLOR_ITEM_SINGLETONS } from "../items/color_item";
import { MapChunkView } from "../map_chunk_view";
import { ShapeDefinition } from "../shape_definition";

export class BuilderSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [BuilderComponent]);
    }

    update() {
        for (const entity of this.allEntities) {
            const builderComp = entity.components.Builder;
            builderComp.addBuilder();
        }
    }

    /**
     * Draws a given chunk
     * @param {import("../../core/draw_utils").DrawParameters} parameters
     * @param {MapChunkView} chunk
     */
    drawChunk(parameters, chunk) {
        const contents = chunk.containedEntitiesByLayer.regular;
        for (const entity of contents) {
            const builderComp = entity.components.Builder;
            if (!builderComp) continue;

            const staticComp = entity.components.StaticMapEntity;
            const origin = staticComp.origin;

            for (const builder of builderComp.builders) {
                const pos = origin.add(builder).toWorldSpace();
                const w = 10;

                parameters.context.fillStyle = "yellow";
                parameters.context.fillRect(pos.x - w / 2, pos.y - w / 2, w, w);
            }
        }
        // for (let i = 0; i < contents.length; ++i) {
        //     const entity = contents[i];
        //     if (entity && entity.components.Display) {
        //         const pinsComp = entity.components.WiredPins;
        //         const network = pinsComp.slots[0].linkedNetwork;
        //         if (!network || !network.hasValue()) {
        //             continue;
        //         }
        //         const value = this.getDisplayItem(network.currentValue);
        //         if (!value) {
        //             continue;
        //         }
        //         const origin = entity.components.StaticMapEntity.origin;
        //         if (value.getItemType() === "color") {
        //             this.displaySprites[/** @type {ColorItem} */ (value).color].drawCachedCentered(
        //                 parameters,
        //                 (origin.x + 0.5) * globalConfig.tileSize,
        //                 (origin.y + 0.5) * globalConfig.tileSize,
        //                 globalConfig.tileSize
        //             );
        //         } else if (value.getItemType() === "shape") {
        //             value.drawItemCenteredClipped(
        //                 (origin.x + 0.5) * globalConfig.tileSize,
        //                 (origin.y + 0.5) * globalConfig.tileSize,
        //                 parameters,
        //                 30
        //             );
        //         }
        //     }
        // }
    }
}
