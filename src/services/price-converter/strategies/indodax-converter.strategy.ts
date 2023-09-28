import { ConverterStrategy } from "..";
import { IndodaxRawOrder, IndodaxRawOrderbook, Order, Orderbook } from "../../../types";

export class IndodaxConverterStrategy implements ConverterStrategy {
    setup(): Promise<void> {
        throw new Error("Method not implemented.");
    }
    modify(_order: IndodaxRawOrder[]): Promise<Order[]> {
        throw new Error("Method not implemented.");
    }
    convert(_orderbook: IndodaxRawOrderbook): Promise<Orderbook> {
        throw new Error("Method not implemented.");
    }
}
