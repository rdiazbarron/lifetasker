"use client";

import { Button } from "@heroui/react";
import { useState } from "react";

export function CompleteBlockButton({
  onClick,
}: {
  onClick: () => Promise<void>;
}) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleComplete() {
    if (isLoading) return;

    setIsLoading(true);

    try {
      await onClick();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      type="button"
      size="sm"
      isDisabled={isLoading}
      onPress={handleComplete}
    >
      {isLoading ? "Completing..." : "Complete"}
    </Button>
  );
}