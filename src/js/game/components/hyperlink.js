import { enumDirection } from "../../core/vector";
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
