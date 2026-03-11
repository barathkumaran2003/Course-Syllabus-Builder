import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import * as storage from "@/lib/storage";
import { Branding } from "@/lib/types";

interface BrandingContextValue {
  branding: Branding | null;
  refreshBranding: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextValue>({
  branding: null,
  refreshBranding: async () => {},
});

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [branding, setBranding] = useState<Branding | null>(null);

  const refreshBranding = useCallback(async () => {
    const data = await storage.getBranding();
    setBranding(data ?? null);
  }, []);

  useEffect(() => {
    refreshBranding();
  }, [refreshBranding]);

  return (
    <BrandingContext.Provider value={{ branding, refreshBranding }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}
