import { Order, Orderbook, SearchResult } from "../types";

/**
  * SearchService is a class that searches for the first order that meets or exceeds the target amount.
  * @param target - The target amount to search for.
  * @returns SearchResult
  **/
export default class SearchService {
    private target: number;

    constructor(target: number) {
        this.target = target;
    }

    /**
      * Searches for the first order that meets or exceeds the target amount.
      * @param orderbook - An array of orders to search through.
      * @returns SearchResult
    * */
    public execute(orderbook: Orderbook): SearchResult {
        const [buyPrice, buyAmount] = this.search(orderbook.asks);
        const [sellPrice, sellAmount] = this.search(orderbook.bids);

        return { buyPrice, buyAmount, sellPrice, sellAmount };
    }


    /**
     * Searches for the first order that meets or exceeds the target amount.
     * @param orders - An array of orders to search through.
     * if the target amount is not reached, return zero on amount and price
     * if orderbook is empty, return zero on amount and price
     * @returns [totalAmount, currentPrice] from currentLoop
     */
    private search(orders: Array<Order>): Order {
        let [price, amount]: Order = [0, 0];
        if (!orders.length) return [price, amount];

        for (let idx = 0; idx < orders.length && amount < this.target; idx++) {
            const [currentPrice, currentAmount] = orders[idx];
            price = currentPrice;
            amount += currentAmount;
        }
        if (amount < this.target) return [0, 0];

        return [price, amount];
    }
}
