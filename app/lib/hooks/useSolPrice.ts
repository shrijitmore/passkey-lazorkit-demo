import { useState, useEffect } from 'react';

export function useSolPrice() {
    const [price, setPrice] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPrice = async () => {
            try {
                const response = await fetch(
                    'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd'
                );
                const data = await response.json();
                if (data.solana?.usd) {
                    setPrice(data.solana.usd);
                } else {
                    // Fallback if API fails or rate limited
                    setPrice(145.50);
                }
            } catch (error) {
                console.warn('Failed to fetch SOL price, using fallback:', error);
                setPrice(145.50); // Fallback price
            } finally {
                setIsLoading(false);
            }
        };

        fetchPrice();
        // Refresh every 5 minutes
        const interval = setInterval(fetchPrice, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    return { price, isLoading };
}
