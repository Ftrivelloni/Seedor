'use client';

import { AppLayout } from '@/components/dashboard/AppLayout';
import { AppProvider } from '@/context/AppContext';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AppProvider>
            <AppLayout>{children}</AppLayout>
        </AppProvider>
    );
}
