import { useLocation } from 'react-router';

function LocationProbe() {
  const location = useLocation();
  return (
    <>
      <p data-testid="search">{location.search}</p>
      <p data-testid="pathname">{location.pathname}</p>
    </>
  );
}

export default LocationProbe;
