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
