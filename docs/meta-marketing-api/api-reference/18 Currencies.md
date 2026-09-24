<!-- Source: https://developers.facebook.com/documentation/ads-commerce/marketing-api/currencies | Saved: 2026-09-19 -->

# Currency codes



## Supported currencies

Marketing API supports all of the currencies supported by [ad accounts](https://developers.facebook.com/documentation/ads-commerce/marketing-api/reference/ad-account):

| Name | Code | Offset |
| --- | --- | --- |
| Algerian Dinar | DZD | 100 |
| Argentine Peso | ARS | 100 |
| Australian Dollar | AUD | 100 |
| Bahraini Dinar | BHD | 100 |
| Bangladeshi Taka | BDT | 100 |
| Bolivian Boliviano | BOB | 100 |
| Bulgarian Lev | BGN | 100 |
| Brazilian Real | BRL | 100 |
| British Pound | GBP | 100 |
| Canadian Dollar | CAD | 100 |
| Chilean Peso | CLP | 1 |
| Chinese Yuan | CNY | 100 |
| Colombian Peso | COP | 1 |
| Costa Rican Colón | CRC | 1 |
| Croatian Kuna | HRK | 100 |
| Czech Koruna | CZK | 100 |
| Danish Krone | DKK | 100 |
| Egyptian Pound | EGP | 100 |
| Euro | EUR | 100 |
| Guatemalan Quetzal | GTQ | 100 |
| Honduran Lempira | HNL | 100 |
| Hong Kong Dollar | HKD | 100 |
| Hungarian Forint | HUF | 1 |
| Iceland Krona | ISK | 1 |
| Indian Rupee | INR | 100 |
| Indonesian Rupiah | IDR | 1 |
| Israeli New Shekel | ILS | 100 |
| Japanese Yen | JPY | 1 |
| Jordanian Dinar | JOD | 100 |
| Kenyan Shilling | KES | 100 |
| Korean Won | KRW | 1 |
| Latvian Lats | LVL | 100 |
| Lithuanian Litas | LTL | 100 |
| Macau Patacas | MOP | 100 |
| Malaysian Ringgit | MYR | 100 |
| Mexican Peso | MXN | 100 |
| New Zealand Dollar | NZD | 100 |
| Nicaraguan Cordoba | NIO | 100 |
| Nigerian Naira | NGN | 100 |
| Norwegian Krone | NOK | 100 |
| Pakistani Rupee | PKR | 100 |
| Paraguayan Guarani | PYG | 1 |
| Peruvian Nuevo Sol | PEN | 100 |
| Philippine Peso | PHP | 100 |
| Polish Zloty | PLN | 100 |
| Qatari Rials | QAR | 100 |
| Romanian Leu | RON | 100 |
| Russian Ruble | RUB | 100 |
| Saudi Arabian Riyal | SAR | 100 |
| Serbian Dinar | RSD | 100 |
| Singapore Dollar | SGD | 100 |
| Slovak Koruna | SKK | 100 |
| South African Rand | ZAR | 100 |
| Swedish Krona | SEK | 100 |
| Swiss Franc | CHF | 100 |
| Taiwan Dollar | TWD | 1 |
| Thai Baht | THB | 100 |
| Turkish Lira | TRY | 100 |
| UAE Dirham | AED | 100 |
| Ukrainian Hryvnia | UAH | 100 |
| US Dollars | USD | 100 |
| Uruguay Peso | UYU | 100 |
| Venezuelan Bolivar | VEF | 100 |
| Vietnamese Dong | VND | 1 |
| credits | FBZ | 100 |
| Bolivar Soberano | VES | 100 |

## Offset

Each currency has an offset which specifies how the platform handles its subdivisions. The offset ensures the minimum bid, such as "1", is a usable value for the currency.

### Example offset 100
If a currency has an offset of 100 then the minimum bid equals 1/100 of the base currency unit. For example, if you place a bid of "1" on an ad account based on USD the bid will be 0.01 USD.

### Example offset 1
If a currency has an offset of 1 then the minimum bid equals one base currency unit. For example, if you place a bid of "1" on an ad account based on JPY the bid will be 1 JPY.
