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
    <Tooltip content="Log one completed block for this type">
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
