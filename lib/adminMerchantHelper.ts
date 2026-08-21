import { useState, useEffect } from 'react';

export const getAdminSelectedMerchantId = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_selected_merchant_id');
};

export function useAdminMerchant() {
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(null);
  const [selectedMerchantName, setSelectedMerchantName] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const load = () => {
      setSelectedMerchantId(localStorage.getItem('admin_selected_merchant_id'));
      setSelectedMerchantName(localStorage.getItem('admin_selected_merchant_name'));
      setIsLoaded(true);
    };

    load();

    const handleChanged = () => {
      load();
    };

    window.addEventListener('admin-merchant-changed', handleChanged);
    return () => {
      window.removeEventListener('admin-merchant-changed', handleChanged);
    };
  }, []);

  const changeMerchant = (id: string | null, name?: string) => {
    if (id) {
      localStorage.setItem('admin_selected_merchant_id', id);
      if (name) {
        localStorage.setItem('admin_selected_merchant_name', name);
      }
    } else {
      localStorage.removeItem('admin_selected_merchant_id');
      localStorage.removeItem('admin_selected_merchant_name');
    }
    setSelectedMerchantId(id);
    setSelectedMerchantName(name || null);
    window.dispatchEvent(new Event('admin-merchant-changed'));
  };

  return {
    selectedMerchantId,
    selectedMerchantName,
    isLoaded,
    changeMerchant
  };
}
