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
