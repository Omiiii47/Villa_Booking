'use client'
import { useEffect, useRef, useState } from 'react';
import { FaSave, FaPlus, FaTrash, FaChevronUp, FaChevronDown, FaUpload, FaDesktop, FaMobileAlt } from 'react-icons/fa';
import * as adminService from '../../services/adminService';
import { LANDING_ICON_NAMES } from '../../constants/landingIcons';
import { imgUrl } from '../../utils/imgUrl';

const inputCls = 'w-full rounded-xl border border-gray-200 bg-luxury-cream/50 px-3 py-2 text-sm outline-none focus:border-luxury-accent';

const SECTIONS = ['hero', 'showcase', 'gallery', 'amenities', 'experiences', 'testimonials', 'faqs', 'newsletter'];
const SECTION_LABELS = {
  hero: 'Hero',
  showcase: 'Villa Showcase',
  gallery: 'Gallery',
  amenities: 'Amenities',
  experiences: 'Experiences',
  testimonials: 'Testimonials',
  faqs: 'FAQs',
  newsletter: 'Newsletter',
};
const HEADING_FIELDS = ['label', 'title', 'subtitle'];

const HERO_FIELDS = [
  { key: 'eyebrow', label: 'Eyebrow' },
  { key: 'titleLine1', label: 'Title Line 1' },
  { key: 'titleLine2', label: 'Title Line 2' },
  { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
  { key: 'ctaPrimary', label: 'Primary Button' },
  { key: 'ctaSecondary', label: 'Secondary Button' },
];

const NEWSLETTER_FIELDS = [
  { key: 'label', label: 'Eyebrow' },
  { key: 'title', label: 'Title' },
  { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
  { key: 'placeholder', label: 'Input Placeholder' },
  { key: 'buttonText', label: 'Button Text' },
  { key: 'successTitle', label: 'Success Title' },
  { key: 'successMessage', label: 'Success Message', type: 'textarea' },
];

const ITEM_FIELDS = {
  showcase: [
    { key: 'name', label: 'Name' },
    { key: 'slug', label: 'Slug' },
    { key: 'tag', label: 'Tag' },
    { key: 'price', label: 'Price' },
    { key: 'desc', label: 'Description', type: 'textarea' },
    { key: 'image', label: 'Image', type: 'image' },
  ],
  gallery: [
    { key: 'image', label: 'Image', type: 'image' },
    { key: 'alt', label: 'Alt Text' },
    { key: 'location', label: 'Location' },
    { key: 'size', label: 'Tile Size', type: 'select', options: [{ value: 'sm', label: 'Small' }, { value: 'md', label: 'Large' }] },
  ],
  amenities: [
    { key: 'icon', label: 'Icon', type: 'select', options: LANDING_ICON_NAMES.map((n) => ({ value: n, label: n })) },
    { key: 'name', label: 'Name' },
    { key: 'desc', label: 'Description', type: 'textarea' },
  ],
  experiences: [
    { key: 'icon', label: 'Icon', type: 'select', options: LANDING_ICON_NAMES.map((n) => ({ value: n, label: n })) },
    { key: 'title', label: 'Title' },
    { key: 'desc', label: 'Description', type: 'textarea' },
  ],
  testimonials: [
    { key: 'name', label: 'Name' },
    { key: 'location', label: 'Location' },
    { key: 'villa', label: 'Villa' },
    { key: 'text', label: 'Quote', type: 'textarea' },
    { key: 'rating', label: 'Rating (1-5)', type: 'number' },
  ],
  faqs: [
    { key: 'q', label: 'Question', type: 'textarea' },
    { key: 'a', label: 'Answer', type: 'textarea' },
  ],
};

const ITEM_TEMPLATES = {
  showcase: { name: '', slug: '', tag: '', price: '', desc: '', image: { url: '', publicId: '' } },
  gallery: { image: { url: '', publicId: '' }, alt: '', location: '', size: 'sm' },
  amenities: { icon: 'FaSpa', name: '', desc: '' },
  experiences: { icon: 'FaCompass', title: '', desc: '' },
  testimonials: { name: '', location: '', villa: '', text: '', rating: 5 },
  faqs: { q: '', a: '' },
};

const ITEM_SECTIONS = ['showcase', 'gallery', 'amenities', 'experiences', 'testimonials', 'faqs'];

const LIST_KEYS = { gallery: 'images' };
const listKeyOf = (section) => LIST_KEYS[section] || 'items';

const migrateGallery = (data) => {
  if (!data) return data;
  const out = { ...data };
  ['desktop', 'mobile'].forEach((p) => {
    const g = out[p]?.gallery;
    if (g && g.items?.length && !g.images?.length) {
      out[p] = { ...out[p], gallery: { ...g, images: g.items } };
    }
  });
  return out;
};

const renderField = (field, value, onChange) => {
  if (field.type === 'select') {
    return (
      <select className={inputCls} value={value || ''} onChange={(e) => onChange(e.target.value)}>
        {field.options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    );
  }
  if (field.type === 'textarea') {
    return <textarea className={inputCls} rows={3} value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={field.label} />;
  }
  if (field.type === 'number') {
    return <input type="number" min="0" max="5" className={inputCls} value={value ?? ''} onChange={(e) => onChange(Number(e.target.value))} placeholder={field.label} />;
  }
  return <input className={inputCls} value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={field.label} />;
};

const LandingCmsEditor = () => {
  const [data, setData] = useState(null);
  const [platform, setPlatform] = useState('desktop');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminService.getCmsLanding().then((d) => setData(migrateGallery(d))).catch(() => setData(null));
  }, []);

  const patchSection = (section, patch) => setData((prev) => {
    const current = prev?.[platform]?.[section] || {};
    return { ...prev, [platform]: { ...prev[platform], [section]: { ...current, ...patch } } };
  });

  const sectionList = (section) => data?.[platform]?.[section]?.[listKeyOf(section)] || [];

  const setSectionList = (section, list) => patchSection(section, { [listKeyOf(section)]: list });

  const updateItem = (section, index, key, value) => {
    const items = sectionList(section);
    const next = items.map((it, i) => (i === index ? { ...it, [key]: value } : it));
    setSectionList(section, next);
  };

  const moveItem = (section, index, dir) => {
    const items = [...sectionList(section)];
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    [items[index], items[target]] = [items[target], items[index]];
    setSectionList(section, items);
  };

  const removeItem = (section, index) => {
    const items = sectionList(section);
    const removed = items[index];
    if (removed?.image?.publicId) adminService.deleteCmsImage(removed.image.publicId).catch(() => {});
    setSectionList(section, items.filter((_, i) => i !== index));
  };

  const addItem = (section) => {
    setSectionList(section, [...sectionList(section), { ...ITEM_TEMPLATES[section] }]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await adminService.updateCmsLanding(data);
      setData(res);
      alert('Landing content saved');
    } catch {
      alert('Failed to save content');
    }
    setSaving(false);
  };

  if (!data) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-2 border-luxury-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setPlatform('desktop')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm transition-all ${platform === 'desktop' ? 'bg-luxury-black text-white' : 'bg-luxury-cream text-gray-600 hover:bg-gray-200'}`}
          >
            <FaDesktop /> Desktop
          </button>
          <button
            onClick={() => setPlatform('mobile')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm transition-all ${platform === 'mobile' ? 'bg-luxury-black text-white' : 'bg-luxury-cream text-gray-600 hover:bg-gray-200'}`}
          >
            <FaMobileAlt /> Mobile
          </button>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 bg-luxury-accent text-white px-8 py-3 rounded-xl text-sm disabled:opacity-50 self-start">
          <FaSave /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {SECTIONS.map((section) => (
        <SectionCard key={section} title={SECTION_LABELS[section]} platform={platform}>
          {section === 'hero' && (
            <>
              <ImageField label="Background Image" value={data[platform].hero?.image}
                onChange={(v) => patchSection('hero', { image: v })} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {HERO_FIELDS.map((f) => (
                  <div key={f.key} className={f.type === 'textarea' ? 'md:col-span-2' : ''}>
                    <label className="block text-xs text-gray-400 mb-1">{f.label}</label>
                    {renderField(f, data[platform].hero?.[f.key], (v) => patchSection('hero', { [f.key]: v }))}
                  </div>
                ))}
              </div>
            </>
          )}

          {section === 'newsletter' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {NEWSLETTER_FIELDS.map((f) => (
                <div key={f.key} className={f.type === 'textarea' ? 'md:col-span-2' : ''}>
                  <label className="block text-xs text-gray-400 mb-1">{f.label}</label>
                  {renderField(f, data[platform].newsletter?.[f.key], (v) => patchSection('newsletter', { [f.key]: v }))}
                </div>
              ))}
            </div>
          )}

          {section !== 'hero' && section !== 'newsletter' && (
            <>
              <HeadingFields section={section} value={data[platform][section]} onPatch={patchSection} />
              {ITEM_SECTIONS.includes(section) && (
                <>
                  <div className="space-y-3">
                    {sectionList(section).map((item, i) => (
                      <div key={i} className="rounded-xl border border-gray-100 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-medium text-gray-500">Item {i + 1}</span>
                          <div className="flex gap-1">
                            <button type="button" disabled={i === 0} onClick={() => moveItem(section, i, -1)}
                              className="p-2 text-gray-400 hover:text-luxury-accent disabled:opacity-30"><FaChevronUp /></button>
                            <button type="button" disabled={i === sectionList(section).length - 1} onClick={() => moveItem(section, i, 1)}
                              className="p-2 text-gray-400 hover:text-luxury-accent disabled:opacity-30"><FaChevronDown /></button>
                            <button type="button" onClick={() => removeItem(section, i)} className="p-2 text-red-400 hover:text-red-600"><FaTrash /></button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {ITEM_FIELDS[section].map((f) => (
                            <div key={f.key} className={f.type === 'image' || f.type === 'textarea' ? 'md:col-span-2' : ''}>
                              <label className="block text-xs text-gray-400 mb-1">{f.label}</label>
                              {f.type === 'image'
                                ? <ImageField label={f.label} value={item.image} onChange={(v) => updateItem(section, i, 'image', v)} />
                                : renderField(f, item[f.key], (v) => updateItem(section, i, f.key, v))}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => addItem(section)}
                    className="mt-4 flex items-center gap-2 text-xs text-luxury-accent hover:underline">
                    <FaPlus /> Add {SECTION_LABELS[section]} Item
                  </button>
                </>
              )}
            </>
          )}
        </SectionCard>
      ))}
    </div>
  );
};

const SectionCard = ({ title, platform, children }) => (
  <div className="bg-white rounded-2xl shadow-sm border p-6">
    <div className="flex items-center justify-between mb-4">
      <h2 className="font-display text-xl">{title}</h2>
      <span className="text-[10px] uppercase tracking-widest text-gray-400">{platform}</span>
    </div>
    {children}
  </div>
);

const HeadingFields = ({ section, value, onPatch }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 p-3 bg-luxury-cream/60 rounded-xl">
    {HEADING_FIELDS.map((k) => (
      <div key={k}>
        <label className="block text-[10px] uppercase tracking-wider text-gray-400 mb-1">{k}</label>
        <input className={inputCls} value={value?.[k] || ''} onChange={(e) => onPatch(section, { [k]: e.target.value })} placeholder={k} />
      </div>
    ))}
  </div>
);

const ImageField = ({ label, value, onChange }) => {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const src = imgUrl(value);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await adminService.uploadCmsImage(file);
      onChange({ url: res.url, publicId: res.publicId });
    } catch {
      alert('Upload failed. Is Cloudinary configured?');
    }
    setUploading(false);
    e.target.value = '';
  };

  const handleRemove = async () => {
    if (value?.publicId) {
      adminService.deleteCmsImage(value.publicId).catch(() => {});
    }
    onChange({ url: '', publicId: '' });
  };

  return (
    <div className="rounded-xl border border-gray-100 p-4 mb-4">
      <label className="block text-xs text-gray-400 mb-2">{label}</label>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {src ? (
          <img src={src} alt={label} className="w-32 h-20 object-cover rounded-lg border shrink-0" />
        ) : (
          <div className="w-32 h-20 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-gray-300 text-xs shrink-0">
            No image
          </div>
        )}
        <div className="flex-1 space-y-2 w-full">
          <input className={inputCls} value={src} onChange={(e) => onChange({ ...(value || {}), url: e.target.value })} placeholder="Image URL" />
          <div className="flex gap-2 flex-wrap">
            <button type="button" disabled={uploading} onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 rounded-lg border border-luxury-accent/30 text-luxury-accent text-xs px-3 py-2 hover:bg-luxury-accent hover:text-white transition-colors disabled:opacity-50">
              <FaUpload /> {uploading ? 'Uploading...' : 'Upload'}
            </button>
            {value?.publicId && (
              <button type="button" onClick={handleRemove}
                className="flex items-center gap-2 rounded-lg border border-red-200 text-red-400 text-xs px-3 py-2 hover:bg-red-50 transition-colors">
                <FaTrash /> Delete
              </button>
            )}
          </div>
          <input type="file" accept="image/*" hidden ref={fileRef} onChange={handleFile} />
        </div>
      </div>
    </div>
  );
};

export default LandingCmsEditor;
