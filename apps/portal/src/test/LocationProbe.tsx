import { useLocation } from 'react-router';

function LocationProbe() {
  const location = useLocation();
  return <p data-testid="search">{location.search}</p>;
}

export default LocationProbe;
