const NativeDate = Date;
const now = NativeDate.parse('2026-12-31T17:30:00Z');
global.Date = class extends NativeDate {
  constructor(...args) { super(...(args.length ? args : [now])); }
  static now() { return now; }
};
