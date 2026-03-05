export type UserStatus = 'PENDING' | 'APPROVED' | 'REVOKED';
export type ConsultantGroup = 'MOASI ERP Achats' | 'CDS AU';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  status: UserStatus;
  user_group: ConsultantGroup | null;
  is_admin: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  color_code: string;
  created_at: string;
  sub_categories?: SubCategory[];
}

export interface SubCategory {
  id: string;
  category_id: string;
  name: string;
  created_at: string;
  categories?: Category;
}

export interface Query {
  id: string;
  title: string;
  sql_content: string;
  sub_category_id: string;
  allowed_groups: ConsultantGroup[];
  created_at: string;
  updated_at: string;
  sub_categories?: SubCategory;
  dynamic_fields?: DynamicField[];
}

export interface DynamicField {
  id: string;
  query_id: string;
  label: string;
  tag: string;
  placeholder: string | null;
  order_index: number;
}
