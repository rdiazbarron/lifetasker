"use client";

import { Button, Tooltip } from "@heroui/react";
import { useState } from "react";

export function CompleteBlockButton({
  onClick,
}: {
  onClick: () => Promise<void>;
}) {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Tooltip content="Mark this block as complete">
      <Button
        color="primary"
        size="sm"
        isLoading={isLoading}
        onPress={async () => {
          setIsLoading(true);
          try {
            await onClick();
          } finally {
            setIsLoading(false);
          }
        }}
      >
        Complete
      </Button>
    </Tooltip>
  );
}
