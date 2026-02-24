# Logger Service — Единый сервис логирования API Reference

**Версия:** 1.2.0  
**Файл:** `modia/services/logger.js`

## Интерфейс

```javascript
// Импорт
import { logger } from '../services/logger.js';

// Использование
logger.log(message, level, context);
logger.info(message, context);
logger.warn(message, context);
logger.error(message, context);
logger.success(message, context);

// Через глобальный API
Modia.log(message, level, context);
Modia.info(message, context);
Modia.warn(message, context);
Modia.error(message, context);
Modia.success(message, context);
```

## Методы

| Метод | Параметры | Возвращает | Описание |
|-------|-----------|------------|----------|
| `log()` | `message: string`, `level: string`, `context: string` | `void` | Основное API логирования |
| `info()` | `message: string`, `context: string` | `void` | Лог уровня info |
| `warn()` | `message: string`, `context: string` | `void` | Лог уровня warn (console.warn) |
| `error()` | `message: string`, `context: string` | `void` | Лог уровня error (console.error) |
| `success()` | `message: string`, `context: string` | `void` | Лог уровня success |

## Глобальные переменные

| Переменная | Тип | Описание |
|------------|-----|----------|
| `window.MODIA_LOG_ENABLED` | `boolean` | `false` = полная блокировка всех логов |
| `window.MODIA_LOG_LEVEL` | `string` | `'info'` \| `'warn'` \| `'error'` — минимальный уровень |

## Иерархия активации

| Приоритет | Триггер | Описание |
|-----------|---------|----------|
| 1 (высший) | ENV-переменные | Блокирует всё остальное |
| 2 | GET-параметры | `?modia-log`, `?modia-debug` |
| 3 (низший) | Data-атрибуты | `[data-modia-log]` |

## Зависимости

| Модуль | Тип | Назначение |
|--------|-----|------------|
| jQuery | Внешняя | Проверка data-атрибутов |

## Формат вывода

```
[HH:MM:SS] [Modia] [Context] Message
```

**Пример:**
```
[13:11:19] [Modia] TestButton Информационное сообщение
```

---

*Последнее обновление: 2026-02-19*
