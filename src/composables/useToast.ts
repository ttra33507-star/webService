import { ref } from 'vue';

type Toast = { id: number; message: string; type?: string };

const toasts = ref<Toast[]>([]);

export function useToast() {
  function push(message: string, type = 'info') {
    const id = Date.now();
    toasts.value.push({ id, message, type });
    // Simple fallback: log to console for environments without UI
    // A real implementation could expose the `toasts` ref for a Toast component.
    // Auto-remove after 5 seconds
    setTimeout(() => {
      const idx = toasts.value.findIndex((t) => t.id === id);
      if (idx !== -1) toasts.value.splice(idx, 1);
    }, 5000);
  }

  return { toasts, push };
}

export default { useToast };
