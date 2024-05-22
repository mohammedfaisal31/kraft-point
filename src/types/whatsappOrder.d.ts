interface Order {
    from: string;
    id: string;
    timestamp: string;
    type: string;
    order: {
        catalog_id: string;
        text: string;
        product_items: {
            product_retailer_id: string;
            quantity: number;
            item_price: number;
            currency: string;
        }[];
    };
}

interface Change {
    value: {
        messages: Order[];
    };
}

interface WhatsAppEntry {
    id: string;
    changes: Change[];
}

export default interface WhatsAppOrder {
    object: string;
    entry: WhatsAppEntry[];
}
