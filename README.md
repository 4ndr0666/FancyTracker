# FancyTracker

A Chrome extension for monitoring `postMessage` listeners in web pages.

This is a Manifest V3-compatible adaptation of the original [postMessage-tracker](https://github.com/fransr/postMessage-tracker) by [Frans Rosén](https://twitter.com/fransrosen). The base logic and functionality still exists (at least it should work the same), although it has been *modernized* and built upon quite a lot.

## To-Do:
- Make extension blocklist customizable via UI settings...
- Fix a forced reload of the UI after applying custom highlight in certain scenarios - for now, just re-open the extension once if it does not apply instantly. Not a big deal.
- Rest should work fine, let me know otherwise.

## License

Based on original code by [Frans Rosén](https://twitter.com/fransrosen), adapted under the MIT License.
