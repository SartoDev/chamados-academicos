import { useLocation } from 'react-router';

/** Exposes the current path to assertions about navigation. */
export function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location-probe">{location.pathname}</output>;
}
