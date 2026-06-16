// Data fixture used before REST/WS data arrives.
// Replace with real API data as the backend matures.
import type { Trade, EquityPoint } from "@/lib/types";

export const TRADES_SEED: Trade[] = [
  { id:1, entry:"Jan 18", exit:"Feb 12", qty:2500, buy:10.84, sell:12.10, net: 3025, pct: 11.17, reason:"signal"     },
  { id:2, entry:"Feb 28", exit:"Mar 15", qty:2000, buy:11.96, sell:11.42, net:-1144, pct: -4.57, reason:"trail_stop" },
  { id:3, entry:"Mar 28", exit:"May 03", qty:2500, buy:11.88, sell:13.52, net: 3900, pct: 13.10, reason:"signal"     },
  { id:4, entry:"May 22", exit:"Jun 07", qty:2000, buy:13.10, sell:12.64, net: -988, pct: -3.56, reason:"trail_stop" },
  { id:5, entry:"Jun 28", exit:"Aug 14", qty:2500, buy:12.44, sell:14.87, net: 5775, pct: 18.44, reason:"signal"     },
  { id:6, entry:"Sep 09", exit:null,     qty:2500, buy:14.82, sell:null,  net: null, pct:  null, reason:"open"       },
];

export const KPI_SEED = [
  { label:"Total return",  value:"+18.73%", pos:true  },
  { label:"Ann. return",   value:"+22.41%", pos:true  },
  { label:"Sharpe ratio",  value:"1.82",    neu:true  },
  { label:"Max drawdown",  value:"-7.84%",  pos:false },
  { label:"Win rate",      value:"66.7%",   neu:true  },
  { label:"Profit factor", value:"2.41",    neu:true  },
  { label:"Total trades",  value:"6",       neu:true  },
  { label:"Buy & hold",    value:"+12.30%", pos:true  },
];

export const BT_STATS: [string, string, boolean | null][] = [
  ["Total return", "+43.2%", true ], ["Ann. return",   "+12.7%", true ],
  ["Ann. vol",     "18.4%",  null ], ["Sharpe",        "0.52",   null ],
  ["Max drawdown", "-18.2%", false], ["Total trades",  "14",     null ],
  ["Win rate",     "64.3%",  null ], ["Avg win",       "+12.4%", true ],
  ["Avg loss",     "-5.1%",  false], ["Profit factor", "2.18",   null ],
  ["Buy & hold",   "+22.1%", null ], ["Capital",       "HK$500K",null ],
];