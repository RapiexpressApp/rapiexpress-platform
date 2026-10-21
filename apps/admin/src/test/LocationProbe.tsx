import { useLocation } from 'react-router';

function LocationProbe() {
  const location = useLocation();
  return <p data-testid="location">{`${location.pathname}${location.search}`}</p>;
}

export default LocationProbe;
