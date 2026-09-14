# Yandex Metrica

## Клики: настройка в кабинете

После публикации кода откройте счётчик **112561962 → Цели → Добавить цель**:

1. Название: **Клики по интерфейсу**.
2. Тип: **Целевое событие / JavaScript-событие**.
3. Условие: идентификатор **совпадает** с `ui_click`.
4. Сохраните. Цель должна быть самостоятельной, не только частью составной цели.

Код цели уже добавлен на сайт, но цель в кабинете автоматически не создаётся. Исторические клики до установки кода восстановить нельзя.

## Где смотреть

| Вопрос | Раздел Метрики | Что смотреть |
| --- | --- | --- |
| Какие кнопки нажимали и сколько раз? | Отчёты → Содержание → Параметры целей | Выберите «Клики по интерфейсу», раскройте `label` (название). Используйте достижения цели, а не только целевые визиты. |
| Где нажимали? | Тот же отчёт | Параметры `page` (chat/labs/documentation), `area` (хедер/меню/настройки/контент), `section` (например lab1). |
| Как выглядят клики на странице? | Поведение → Карта кликов | Цветовая карта нажатий. Содержимое iframe и скрытых областей имеет ограничения; для кнопок лабораторной используйте также события. |
| Что делал конкретный посетитель? | Посетители → карточка посетителя → визит; либо Поведение → Вебвизор | Найдите визит с целью «Клики по интерфейсу»; просмотрите доступные события/запись. Это посетитель браузера, не установленное имя человека. |
| Сколько было нажатий вообще? | Конверсии → «Клики по интерфейсу» | Достижения цели и целевые визиты — разные показатели: в одном визите бывает несколько нажатий. |

В «Параметрах событий» эти же параметры доступны после создания цели. Сохраните настроенный отчёт для повторного просмотра. Детализация по посетителю может ограничиваться настройками конфиденциальности Метрики.

Пример события: `page=labs`, `area=Учебная страница`, `label=Копировать пример или шаблон`, `section=lab1`. `element` — стабильный идентификатор; `type` различает кнопку, ссылку и раскрытие раздела. Страница указывает место клика, а не его назначение.

Считаются клики мышью, касания и активация кнопок/ссылок клавиатурой, в том числе внутри учебного iframe. Это активация элемента, не подтверждение успешного API-запроса. Содержимое полей, сообщений, пользовательские URL и API-ключи в параметры событий не передаются. Неизвестные ссылки группируются как «Другая ссылка»; отдельные вспомогательные кнопки — по имени обработчика либо общей группе.

**Ограничения:** Метрика учитывает одну и ту же цель не чаще раза в секунду и ограничивает количество достижений за визит. Поэтому `ui_click` — аналитика взаимодействий, а не точный журнал каждого быстрого клика. Без согласия, при блокировщике или до публикации события не поступают. Скрытое содержимое чата и настроек остаётся скрытым в Вебвизоре.

Проверка после публикации: примите соглашение, с паузами больше секунды нажмите смену темы → Лабы → копирование примера. Проверьте `ui_click` в отчёте, выбрав сегодняшний день. Тесты разработки перехватывают запросы и не загрязняют рабочую статистику.

Официальная справка: [цель и ограничения](https://yandex.ru/support/metrica/ru/general/goal-js-event), [параметры целей](https://yandex.ru/support/metrica/ru/reports/goal-params), [параметры событий](https://yandex.com/support/metrica/ru/reports/event-params).

Counter: **112561962**. Shared implementation: `ui/metrika.js`.

- `index.html`: one initialization, `defer: true`, explicit `hit` for the initial route and subsequent chat/labs/documentation changes, including back/forward.
- `privacy-policy.html`, `terms.html`: the same counter, one view per document.
- `labs.html`, `documentation.html`: no separate tag; these redirect into the shell or render in its iframe. Their views belong to the parent route.
- Initialization waits for the existing `n8n_consent=1` agreement. No noscript pixel: it would bypass that check. Previously accepted agreements remain accepted.
- Webvisor, clickmap, trackLinks and accurateTrackBounce enabled. Ecommerce omitted because the site has no purchases. No extra counters or custom goals are required for pageview reporting.
- Pageview URLs omit arbitrary query parameters and fragments, retaining only supported `page` values. Consecutive visits to the same normalized URL are deduplicated.
- Chat, Debug, configuration and inputs are masked using Yandex's `ym-hide-content` / `ym-disable-keys` classes. Do not remove these when adding UI components that show user data.

Build copies the loader with the existing `ui/*` workflow. No account settings or deployment are changed by this implementation. To verify after deployment: accept the agreement, navigate Chat → Labs → Documentation → Back, then use the counter's verification tool and reports. Ad blockers may block delivery. Local checks should intercept the tag request to avoid adding test traffic.

Documentation:
- https://yandex.ru/support/metrica/ru/code/counter-spa-setup
- https://yandex.ru/support/metrica/ru/code/counter-initialize
- https://yandex.ru/support/metrica/ru/webvisor/settings
