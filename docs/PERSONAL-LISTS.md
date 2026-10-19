# Personal lists design pass

20 October 2026, source `8ff56ce`.

- Vows use the shared grouped rows, status-count chips and a GET search across the signed-in owner's place, wish and promise. Search is trimmed to 100 characters. Status links preserve the search, and the search form preserves the selected status. A filtered empty result offers a reset; a genuinely empty book offers creation. Reminder labels use Bangkok calendar days, distinguish today/past dates, and do not appear on fulfilled vows.
- Account uses the same recent-order rows on phone and desktop instead of a desktop-only table. Counts remain in menu descriptions; there is no customer statistics grid. It shows actual unread notification count and outstanding granted vows. Accounts without orders receive an illustration and browse action.
- Notifications have recent/unread filters and today/yesterday/earlier groups. Each list shows up to 50 records. The unread count covers the whole owner account; the unread query filters before limiting so an old unread item is not hidden behind 50 newer read records. Filtering does not mark anything read. Existing explicit read actions are retained.
- All queries remain owner-scoped, with existing vow-reminder synchronization. No new delivery channel, browser permission, storage provider, payment behavior or schema was introduced.

TypeScript, targeted ESLint and an isolated SQLite regression passed. The regression creates 51 recent read records plus an older unread record and another user's record; it verifies the older item is returned only in its owner's unread list and remains unread. Rollout, PostgreSQL regression and browser checks are recorded separately in DEPLOYMENT-STATUS.md.
