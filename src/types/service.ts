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
  sales_count?: number | string | null;
}

export interface ServiceRecord {
  id: number;
  name: string;
  label: string;
  iconUrl: string;
  description?: string | null;
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
  salesCount: number;
}

export interface ServiceCategoryGroup {
  id: number;
  label: string;
  icon: string;
  services: ServiceRecord[];
}

export interface CategoryRecord {
  id: number;
  label: string;
  mainCategoryId: number;
  mainCategoryLabel: string | null;
  isTool: boolean;
}
