"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { useUIStore } from "@/store/useUIStore";
import { toast } from "@/store/useToast";
import { Modal } from "@/components/ui/Modal";
import { Toggle } from "@/components/ui/Toggle";
import { CaretDown, Check, Key, Lightning, Spinner } from "@/components/ui/icons";

export function SettingsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const user = useAuthStore((s) => s.user);
  const setApiKey = useAuthStore((s) => s.setApiKey);
  const fontScale = useUIStore((s) => s.fontScale);
  const density = useUIStore((s) => s.density);
  const setFontScale = useUIStore((s) => s.setFontScale);
  const setDensity = useUIStore((s) => s.setDensity);
  const skipCache = useUIStore((s) => s.skipCache);
  const toggleSkipCache = useUIStore((s) => s.toggleSkipCache);

  const [keyInput, setKeyInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const saveKey = async () => {
    const key = keyInput.trim();
    if (!key) return;
    setBusy(true);
    const res = await setApiKey(key);
    setBusy(false);
    if (res.ok) {
      setKeyInput("");
      toast.success("Saved — your questions now use your own key");
    } else {
      toast.error("Couldn't save that key", res.error);
    }
  };

  const removeKey = async () => {
    setBusy(true);
    const res = await setApiKey(null);
    setBusy(false);
    if (res.ok) toast.success("Switched back to the shared key");
    else toast.error("Couldn't remove that key", res.error);
  };

  return (
    <Modal open={open} onClose={onClose} title="Settings" description="Appearance and your account.">
      <div className="space-y-6">
        <section>
          <h3 className="label mb-2.5">Appearance</h3>
          <div className="space-y-2.5">
            <Segmented
              label="Text size"
              value={fontScale}
              onChange={setFontScale}
              options={[
                { value: "sm", label: "Small" },
                { value: "md", label: "Default" },
                { value: "lg", label: "Large" },
              ]}
            />
            <Segmented
              label="Layout"
              value={density}
              onChange={setDensity}
              options={[
                { value: "comfortable", label: "Comfortable" },
                { value: "compact", label: "Compact" },
              ]}
            />
          </div>
        </section>

        <section className="border-t border-line pt-5">
          <h3 className="label mb-1.5 flex items-center gap-1.5">
            <Key className="h-3 w-3" /> Use your own key
          </h3>
          <p className="mb-3 text-xs leading-relaxed text-content-secondary">
            This project shares one free Google AI key across everyone using it. If it&apos;s
            slow or busy, add your own — it&apos;s free, takes two minutes, and your questions
            stop competing with everyone else&apos;s.
          </p>
          <ol className="mb-3 list-decimal space-y-1 pl-4 text-2xs text-content-muted">
            <li>
              Get a free key at{" "}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-accent underline underline-offset-2 hover:no-underline"
              >
                aistudio.google.com/apikey
              </a>{" "}
              — sign in with Google, click Create API key, copy it
            </li>
            <li>Paste it below and save</li>
          </ol>

          {user?.hasCustomKey ? (
            <div className="flex items-center gap-2 rounded-lg border border-positive/30 bg-positive/8 px-3 py-2 text-xs text-positive">
              <Check className="h-3.5 w-3.5 shrink-0" weight="bold" />
              <span className="flex-1 font-medium">Using your own key</span>
              <button
                onClick={removeKey}
                disabled={busy}
                className="shrink-0 font-medium text-content-muted underline decoration-dotted underline-offset-2 transition-colors hover:text-danger disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="Paste your Gemini API key"
                  autoComplete="off"
                  spellCheck={false}
                  className="input"
                />
                <button
                  onClick={saveKey}
                  disabled={busy || !keyInput.trim()}
                  className="btn btn-accent shrink-0 px-3"
                >
                  {busy && <Spinner className="h-3.5 w-3.5 animate-spin" />}
                  Save
                </button>
              </div>
              <p className="mt-2 text-[0.65rem] text-content-muted">
                Currently using the shared key. Your key is stored encrypted and never shown
                again once saved.
              </p>
            </>
          )}
        </section>

        <section className="border-t border-line pt-4">
          <button
            onClick={() => setAdvancedOpen((v) => !v)}
            className="flex w-full items-center justify-between text-left"
          >
            <span className="label">Advanced</span>
            <CaretDown
              className={cn("h-3 w-3 text-content-muted transition-transform", advancedOpen && "rotate-180")}
            />
          </button>
          {advancedOpen && (
            <div className="mt-2.5 flex items-center justify-between gap-3 rounded-lg border border-line bg-surface-sunken/60 px-3 py-2.5">
              <div className="min-w-0">
                <p className="text-xs font-medium text-content-primary">Always answer fresh</p>
                <p className="text-[0.65rem] leading-relaxed text-content-muted">
                  Skips the cache so repeated questions never reuse a saved answer. Slower, but
                  useful while testing.
                </p>
              </div>
              <Toggle active={skipCache} onClick={toggleSkipCache} icon={Lightning}>
                {skipCache ? "On" : "Off"}
              </Toggle>
            </div>
          )}
        </section>
      </div>
    </Modal>
  );
}

function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-content-secondary">{label}</span>
      <div className="inline-flex rounded-lg border border-line bg-surface-sunken p-0.5">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-[6px] px-2.5 py-1 text-2xs font-medium transition-colors",
              value === o.value
                ? "bg-surface-raised text-content-primary shadow-sm"
                : "text-content-muted hover:text-content-primary",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
