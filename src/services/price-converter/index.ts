import {
  Exchange,
  Order,
  Orderbook,
  RawOrder,
  RawOrderbook,
} from "../../types";
import { BinanceConverterStrategy } from "./strategies/binance-converter.strategy";
import { IndodaxConverterStrategy } from "./strategies/indodax-converter.strategy";

/**
 * Interface for a price converter strategy.
 */
export interface ConverterStrategy {
  /**
   * Sets up the converter strategy.
   * @returns A promise that resolves when the setup is complete.
   */
  setup(): Promise<void>;

  /**
   * Modifies an array of raw orders.
   * @param order - The array of raw orders to modify.
   * @returns A promise that resolves with an array of modified orders.
   */
  modify(order: Array<RawOrder>): Promise<Array<Order>>;

  /**
   * Converts a raw orderbook to an orderbook.
   * @param orderbook - The raw orderbook to convert.
   * @returns A promise that resolves with the converted orderbook.
   */
  convert(orderbook: RawOrderbook): Promise<Orderbook>;
}

export class ConverterStrategyFactory {
  private strategies: Record<Exchange, ConverterStrategy> = {
    [Exchange.Binance]: new BinanceConverterStrategy(),
    [Exchange.Indodax]: new IndodaxConverterStrategy(),
  }

  async register(exchange: Exchange): Promise<void> {
    await this.strategies[exchange].setup();
  }

  get(exchange: Exchange): ConverterStrategy {
    return this.strategies[exchange];
  }
}