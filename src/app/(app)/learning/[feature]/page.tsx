"use client";
import React from 'react';
import Learning from '../../../../pages/Learning';
import { useParams } from 'next/navigation';

export default function Page() {
  const params = useParams();
  const feature = params?.feature as string;
  return <Learning feature={feature} />;
}
