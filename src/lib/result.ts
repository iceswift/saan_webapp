/** รูปแบบผลลัพธ์ของ server action ทุกตัว หน้าจอตรวจ `res.ok` ก่อนใช้ `res.data` */
export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export function ok(): ActionResult<undefined>;
export function ok<T>(data: T): ActionResult<T>;
export function ok<T>(data?: T) {
  return { ok: true, data } as ActionResult<T>;
}

export function fail(error: string): { ok: false; error: string } {
  return { ok: false, error };
}
