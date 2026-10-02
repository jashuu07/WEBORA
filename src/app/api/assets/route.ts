import { promises as fs } from 'node:fs';
import path from 'node:path';
import { getStore } from '@/lib/db';
import { requireUser, unauthorized } from '@/lib/auth/session';
import { fail, ok, serverError } from '@/lib/api';
import type { Asset } from '@/types';

export const runtime = 'nodejs';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml', 'image/avif'];

/** GET /api/assets → the user's uploaded images. */
export async function GET() {
  try {
    const user = await requireUser();
    if (!user) return unauthorized();
    return ok({ assets: await getStore().listAssets(user.id) });
  } catch (error) {
    return serverError(error);
  }
}

/**
 * POST /api/assets (multipart/form-data: file, websiteId?)
 *
 * With Supabase configured the file goes to Supabase Storage; otherwise it is
 * written to `public/uploads` so the app works end-to-end locally. Both paths
 * record the asset row so the editor's image picker can list uploads.
 */
export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (!user) return unauthorized();

    const form = await request.formData().catch(() => null);
    const file = form?.get('file');
    const websiteId = (form?.get('websiteId') as string) || undefined;

    if (!(file instanceof File)) return fail('Choose an image to upload.');
    if (file.size > MAX_BYTES) return fail('Images must be 5 MB or smaller.');
    if (file.type && !ALLOWED.includes(file.type)) {
      return fail('Upload a PNG, JPG, WEBP, GIF, AVIF or SVG image.');
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = (file.name.split('.').pop() ?? 'png').toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
    const key = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    let url: string;
    let storage: 'supabase' | 'local' = 'local';

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? 'webora-assets';

    if (supabaseUrl && serviceKey) {
      const res = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${key}`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${serviceKey}`,
          'content-type': file.type || 'application/octet-stream',
          'x-upsert': 'true',
        },
        body: buffer,
      });
      if (res.ok) {
        url = `${supabaseUrl}/storage/v1/object/public/${bucket}/${key}`;
        storage = 'supabase';
      } else {
        url = await writeLocal(key, buffer);
      }
    } else {
      url = await writeLocal(key, buffer);
    }

    const asset: Asset = {
      id: `as_${Math.random().toString(36).slice(2, 10)}`,
      userId: user.id,
      websiteId,
      name: file.name,
      mime: file.type || 'image/png',
      size: file.size,
      url,
      createdAt: new Date().toISOString(),
    };

    await getStore().createAsset(asset);
    return ok({ asset, storage }, { status: 201 });
  } catch (error) {
    return serverError(error, 'We could not store that image.');
  }
}

async function writeLocal(key: string, buffer: Buffer): Promise<string> {
  const dir = path.join(process.cwd(), 'public', 'uploads', path.dirname(key));
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(process.cwd(), 'public', 'uploads', key), buffer);
  return `/uploads/${key}`;
}
