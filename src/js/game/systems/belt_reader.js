import { GameSystemWithFilter } from "../game_system_with_filter";
import { BeltReaderComponent } from "../components/belt_reader";
import { globalConfig } from "../../core/config";
import { BOOL_TRUE_SINGLETON, BOOL_FALSE_SINGLETON } from "../items/boolean_item";

export class BeltReaderSystem extends GameSystemWithFilter {
    constructor(root) {
        super(root, [BeltReaderComponent]);
    }

    update() {
        /*
        potential ideas for new belt reader design:
        if every time an item acceptor took an item in it told it
        
        */
        const now = this.root.time.now();
        const minimumTimeForThroughput = now - 1;
        for (let i = 0; i < this.allEntities.length; ++i) {
            const entity = this.allEntities[i];

            const readerComp = entity.components.BeltReader;
            const pinsComp = entity.components.WiredPins;

            let interval = globalConfig.readerAnalyzeIntervalSeconds;
            if (readerComp.lastItemTimes.length < 5) {
                interval *= 4;
            }
            const minimumTime = now - interval;

            // Remove outdated items
            while (readerComp.lastItemTimes[0] < minimumTime) {
                readerComp.lastItemTimes.shift();
            }
            
            

            pinsComp.slots[1].value = readerComp.lastItem;
            if (readerComp.lastThroughput > 0.05) {
                pinsComp.slots[0].value = BOOL_TRUE_SINGLETON;
            } else {
                pinsComp.slots[0].value = BOOL_FALSE_SINGLETON;
                if (entity.components.ItemProcessor.ongoingCharges.length < 1 
                    && !(readerComp.lastItemTimes[readerComp.lastItemTimes.length - 1] || 0 > minimumTimeForThroughput)){
                    readerComp.lastItem = null;
                }
            }

            if (now - readerComp.lastThroughputComputation > 0.5) {
                // Compute throughput
                readerComp.lastThroughputComputation = now;

                let throughput = 0;
                if (readerComp.lastItemTimes.length < 2) {
                    throughput = 0;
                } else {
                    let averageSpacing = 0;
                    let averageSpacingNum = 0;
                    for (let i = 0; i < readerComp.lastItemTimes.length - 1; ++i) {
                        averageSpacing += readerComp.lastItemTimes[i + 1] - readerComp.lastItemTimes[i];
                        ++averageSpacingNum;
                    }

                    throughput = 1 / (averageSpacing / averageSpacingNum);
                    //const decimal = throughput - Math.floor(throughput);
                    //if (decimal > 0.8) {
                    //    throughput = Math.round(throughput);
                    //}
                }

                readerComp.lastThroughput = Math.min(globalConfig.beltSpeedItemsPerSecond * 23.9, throughput);
            }
        }
    }
}
