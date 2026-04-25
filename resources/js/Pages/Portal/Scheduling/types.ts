export interface Workspace {
    id: number;
    name: string;
    slug: string;
    theme_preset?: string | null;
    public_name?: string | null;
    public_description?: string | null;
    logo_url?: string | null;
    cover_url?: string | null;
    whatsapp_number?: string | null;
    instagram_handle?: string | null;
    address_street?: string | null;
    address_number?: string | null;
    address_complement?: string | null;
    address_district?: string | null;
    address_city?: string | null;
    address_state?: string | null;
    address_zip?: string | null;
    show_location: boolean;
    show_contact_button: boolean;
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
    /** First name — required */
    firstName: string;
    /** Last name — optional */
    lastName: string;
    /** Phone / WhatsApp — required */
    phone: string;
    /** Email — optional */
    email: string;
}

/**
 * Compute the full name string sent to the backend.
 * Backend receives a single `name` field.
 */
export function fullName(data: BookingFormData): string {
    return [data.firstName, data.lastName].filter(Boolean).join(' ').trim();
}
