export const imgUrl = (img, width = 1920) => {
  const url = typeof img === 'string' ? img : img?.url || '';
  if (!url || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;
  const afterUpload = url.split('/upload/')[1] || '';
  if (/^[fcqwgt]\_/.test(afterUpload)) return url;
  return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
};
