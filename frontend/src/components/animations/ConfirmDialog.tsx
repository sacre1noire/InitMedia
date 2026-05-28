import React, { createContext, useCallback, useContext, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Modal } from "./Modal";

type Variant = "default" | "danger" | "success";

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: Variant;
}

interface ConfirmState extends ConfirmOptions {
  open: boolean;
  resolve?: (value: boolean) => void;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

const variantStyles: Record<Variant, { icon: React.ReactNode; button: string; iconWrap: string }> = {
  default: {
    icon: <Info className="h-6 w-6" />,
    button: "bg-primary-600 hover:bg-primary-700 text-white",
    iconWrap: "bg-primary-50 text-primary-600",
  },
  danger: {
    icon: <AlertTriangle className="h-6 w-6" />,
    button: "bg-rose-600 hover:bg-rose-700 text-white",
    iconWrap: "bg-rose-50 text-rose-600",
  },
  success: {
    icon: <CheckCircle2 className="h-6 w-6" />,
    button: "bg-emerald-600 hover:bg-emerald-700 text-white",
    iconWrap: "bg-emerald-50 text-emerald-600",
  },
};

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ConfirmState>({
    open: false,
    title: "",
  });

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({ ...options, open: true, resolve });
    });
  }, []);

  const close = (value: boolean) => {
    state.resolve?.(value);
    setState((prev) => ({ ...prev, open: false, resolve: undefined }));
  };

  const variant = state.variant ?? "default";
  const styles = variantStyles[variant];

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Modal
        open={state.open}
        onClose={() => close(false)}
        showCloseButton={false}
        size="sm"
      >
        <div className="flex items-start gap-4">
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
            className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${styles.iconWrap}`}
          >
            {styles.icon}
          </motion.div>
          <div className="flex-1 pt-1">
            <h3 className="text-base font-semibold text-gray-900">
              {state.title}
            </h3>
            {state.description && (
              <p className="mt-2 text-sm text-gray-600">{state.description}</p>
            )}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={() => close(false)}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {state.cancelLabel ?? "Отмена"}
          </motion.button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => close(true)}
            className={`rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition-colors ${styles.button}`}
          >
            {state.confirmLabel ?? "Подтвердить"}
          </motion.button>
        </div>
      </Modal>
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used inside <ConfirmProvider>");
  }
  return ctx.confirm;
};
