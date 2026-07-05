'use client';

import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../lib/redux/hooks';
import { setAuth, logout, hydrateAuth } from '../lib/redux/slices/authSlice';

export default function AuthHydrator() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(hydrateAuth());
  }, [dispatch]);

  return null;
}
