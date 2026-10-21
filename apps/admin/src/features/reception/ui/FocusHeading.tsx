import { Heading, type HeadingProps } from '@chakra-ui/react';
import { useEffect, useRef } from 'react';

function FocusHeading(props: HeadingProps) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return <Heading ref={ref} tabIndex={-1} outline="none" {...props} />;
}

export default FocusHeading;
