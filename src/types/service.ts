export interface RemoteServiceRecord {
  id: number;
  name: string;
  label: string;
  icon?: string | null;
  category_id: number;
  category_label: string;
  main_category_id: number;
  main_category_label: string;
  main_category_icon: string;
  price_release: string;
  currency: string;
  currency_symbol: string;
  visible: boolean;
  default_quantity: number;
}

export interface ServiceRecord {
  id: number;
  name: string;
  label: string;
  iconUrl: string;
  visible: boolean;
  defaultQuantity: number;
  price: {
    amount: number;
    formatted: string;
    currency: string;
    symbol: string;
  };
  category: {
    id: number;
    label: string;
  };
  mainCategory: {
    id: number;
    label: string;
    icon: string;
  };
}

export interface ServiceCategoryGroup {
  id: number;
  label: string;
  icon: string;
  services: ServiceRecord[];
}
