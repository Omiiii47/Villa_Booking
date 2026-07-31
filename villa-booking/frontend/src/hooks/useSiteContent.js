import { useEffect, useState } from 'react';
import api from '../services/api';

const useSiteContent = () => {
  const [content, setContent] = useState(null);

  useEffect(() => {
    let mounted = true;
    api
      .get('/site-content')
      .then((res) => mounted && setContent(res.data))
      .catch(() => mounted && setContent(null));
    return () => { mounted = false; };
  }, []);

  return content;
};

export default useSiteContent;
