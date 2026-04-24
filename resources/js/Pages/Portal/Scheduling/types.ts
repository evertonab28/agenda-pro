export interface Workspace {
    id: number;
    name: string;
    slug: string;
    theme_preset?: string | null;
}

export interface Customer {
    id: number;
    name: string;
    email?: string | null;
    phone?: string | null;
}

export interface Service {
    id: number;
    name: string;
    duration_minutes: number;
    buffer_minutes: number | null;
    price: string;
    description?: string | null;
    color?: string | null;
}

export interface Professional {
    id: number;
    name: string;
    specialty?: string | null;
    avatar_url?: string | null;
}

export interface BookingFormData {
    name: string;
    email: string;
    phone: string;
}
