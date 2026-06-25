import TradeHistoryView from "@/components/trades/TradeHistoryView";

// Extract dynamic query values from url
export default function TradeHistoryPage(
    {params} : {params:{symbol:string};}) 
{
    return <TradeHistoryView symbol={params.symbol}/>
}