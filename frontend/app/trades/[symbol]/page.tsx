import TradeHistoryView from "@/components/trades/TradeHistoryView";

// Extract dynamic query values from url
export default async function TradeHistoryPage(
    {params} : { params: Promise<{symbol:string}> }) 
{
    const { symbol } = await params;
    return <TradeHistoryView symbol={symbol}/>
}