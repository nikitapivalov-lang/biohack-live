# BioHack: совместный урок на Render

Сайт и сервер работают по одному HTTPS-адресу. Преподаватель создаёт комнату и отправляет одну ссылку ученикам. Доступны до 10 учеников, отдельные курсоры с именами и цветами, общие пометки и доска. Голос и видео — в отдельном приложении.

## Render Free

- Runtime: Node
- Build: npm ci --omit=dev --ignore-scripts --no-audit --no-fund
- Start: npm start
- Plan: Free
- Region: Frankfurt
- Health check: /health
- NODE_ENV: production

Если эти файлы находятся в подпапке render существующего репозитория, задайте Root Directory: render. Если в отдельном репозитории — оставьте Root Directory пустым.

Сервер слушает 0.0.0.0 и PORT от Render. WebSocket и браузерный модуль загружаются с того же адреса, без публичного Yjs-сервера и временного туннеля.

После простоя бесплатный сервис может просыпаться около минуты. Данные комнаты хранятся в памяти: после перезапуска пометки и сцена теряются. Доску можно скачать перед окончанием урока. Ссылка комнаты не является постоянным архивом занятий.

## Проверка

Локально: npm ci, затем npm test. Проверяются синхронизация 11 подключений, независимые курсоры и действия, общие штрихи, выход и повторное подключение, разделение комнат и скрытие исходных файлов сервера.

## BioHack heart viewer

The heart is served locally at `/assets/heart.glb`, with the bundled Three.js viewer at `/assets/heart-viewer.js`. No Sketchfab iframe, account or remote viewer is used. Both assets are explicitly allowlisted in `server.mjs`; other repository files remain private to the server.

Model: [Human heart with annotations](https://sketchfab.com/3d-models/human-heart-with-annotations-87b2af1ba9c2430e97921c1d54dc7db9) by eruwen, based on [marxtrax's heart](https://sketchfab.com/3d-models/human-heart-3d-model-5e442ad98b574fdf844432b246fcf323), CC BY 4.0. Geometry and textures are unchanged. Three.js r180 is MIT licensed; see `THREE-LICENSE.txt`.

The source is `heart-viewer-src.js`; the prebuilt bundle is committed, so deployment needs no extra build step. To rebuild with the pinned library version:

```sh
npm install --no-save --package-lock=false three@0.180.0
npx esbuild heart-viewer-src.js --bundle --minify --format=esm --target=es2020 --legal-comments=eof --outfile=heart-viewer.js
```

## 3D models in Пространство

The drawing board has an “Добавить 3D-модель” catalog. The first entry reuses the native heart viewer. `boardModelCatalog` registers the model name, description and lazy viewer factory; the board stores its placement under `@board-model` in the existing personal or shared drawing map. The current catalog places one heart on the board.

The model sits directly on the board with a transparent canvas, without a card, frame or separate background. Controls live in the board’s top panel. Choose Курсор or Вращать to rotate, or Переместить and drag the model to reposition it. Model ± changes its dimensions; board zoom moves and scales the model with the canvas. 3D-выноска, text and surface strokes use the same world-space annotation format as the anatomy lesson, isolated by the `board` drawing key. Removing the model preserves its annotations and supports undo. Export SVG includes a snapshot of the current model view with its 3D annotations. Cameras are local to each participant; model placement and annotations belong to the shared board.

The board viewer has 25% extra transparent 3D space on every side. A camera view offset preserves the heart's apparent size and existing world-space annotation geometry. The board-only controls toggle is a local preference and never hides another participant's controls.

## Inline text annotations

The text tool opens an inline textarea at the annotation's baseline using its SVG or 3D projection. Existing SVG text is temporarily replaced by the editor; 3D text renders a local live preview in the native viewer. Multiline text, color and font size update while typing. Clicking outside or switching tools commits once with undo; Escape cancels. Emptying an existing field deletes it with undo. Editing preserves anchors and both endpoints of 3D callouts, and checks for concurrent edits before committing.

## Ontogenesis: tissues and contraction

Anatomy includes the standalone «Ткани человека» lesson (`#lesson/tissues/main`) with `epithelium`, `atlas`, `skeletal` and `smooth` screens. Ontogenesis retains cross-links, and former ontogenesis tissue URLs redirect to the new lesson. The tissue overview links back to germ layers, compares four families and has five original EGE practice questions. Closed-by-default «Углублённо» details separate additional mechanisms from the core material. The atlas contains six embedded histology photographs, author/license credits, reading cues and an enlarged zoomable view. Skeletal and smooth contraction have separate interactive five-stage animations. See `HISTOLOGY-SOURCES.md` for references and image provenance; `histology-test.mjs` checks morphology, sources, controls and constant skeletal filament lengths.

## Cellular embryogenesis sections

Gastrulation uses a continuous tiled epithelial sheet, with nuclei and shared cell edges, to show invagination in the lancelet teaching model. Play/pause, three checkpoints, reset and a continuous slider reveal the diminishing blastocoel and the new archenteron opening at the blastopore. The same number of cell tiles persists across animation frames; exact cell counts, sizes and fate territories are schematic. Playback pauses when leaving the stage or hiding the lesson. Three-layer and neurula sections and the germ-layer selector now show individual cells rather than solid ribbons. Source: Kuznetsov and Mushkambarov (2016), sections 6.1–6.2, especially pp.104 and110. This is not a model of human gastrulation. `ontogenesis-test.mjs` checks sheet continuity, inward motion, layer spacing, cell walls/nuclei and playback lifecycle.
