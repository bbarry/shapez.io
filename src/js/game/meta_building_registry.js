import { gMetaBuildingRegistry } from "../core/global_registries";
import { createLogger } from "../core/logging";
import { T } from "../translations";
import { MetaAnalyzerBuilding } from "./buildings/analyzer";
import { enumBalancerVariants, MetaBalancerBuilding } from "./buildings/balancer";
import { enumBeltCrossingVariants, MetaBeltCrossingBuilding } from "./buildings/belt_crossing";
import { MetaBeltBuilding } from "./buildings/belt";
import { MetaComparatorBuilding } from "./buildings/comparator";
import { MetaConstantSignalBuilding } from "./buildings/constant_signal";
import { enumCutterVariants, MetaCutterBuilding } from "./buildings/cutter";
import { MetaDisplayBuilding } from "./buildings/display";
import { MetaFilterBuilding } from "./buildings/filter";
import { MetaHubBuilding } from "./buildings/hub";
import { enumHyperlinkVariants, MetaHyperlinkBuilding } from "./buildings/hyperlink";
import { MetaItemProducerBuilding } from "./buildings/item_producer";
import { MetaLeverBuilding } from "./buildings/lever";
import { enumLogicGateVariants, MetaLogicGateBuilding } from "./buildings/logic_gate";
import { enumMinerVariants, MetaMinerBuilding } from "./buildings/miner";
import { MetaMixerBuilding } from "./buildings/mixer";
import { enumPainterVariants, MetaPainterBuilding } from "./buildings/painter";
import { MetaReaderBuilding } from "./buildings/reader";
import { enumRotaterVariants, MetaRotaterBuilding } from "./buildings/rotater";
import { enumStackerVariants, MetaStackerBuilding } from "./buildings/stacker";
import { MetaShapeCombinerBuilding } from "./buildings/shape_combiner";
import { MetaStorageBuilding, enumStorageVariants } from "./buildings/storage";
import { enumTransistorVariants, MetaTransistorBuilding } from "./buildings/transistor";
import { MetaTrashBuilding } from "./buildings/trash";
import { enumUndergroundBeltVariants, MetaUndergroundBeltBuilding } from "./buildings/underground_belt";
import { enumVirtualProcessorVariants, MetaVirtualProcessorBuilding } from "./buildings/virtual_processor";
import { MetaWireBuilding } from "./buildings/wire";
import { MetaWireTunnelBuilding } from "./buildings/wire_tunnel";
import { buildBuildingCodeCache, gBuildingVariants, registerBuildingVariant } from "./building_codes";
import { enumWireVariant } from "./components/wire";
import { KEYMAPPINGS } from "./key_action_mapper";
import { defaultBuildingVariant } from "./meta_building";

const logger = createLogger("building_registry");

