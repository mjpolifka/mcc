# Scryfall API Rules

1. Must have `User-Agent` header and `Accept` header.
	- `User-Agent` header must be accurate to usage context ([name of app]/[version] was recommended).
	- If accessing via JS in the browser, keep the browser's `User-Agent` intact.
	- `Accept` must be present, but can be generic.  For example, `Accept: */*` and `Accept: application/json;q=0.9,*/*;q=0.8` are both ok.
2. Insert 100ms of delay between requests sent to `api.scryfall.com` (10 requests per second on average).
	- Excessive requests will result in a `HTTP 429 Too Many Requests` status code.
	- Ignoring these `429`'s can result in a **temporary or permanent ban of the IP address**.
	- Continuously receiving rate limit warnings over a longer period, even if respecting them each time, can also result in a ban.
3. Cache the data for at least 24 hours.