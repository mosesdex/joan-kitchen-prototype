# Photography credits

Every dish photograph in this prototype is served from the Unsplash CDN under the
[Unsplash licence](https://unsplash.com/license). The mapping from dish to photo lives in
[`src/data/images.ts`](../src/data/images.ts), which records the photographer for each image.

These are stand-in photographs chosen to communicate the layout and mood. **Before production,
replace every one of them with photography of the restaurant's own dishes** — the visual difference
between stock food photography and a restaurant's real plates is the single largest quality gap
between this prototype and a finished product.

To list the current photographers:

```bash
node -e "const {PHOTOS}=require('./src/data/images.ts');" # or simply read src/data/images.ts
```
