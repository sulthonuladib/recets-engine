export type BinanceRawOrder = [string, string];
export type BinanceRawOrderbook = {
    lastUpdateId: number;
    bids: BinanceRawOrder[];
    asks: BinanceRawOrder[];
}

export type IndodaxRawOrder = {
    order: number;
    price: number;
}
export type IndodaxRawOrderbook = {
    ask: IndodaxRawOrder[];
    bid: IndodaxRawOrder[];
}

export type RawOrder = BinanceRawOrder | IndodaxRawOrder
export type RawOrderbook = BinanceRawOrderbook | IndodaxRawOrderbook

export type Order  = [number, number];
export type Orderbook = {
    bids: Order[],
    asks: Order[],
}

export type SearchResult = {
    buyPrice: number;
    buyAmount: number;
    sellPrice: number;
    sellAmount: number;
};

export type SearchPayload = {
    coin: string;
    exchange: Exchange;
    orderbook: Orderbook
}

export enum Exchange {
    Binance = "binance",
    Indodax = "indodax",
}

