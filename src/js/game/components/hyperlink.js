import { enumDirection, Vector } from "../../core/vector";
import { types } from "../../savegame/serialization";
import { BeltPath } from "../belt_path";
import { Component } from "../component";


export class HyperlinkComponent extends Component {
    static getId() {
        return "Hyperlink";
    }

    /**
     *
     * @param {object} param0
     * @param {enumDirection=} param0.direction The direction of the belt
     */
    constructor({ direction = enumDirection.top }) {
        super();

        this.direction = direction;

    }
}
