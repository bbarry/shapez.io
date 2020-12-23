import { globalConfig } from "../../core/config";
import { DrawParameters } from "../../core/draw_parameters";
import { gMetaBuildingRegistry } from "../../core/global_registries";
import { Loader } from "../../core/loader";
import { createLogger } from "../../core/logging";
import { AtlasSprite } from "../../core/sprites";
import { fastArrayDeleteValue } from "../../core/utils";
import { enumDirection, enumDirectionToVector, enumInvertedDirections, Vector } from "../../core/vector";
import { BeltPath } from "../belt_path";
import { arrayBeltVariantToRotation, MetaBeltBuilding } from "../buildings/belt";
import { getCodeFromBuildingData } from "../building_codes";
import { HyperlinkAcceptorComponent } from "../components/hyperlink_acceptor";
import { Entity } from "../entity";
import { GameSystemWithFilter } from "../game_system_with_filter";
import { MapChunkView } from "../map_chunk_view";
import { defaultBuildingVariant } from "../meta_building";

/**
 * Manages all hyperlinks
 */
export class HyperlinkSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [HyperlinkAcceptorComponent]);

        this.root.signals.entityDestroyed.add(this.updateSurroundingHyperlinkPlacement, this);

        // Notice: These must come *after* the entity destroyed signals
        this.root.signals.entityAdded.add(this.updateSurroundingHyperlinkPlacement, this);

    }

    updateSurroundingHyperlinkPlacement(entity) { // @HERE
        if (!this.root.gameInitialized) {
            return;
        }

        const staticComp = entity.components.StaticMapEntity;
        if (!staticComp) {
            return;
        }

        const metaHyperlink = gMetaBuildingRegistry.findByClass(MetaHyperlinkBuilding);
        // Compute affected area
        const originalRect = staticComp.getTileSpaceBounds();
        const affectedArea = originalRect.expandedInAllDirections(1);


        for (let x = affectedArea.x; x < affectedArea.right(); ++x) {
            for (let y = affectedArea.y; y < affectedArea.bottom(); ++y) {
                if (originalRect.containsPoint(x, y)) {
                    // Make sure we don't update the original entity
                    continue;
                }

                const targetEntities = this.root.map.getLayersContentsMultipleXY(x, y);
                for (let i = 0; i < targetEntities.length; ++i) {
                    const targetEntity = targetEntities[i];

                    const targetHyperlinkComp = targetEntity.components.HyperlinkAcceptor;
                    const targetStaticComp = targetEntity.components.StaticMapEntity;

                    if (!targetHyperlinkComp) {
                        // Not a hyperlink
                        continue;
                    }

                    const {
                        rotation,
                        rotationVariant,
                    } = metaHyperlink.computeOptimalDirectionAndRotationVariantAtTile({
                        root: this.root,
                        tile: new Vector(x, y),
                        rotation: targetStaticComp.originalRotation,
                        variant: defaultBuildingVariant,
                        layer: targetEntity.layer,
                    });

                    // Compute delta to see if anything changed
                    const newDirection = arrayBeltVariantToRotation[rotationVariant];

                    if (targetStaticComp.rotation !== rotation || newDirection !== targetHyperlinkComp.direction) {


                        // Change stuff
                        targetStaticComp.rotation = rotation;
                        metaHyperlink.updateVariants(targetEntity, rotationVariant, defaultBuildingVariant);

                        // Update code as well
                        targetStaticComp.code = getCodeFromBuildingData(
                            metaHyperlink,
                            defaultBuildingVariant,
                            rotationVariant
                        );

                        // Make sure the chunks know about the update
                        this.root.signals.entityChanged.dispatch(targetEntity);
                    }
                }
            }
        }
    }
}