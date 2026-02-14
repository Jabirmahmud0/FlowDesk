'use client';
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@flowdesk/trpc';

export const trpc = createTRPCReact<AppRouter>();
