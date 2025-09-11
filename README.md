
# Top Kart - Top Tier Starter (auto-fetch from Khronos samples)

This starter will auto-download a couple of reliable glTF models from the Khronos glTF Sample Models repo during `npm install`.

## Run locally
```
npm install
npm start
```
Open http://localhost:3000

## Notes
- The ToyCar and CesiumMilkTruck glb files are CC0/public sample models from Khronos. They are used as higher-quality placeholders for the kart model and props.
- If the fetch fails (network/CORS), the client falls back to simple geometry so the game still runs.
- To make the repo itself include large assets, download the glb files manually and put them into `public/assets/` before pushing to GitHub.
