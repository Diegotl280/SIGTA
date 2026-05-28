import { useContext } from 'react';
import { AppearanceContext } from './AppearanceContext';

export const useAppearance = () => useContext(AppearanceContext);
