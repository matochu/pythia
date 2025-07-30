# Project Structure Recommendations: Replacing config.json

> **IMPORTANT**: This document provides practical recommendations for replacing config.json with declarative documentation-based approaches that are more flexible, maintainable, and LLM-friendly.

## Executive Summary

**Yes, MD файл у `@/docs` з правильною структурою та використанням як правило `@/rules` - це відмінна альтернатива config.json!**

Цей підхід надає:

- **Більшу гнучкість** - працює з будь-якою структурою проекту
- **Краще розуміння LLM** - природна мова замість JSON
- **Легше підтримку** - Markdown замість конфігураційних файлів
- **Повну workspace інтеграцію** - працює з Cursor/VSCode

## Рекомендований Підхід

### 1. **Project Structure Declaration (PSD) File**

Створити `docs/project-structure.md` з повним описом структури:

```markdown
# Project Structure

## Overview

[Опис проекту та його призначення]

## Directory Structure
```

docs/
├── architecture/ # System design and technical analysis
├── workflows/ # Project processes and management
├── commands/ # LLM automation and scripts
└── [інші директорії]

```

## Key Information Sources
[Ключові файли та їх призначення]

## Document Relationships
[Зв'язки між документами]
```

### 2. **Enhanced Cursor Rules**

Оновити `.cursor/rules/documentation.mdc`:

```markdown
---
description: Documentation process and project structure
globs: docs/**/*.md
alwaysApply: true
---

# Project Documentation Guidelines

## Quick Reference

[Швидкий довідник по структурі]

## Project Context

[Контекст проекту для LLM]
```

### 3. **Workspace Integration File**

Створити `docs/workspace-integration.md`:

```markdown
# Workspace Integration Guide

## Pythia Commands Usage

[Приклади використання команд]

## Project Context for LLM

[Контекст проекту для LLM]
```

## Переваги цього підходу

### ✅ **Порівняно з config.json**

| Аспект                   | config.json              | MD файли               |
| ------------------------ | ------------------------ | ---------------------- |
| **Гнучкість**            | Низька (жорсткі шляхи)   | Висока (декларативний) |
| **Підтримка**            | Середня (JSON синтаксис) | Висока (Markdown)      |
| **Розуміння LLM**        | Низьке (без контексту)   | Високе (семантичний)   |
| **Workspace інтеграція** | Погана                   | Відмінна               |
| **Адаптація проекту**    | Складна                  | Легка                  |
| **Version Control**      | Конфлікти                | Дружній                |

### ✅ **Ключові переваги**

1. **Природна мова** - LLM краще розуміє Markdown
2. **Семантичний зміст** - не просто шляхи, а призначення
3. **Гнучкість** - працює з будь-якою структурою проекту
4. **Легка підтримка** - Markdown читається людьми
5. **Workspace інтеграція** - працює з Cursor/VSCode

## Практична реалізація

### Створені файли для проекту:

1. **`docs/project-structure.md`** ✅

   - Повний опис структури проекту
   - Ключові файли та їх призначення
   - Зв'язки між документами
   - Контекст проекту для LLM

2. **Оновлений `.cursor/rules/documentation.mdc`** ✅

   - Швидкий довідник
   - Ключові файли по категоріях
   - Контекст проекту
   - alwaysApply: true

3. **`docs/workspace-integration.md`** ✅
   - Приклади використання Pythia команд
   - Контекст проекту для LLM
   - Best practices
   - Troubleshooting

### Як це працює:

1. **LLM читає `docs/project-structure.md`** для розуміння структури
2. **Cursor rules** надають швидкий довідник
3. **Workspace integration** показує як використовувати команди
4. **Всі файли** працюють разом для повного розуміння

## Рекомендації для інших проектів

### 1. **Створіть PSD файл**

```bash
# Створіть docs/project-structure.md
# Опишіть структуру проекту
# Додайте контекст для LLM
```

### 2. **Оновіть Cursor rules**

```bash
# Додайте quick reference
# Включіть контекст проекту
# Встановіть alwaysApply: true
```

### 3. **Створіть workspace integration**

```bash
# Документуйте використання Pythia
# Надайте приклади
# Додайте troubleshooting
```

## Відповідь на питання

### **"Чи вистачить правильно сформувати MD файл у @/docs?"**

**Так, абсолютно!** MD файл з правильною структурою - це набагато краще рішення ніж config.json:

- ✅ **Більше інформації** - не тільки шляхи, а й призначення
- ✅ **Краще для LLM** - природна мова замість JSON
- ✅ **Гнучкіше** - працює з будь-якою структурою
- ✅ **Легше підтримувати** - Markdown читається людьми

### **"Яку інформацію там можна розмістити?"**

**Багато корисної інформації:**

1. **Структура проекту** - що де знаходиться
2. **Ключові файли** - найважливіші документи
3. **Зв'язки між документами** - як все пов'язано
4. **Контекст проекту** - призначення та особливості
5. **Технологічний стек** - що використовується
6. **Паттерни** - як працювати з проектом

### **"Чи вистачить використовувати як правило @/rules?"**

**Так, це відмінна ідея!** Cursor rules - це ідеальне місце для:

- ✅ **Швидкого довідника** - де що знаходиться
- ✅ **Контексту проекту** - для LLM
- ✅ **Автоматичного застосування** - alwaysApply: true
- ✅ **Інтеграції з workspace** - працює з Cursor

## Висновок

**MD файли + Cursor rules - це ідеальна заміна config.json!**

Цей підхід:

1. **Елімінує** потребу в жорстких конфігураційних файлах
2. **Надає** багато більше інформації для LLM
3. **Працює** з будь-якою структурою проекту
4. **Інтегрується** з workspace середовищами
5. **Легко підтримується** та розширюється

**Рекомендація**: Використовуйте цей підхід для всіх проектів, які використовують Pythia як shared documentation base.

---

**Last Updated**: 2025-07-25