export function initMetaBuildingRegistry() {
    gMetaBuildingRegistry.register(MetaHyperlinkBuilding);
    gMetaBuildingRegistry.register(MetaBalancerBuilding);
    gMetaBuildingRegistry.register(MetaBeltCrossingBuilding);
    gMetaBuildingRegistry.register(MetaMinerBuilding);
    gMetaBuildingRegistry.register(MetaCutterBuilding);
    gMetaBuildingRegistry.register(MetaRotaterBuilding);
    gMetaBuildingRegistry.register(MetaStackerBuilding);
    gMetaBuildingRegistry.register(MetaShapeCombinerBuilding);
    gMetaBuildingRegistry.register(MetaMixerBuilding);
    gMetaBuildingRegistry.register(MetaPainterBuilding);
    gMetaBuildingRegistry.register(MetaTrashBuilding);
    gMetaBuildingRegistry.register(MetaStorageBuilding);
    gMetaBuildingRegistry.register(MetaBeltBuilding);
    gMetaBuildingRegistry.register(MetaUndergroundBeltBuilding);
    gMetaBuildingRegistry.register(MetaHubBuilding);
    gMetaBuildingRegistry.register(MetaWireBuilding);
    gMetaBuildingRegistry.register(MetaConstantSignalBuilding);
    gMetaBuildingRegistry.register(MetaLogicGateBuilding);
    gMetaBuildingRegistry.register(MetaLeverBuilding);
    gMetaBuildingRegistry.register(MetaFilterBuilding);
    gMetaBuildingRegistry.register(MetaWireTunnelBuilding);
    gMetaBuildingRegistry.register(MetaDisplayBuilding);
    gMetaBuildingRegistry.register(MetaVirtualProcessorBuilding);
    gMetaBuildingRegistry.register(MetaReaderBuilding);
    gMetaBuildingRegistry.register(MetaTransistorBuilding);
    gMetaBuildingRegistry.register(MetaAnalyzerBuilding);
    gMetaBuildingRegistry.register(MetaComparatorBuilding);
    gMetaBuildingRegistry.register(MetaItemProducerBuilding);

    // Belt
    registerBuildingVariant(1, MetaBeltBuilding, defaultBuildingVariant, 0);
    registerBuildingVariant(2, MetaBeltBuilding, defaultBuildingVariant, 1);
    registerBuildingVariant(3, MetaBeltBuilding, defaultBuildingVariant, 2);

    // Belt Crossing
    registerBuildingVariant(71, MetaBeltCrossingBuilding);
    registerBuildingVariant(74, MetaBeltCrossingBuilding, enumBeltCrossingVariants.corner);
    registerBuildingVariant(75, MetaBeltCrossingBuilding, enumBeltCrossingVariants.switcher);

    // Balancer
    registerBuildingVariant(4, MetaBalancerBuilding);
    registerBuildingVariant(62, MetaBalancerBuilding, enumBalancerVariants.mergerTriple, 0);
    registerBuildingVariant(76, MetaBalancerBuilding, enumBalancerVariants.mergerTriple, 1);
    registerBuildingVariant(77, MetaBalancerBuilding, enumBalancerVariants.mergerTriple, 2);
    registerBuildingVariant(78, MetaBalancerBuilding, enumBalancerVariants.mergerTriple, 3);
    registerBuildingVariant(79, MetaBalancerBuilding, enumBalancerVariants.mergerTriple, 4);
    registerBuildingVariant(63, MetaBalancerBuilding, enumBalancerVariants.splitterTriple, 0);
    registerBuildingVariant(80, MetaBalancerBuilding, enumBalancerVariants.splitterTriple, 1);
    registerBuildingVariant(81, MetaBalancerBuilding, enumBalancerVariants.splitterTriple, 2);
    registerBuildingVariant(82, MetaBalancerBuilding, enumBalancerVariants.splitterTriple, 3);
    registerBuildingVariant(83, MetaBalancerBuilding, enumBalancerVariants.splitterTriple, 4);

    // Miner
    registerBuildingVariant(7, MetaMinerBuilding);
    registerBuildingVariant(8, MetaMinerBuilding, enumMinerVariants.chainable);
    registerBuildingVariant(69, MetaMinerBuilding, enumMinerVariants.deep);

    // Cutter
    registerBuildingVariant(9, MetaCutterBuilding);
    registerBuildingVariant(10, MetaCutterBuilding, enumCutterVariants.quad);
    registerBuildingVariant(70, MetaCutterBuilding, enumCutterVariants.laser);

    // Rotater
    registerBuildingVariant(11, MetaRotaterBuilding);
    registerBuildingVariant(12, MetaRotaterBuilding, enumRotaterVariants.ccw);
    registerBuildingVariant(13, MetaRotaterBuilding, enumRotaterVariants.rotate180);

    // Stacker
    registerBuildingVariant(14, MetaStackerBuilding);
    registerBuildingVariant(84, MetaStackerBuilding, enumStackerVariants.smart);

    // Shape Combiner
    registerBuildingVariant(73, MetaShapeCombinerBuilding);

    // Mixer
    registerBuildingVariant(15, MetaMixerBuilding);

    // Painter
    registerBuildingVariant(16, MetaPainterBuilding);
    registerBuildingVariant(17, MetaPainterBuilding, enumPainterVariants.mirrored);
    registerBuildingVariant(18, MetaPainterBuilding, enumPainterVariants.double);
    registerBuildingVariant(19, MetaPainterBuilding, enumPainterVariants.quad);

    // Trash
    registerBuildingVariant(20, MetaTrashBuilding);

    // Storage
    registerBuildingVariant(21, MetaStorageBuilding);
    registerBuildingVariant(72, MetaStorageBuilding, enumStorageVariants.mini);

    // Underground belt
    registerBuildingVariant(22, MetaUndergroundBeltBuilding, defaultBuildingVariant, 0);
    registerBuildingVariant(23, MetaUndergroundBeltBuilding, defaultBuildingVariant, 1);
    registerBuildingVariant(24, MetaUndergroundBeltBuilding, enumUndergroundBeltVariants.tier2, 0);
    registerBuildingVariant(25, MetaUndergroundBeltBuilding, enumUndergroundBeltVariants.tier2, 1);
    registerBuildingVariant(85, MetaUndergroundBeltBuilding, enumUndergroundBeltVariants.smart, 0);
    registerBuildingVariant(86, MetaUndergroundBeltBuilding, enumUndergroundBeltVariants.smart, 1);
    registerBuildingVariant(87, MetaUndergroundBeltBuilding, enumUndergroundBeltVariants.smart, 2);
    registerBuildingVariant(88, MetaUndergroundBeltBuilding, enumUndergroundBeltVariants.smart, 3);
    registerBuildingVariant(89, MetaUndergroundBeltBuilding, enumUndergroundBeltVariants.smart, 4);
    registerBuildingVariant(90, MetaUndergroundBeltBuilding, enumUndergroundBeltVariants.smart, 5);

    // Hub
    registerBuildingVariant(26, MetaHubBuilding);

    // Hyperlink
    registerBuildingVariant(64, MetaHyperlinkBuilding, defaultBuildingVariant, 0);
    registerBuildingVariant(65, MetaHyperlinkBuilding, defaultBuildingVariant, 1);
    registerBuildingVariant(66, MetaHyperlinkBuilding, defaultBuildingVariant, 2);
    registerBuildingVariant(67, MetaHyperlinkBuilding, enumHyperlinkVariants.hyperlinkEntrance);
    registerBuildingVariant(68, MetaHyperlinkBuilding, enumHyperlinkVariants.hyperlinkExit);

    // Wire
    registerBuildingVariant(27, MetaWireBuilding, defaultBuildingVariant, 0);
    registerBuildingVariant(28, MetaWireBuilding, defaultBuildingVariant, 1);
    registerBuildingVariant(29, MetaWireBuilding, defaultBuildingVariant, 2);
    registerBuildingVariant(30, MetaWireBuilding, defaultBuildingVariant, 3);

    registerBuildingVariant(52, MetaWireBuilding, enumWireVariant.second, 0);
    registerBuildingVariant(53, MetaWireBuilding, enumWireVariant.second, 1);
    registerBuildingVariant(54, MetaWireBuilding, enumWireVariant.second, 2);
    registerBuildingVariant(55, MetaWireBuilding, enumWireVariant.second, 3);

    // Constant signal
    registerBuildingVariant(31, MetaConstantSignalBuilding);

    // Logic gate
    registerBuildingVariant(32, MetaLogicGateBuilding);
    registerBuildingVariant(34, MetaLogicGateBuilding, enumLogicGateVariants.not);
    registerBuildingVariant(35, MetaLogicGateBuilding, enumLogicGateVariants.xor);
    registerBuildingVariant(36, MetaLogicGateBuilding, enumLogicGateVariants.or);

    // Transistor
    registerBuildingVariant(38, MetaTransistorBuilding, defaultBuildingVariant);
    registerBuildingVariant(60, MetaTransistorBuilding, enumTransistorVariants.mirrored);

    // Lever
    registerBuildingVariant(33, MetaLeverBuilding);

    // Filter
    registerBuildingVariant(37, MetaFilterBuilding);

    // Wire tunnel
    registerBuildingVariant(39, MetaWireTunnelBuilding);

    // Display
    registerBuildingVariant(40, MetaDisplayBuilding);

    // Virtual Processor
    registerBuildingVariant(42, MetaVirtualProcessorBuilding);
    registerBuildingVariant(44, MetaVirtualProcessorBuilding, enumVirtualProcessorVariants.rotater);
    registerBuildingVariant(45, MetaVirtualProcessorBuilding, enumVirtualProcessorVariants.unstacker);
    registerBuildingVariant(50, MetaVirtualProcessorBuilding, enumVirtualProcessorVariants.stacker);
    registerBuildingVariant(51, MetaVirtualProcessorBuilding, enumVirtualProcessorVariants.painter);

    // Analyzer
    registerBuildingVariant(46, MetaComparatorBuilding);
    registerBuildingVariant(43, MetaAnalyzerBuilding);

    // Reader
    registerBuildingVariant(49, MetaReaderBuilding);

    // Item producer
    registerBuildingVariant(61, MetaItemProducerBuilding);

    // Propagate instances
    for (const key in gBuildingVariants) {
        gBuildingVariants[key].metaInstance = gMetaBuildingRegistry.findByClass(
            gBuildingVariants[key].metaClass
        );
    }

    for (const key in gBuildingVariants) {
        const variant = gBuildingVariants[key];
        assert(variant.metaClass, "Variant has no meta: " + key);

        if (typeof variant.rotationVariant === "undefined") {
            variant.rotationVariant = 0;
        }
        if (typeof variant.variant === "undefined") {
            variant.variant = defaultBuildingVariant;
        }
    }

    // Check for valid keycodes
    if (G_IS_DEV) {
        gMetaBuildingRegistry.entries.forEach(metaBuilding => {
            const id = metaBuilding.getId();
            if (!["hub"].includes(id)) {
                if (!KEYMAPPINGS.buildings[id]) {
                    assertAlways(
                        false,
                        "Building " + id + " has no keybinding assigned! Add it to key_action_mapper.js"
                    );
                }

                if (!T.buildings[id]) {
                    assertAlways(false, "Translation for building " + id + " missing!");
                }

                if (!T.buildings[id].default) {
                    assertAlways(false, "Translation for building " + id + " missing (default variant)!");
                }
            }
        });
    }

    logger.log("Registered", gMetaBuildingRegistry.getNumEntries(), "buildings");
    logger.log("Registered", Object.keys(gBuildingVariants).length, "building codes");
}

/**
 * Once all sprites are loaded, propagates the cache
 */
export function initBuildingCodesAfterResourcesLoaded() {
    logger.log("Propagating sprite cache");
    for (const key in gBuildingVariants) {
        const variant = gBuildingVariants[key];

        variant.sprite = variant.metaInstance.getSprite(variant.rotationVariant, variant.variant);
        variant.blueprintSprite = variant.metaInstance.getBlueprintSprite(
            variant.rotationVariant,
            variant.variant
        );
        variant.silhouetteColor = variant.metaInstance.getSilhouetteColor(
            variant.variant,
            variant.rotationVariant
        );
    }

    // Update caches
    buildBuildingCodeCache();
}
