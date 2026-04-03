export interface AssemblyStep {
  id: string;
  title: string;
  description: string;
  measurements: string[];
  tools: string[];
  parts: string[];
  /** Path under public/, e.g. `models/step1.glb` — optional for demo */
  partModel?: string | null;
  animationClip?: string | null;
}

export interface AssemblyManifest {
  productName: string;
  /** Optional full-product GLB for calibration */
  assemblyModel?: string | null;
  steps: AssemblyStep[];
}

export async function loadManifest(): Promise<AssemblyManifest> {
  const res = await fetch(`${import.meta.env.BASE_URL}manifest.json`);
  if (!res.ok) throw new Error(`Failed to load manifest: ${res.status}`);
  return res.json() as Promise<AssemblyManifest>;
}
