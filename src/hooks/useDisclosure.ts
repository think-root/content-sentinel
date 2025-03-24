import { useState, useCallback } from "react";

export function useDisclosure(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);

  const onClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const onOpen = useCallback(() => {
    setIsOpen(true);
  }, []);

  const onToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return { isOpen, onOpen, onClose, onToggle };
}
