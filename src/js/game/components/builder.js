import { Vector } from "../../core/vector";
import { types } from "../../savegame/serialization";
import { Component } from "../component";

export class BuilderComponent extends Component {
    static getId() {
        return "Builder";
    }

    static getSchema() {
        return {
            builders: types.array(types.vector),
        };
    }

    constructor() {
        super();

        this.maxBuilders = 1;

        /**
         * Array of builders
         * @type {Array<Vector>}
         */
        this.builders = [];
    }

    addBuilder() {
        if (this.builders.length >= this.maxBuilders) return;
        this.builders.push(new Vector(0, 0));
    }
}
