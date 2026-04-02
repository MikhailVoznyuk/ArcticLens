# GIS Demo MVP

Локальное demo-приложение для просмотра parcel-слоёв, растровой аналитики и карточек полей по AOI **Амга** и **Юнкор**.

Проект адаптирован под актуальный `frontend_export.zip`: global-векторы, AOI/parcels, annual composites, indices, masks, dynamics, полный terrain, experimental-слои `risk_score` и `hotspot_mask`, а также analytics CSV по годам. Текущая финальная сборка не использует textures в базовом сценарии, поэтому во фронте они убраны из пользовательского интерфейса. Главная карта собрана вокруг composite-подложки, parcels и рекомендуемых слоёв `NDVI / NDWI / OSAVI`, а `risk_score` и `hotspot_mask` вынесены в отдельный режим. 

## Что умеет MVP

- Leaflet-карта с несколькими подложками без ключей API
- переключение AOI: **Амга** / **Юнкор**
- выбор года, режима карты и аналитического слоя
- загрузка GeoTIFF напрямую из локального архива по запросу
- отрисовка `parcels` и `aoi`
- клик по полю -> карточка parcel с ключевыми метриками
- кнопка **«Обзор»** -> модалка с графиками по годам
- избранное в `localStorage`
- переход к полю из избранного
- FSD-разбиение во frontend
- отдельный локальный backend для чтения `manifest`, `GeoJSON`, `CSV` и отдачи GeoTIFF

## Режимы карты

В тулбаре добавлены преднастроенные режимы, чтобы не перегружать интерфейс:

- **Базовый режим**: composite + NDVI / NDWI / OSAVI
- **Вода**: `water_mask`, `persistence_water_mask`, `water_occurrence`, `delta_ndwi`, `water_growth`
- **Изменения**: `change_mask`, `delta_ndvi`, `delta_ndwi`
- **Зоны внимания**: `risk_score`, `hotspot_mask`
- **Рельеф**: `slope`, `tpi`, `roughness`
- **Advanced**: все доступные слои из текущего bundle

Если для выбранной AOI нужный слой отсутствует, интерфейс автоматически переключится на первый доступный слой для текущего режима.

## Почему без Яндекс/Google подложек по умолчанию

В MVP подключены подложки без необходимости в API-ключах: OSM, Carto Light, Carto Dark, Esri Satellite, OpenTopoMap. Для Яндекс/Google можно добавить отдельную интеграцию позже, но для локальной демонстрации безопаснее оставить открытые источники.

## Структура репозитория

```text
frontend/   Next.js + TypeScript + Tailwind + Leaflet
server/     Fastify API для чтения локального GIS bundle
```

## Куда класть архив с GIS-данными

Распакуйте ваш `frontend_export.zip` так, чтобы структура была такой:

```text
gis-demo-mvp/
  server/
    data/
      frontend_export/
        manifest.json
        README.txt
        global/
        areas/
```

Или задайте свой путь через `GIS_DATA_ROOT`.

## Запуск

```bash
npm install
npm run dev
```

После этого:

- frontend: `http://localhost:3000`
- backend: `http://localhost:4001`

## Переменные окружения

### Корень

Скопируйте `.env.example` в `.env`.

### server/.env

```env
PORT=4001
GIS_DATA_ROOT=./data/frontend_export
```

### frontend/.env.local

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4001
```

## Как frontend использует архив

Backend индексирует каталог и подхватывает:

- `global/aoi_union.geojson`
- `global/parcels_clipped.geojson`
- `areas/<area>/vectors/*.geojson`
- `areas/<area>/analytics/*.csv`
- `areas/<area>/rasters/<group>/*.tif`

CSV используются как атрибутивный источник для карточек и аналитики и связываются с parcels по `parcel_id`. Если аналитика неполная, в интерфейсе показывается статус вместо пустых или фиктивных значений.

## Что показано в popup и модалке

MVP показывает то, что подходит для фронтового сценария:

- parcel id
- статус полноты аналитики
- площадь, если она есть в CSV
- текущие метрики по выбранному году
- приоритетные индикаторы: NDVI, NDWI, OSAVI, Brightness, NIR/Red, Red/Green, `risk_score`
- временные ряды по доступным годам
- таблицу атрибутов текущего года

## Ограничения MVP

- Растры грузятся как исходные GeoTIFF по сети localhost, без предварительного тильного сервиса.
- Для тяжёлых TIFF производительность зависит от размера файлов и браузера.
- Для production лучше перейти на COG, tileserver или заранее подготовленные пирамиды.
- Попап сделан как кастомная glass-карточка поверх карты, а не стандартный Leaflet popup.
- Список метрик в карточке собирается адаптивно из CSV, потому что набор колонок может немного отличаться между годами.

## Рекомендуемые следующие шаги

1. pre-generate COG/tiles,
2. добавить opacity slider для overlay,
3. включить поиск по `parcel_id`,
4. добавить split-screen compare для двух лет,
5. вынести legends и layer explanations в отдельную плашку.
