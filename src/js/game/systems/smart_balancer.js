import { gMetaBuildingRegistry } from "../../core/global_registries";
import { Vector } from "../../core/vector";
import { MetaBalancerBuilding, enumBalancerVariants } from "../buildings/balancer";
import { getCodeFromBuildingData } from "../building_codes";
import { SmartBalancerComponent } from "../components/smart_balancer";
import { GameSystemWithFilter } from "../game_system_with_filter";

/**
 * Manages all smart Balancers
 */
export class SmartBalancerSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [SmartBalancerComponent]);

        this.root.signals.entityDestroyed.add(this.updateSmartBalancerVariant, this);

        // Notice: These must come *after* the entity destroyed signals
        this.root.signals.entityAdded.add(this.updateSmartBalancerVariant, this);
    }

    updateSmartBalancerVariant(entity) {
        if (!this.root.gameInitialized) {
            return;
        }

        const staticComp = entity.components.StaticMapEntity;
        if (!staticComp) {
            return;
        }

        const metaSmartBalancer = gMetaBuildingRegistry.findByClass(MetaBalancerBuilding);
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

                    const targetBalancerComp = targetEntity.components.SmartBalancer;
                    const targetStaticComp = targetEntity.components.StaticMapEntity;

                    if (!targetBalancerComp) {
                        // Not a smart balancer
                        continue;
                    }

                    const {
                        rotation,
                        rotationVariant,
                    } = metaSmartBalancer.computeOptimalDirectionAndRotationVariantAtTile({
                        root: this.root,
                        tile: new Vector(x, y),
                        rotation: targetStaticComp.originalRotation,
                        variant: targetBalancerComp.variant,
                        layer: targetEntity.layer,
                    });

                    // Compute delta to see if anything changed

                    // Change stuff
                    metaSmartBalancer.updateVariants(
                        targetEntity,
                        rotationVariant,
                        targetBalancerComp.variant
                    );

                    // Update code as well
                    targetStaticComp.code = getCodeFromBuildingData(
                        metaSmartBalancer,
                        targetBalancerComp.variant,
                        rotationVariant
                    );

                    // Make sure the chunks know about the update
                    this.root.signals.entityChanged.dispatch(targetEntity);
                }
            }
        }
        const targetBalancerComp = entity.components.SmartBalancer;
        const targetStaticComp = entity.components.StaticMapEntity;

        if (!targetBalancerComp) {
            // Not a smart balancer
            return;
        }

        const {
            rotation,
            rotationVariant,
        } = metaSmartBalancer.computeOptimalDirectionAndRotationVariantAtTile({
            root: this.root,
            tile: new Vector(originalRect.x, originalRect.y),
            rotation: targetStaticComp.originalRotation,
            variant: targetBalancerComp.variant,
            layer: entity.layer,
        });
        // Change stuff
        metaSmartBalancer.updateVariants(entity, rotationVariant, targetBalancerComp.variant);

        // Update code as well
        targetStaticComp.code = getCodeFromBuildingData(
            metaSmartBalancer,
            targetBalancerComp.variant,
            rotationVariant
        );

        // Make sure the chunks know about the update
        this.root.signals.entityChanged.dispatch(entity);
    }
}
