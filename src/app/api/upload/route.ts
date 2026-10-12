import { getCurrentUser } from "@/server/auth";
import { saveImage } from "@/server/storage";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "ไม่พบไฟล์รูป" }, { status: 400 });
  }

  const result = await saveImage(file);
  if ("error" in result) return Response.json(result, { status: 400 });
  return Response.json(result);
}
