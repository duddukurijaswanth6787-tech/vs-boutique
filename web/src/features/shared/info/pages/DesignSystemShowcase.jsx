import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Search, Check, Mail, Phone, Lock, Eye, Trash2, ShoppingBag, 
  MapPin, Star, Award, Heart, MessageSquare, Compass, Send, Menu 
} from 'lucide-react';
import Button from '@core/components/ui/Button';
import IconButton from '@core/components/ui/IconButton';
import Input from '@core/components/ui/Input';
import SearchInput from '@core/components/ui/SearchInput';
import Checkbox from '@core/components/ui/Checkbox';
import Radio from '@core/components/ui/Radio';
import Switch from '@core/components/ui/Switch';
import Chip from '@core/components/ui/Chip';
import Badge from '@core/components/ui/Badge';
import Card from '@core/components/ui/Card';
import Drawer from '@core/components/ui/Drawer';
import BottomSheet from '@core/components/ui/BottomSheet';
import Modal from '@core/components/ui/Modal';
import Tooltip from '@core/components/ui/Tooltip';
import Skeleton from '@core/components/ui/Skeleton';
import LoadingOverlay from '@core/components/ui/LoadingOverlay';
import Stepper from '@core/components/ui/Stepper';
import Timeline from '@core/components/ui/Timeline';
import Select from '@core/components/ui/Select';
import Textarea from '@core/components/ui/Textarea';
import Tabs from '@core/components/ui/Tabs';
import Accordion from '@core/components/ui/Accordion';
import Avatar from '@core/components/ui/Avatar';
import PremiumImage from '@core/components/ui/PremiumImage';
import EmptyState from '@core/components/ui/EmptyState';
import Toast from '@core/components/ui/Toast';

import ProductCard from '@core/components/commerce/ProductCard';
import BoutiqueCard from '@core/components/commerce/BoutiqueCard';
import ServiceCard from '@core/components/commerce/ServiceCard';
import CollectionCard from '@core/components/commerce/CollectionCard';
import AvailabilityBadge from '@core/components/commerce/AvailabilityBadge';
import DiscountBadge from '@core/components/commerce/DiscountBadge';
import DeliveryBadge from '@core/components/commerce/DeliveryBadge';

import Container from '@core/components/layout/Container';
import Section from '@core/components/layout/Section';
import Grid from '@core/components/layout/Grid';
import Stack from '@core/components/layout/Stack';

import { IMAGES } from '@core/services';

export default function DesignSystemShowcase() {
  const navigate = useNavigate();
  
  // Interactive UI states
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [loadingOverlayOpen, setLoadingOverlayOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [checked, setChecked] = useState(true);
  const [radioVal, setRadioVal] = useState('one');
  const [switchVal, setSwitchVal] = useState(false);
  const [activeChip, setActiveChip] = useState('sarees');
  const [stepperVal, setStepperVal] = useState(1);
  const [currentTab, setCurrentTab] = useState('overview');
  
  // Toast list state for showcasing toasts
  const [toasts, setToasts] = useState([]);
  
  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Mock data for commerce components
  const dummyProduct = {
    id: 'prod-1',
    name: 'Royal Banarasi Silk Saree',
    basePrice: 8500,
    compareAtPrice: 12000,
    averageRating: 4.8,
    reviewCount: 142,
    images: [{ url: IMAGES.products.banarasiSaree }],
    category: { name: 'Sarees' },
    boutique: { name: 'Zara Designs Studio', city: 'Hyderabad' },
    variants: [
      { id: 'v-1', price: 8500, inventory: { trackInventory: true, quantity: 15 } }
    ]
  };

  const dummyBoutique = {
    id: 'bout-1',
    name: 'Heritage Silk Studio',
    coverImageUrl: IMAGES.boutiques.interior,
    logoUrl: IMAGES.placeholder,
    rating: 4.9,
    startingPrice: 4500,
    verified: true,
    area: 'Jubilee Hills',
    city: 'Hyderabad',
    experienceYears: 12,
    servicesOffered: ['Silk Stitching', 'Hand Embroidery', 'Zardozi Work']
  };

  const timelineItems = [
    { title: 'Measurement Saved', date: 'June 25, 2026', description: 'Bust: 36in, Waist: 30in, Length: 42in. Confirmed by boutique tailors.' },
    { title: 'Order Dispatched', date: 'June 26, 2026', description: 'Dispatched from Jubilee Hills Studio via premium boutique courier.' },
    { title: 'Out for Delivery', date: 'June 27, 2026', description: 'Assigned to executive. Secure OTP required.' }
  ];

  const accordionItems = [
    { title: 'What is Custom Tailoring consultation fee?', content: 'Consultation is complimentary with home measurement bookings, or ₹250 flat if booking a premium digital consultation.' },
    { title: 'How long does a bespoke blouse take?', content: 'Our standard delivery is 7-10 days. Express turnaround (48 hours) is available at checkout for an additional premium surcharge.' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20 text-[#1f1b14] dark:text-gray-100">
      {/* Toast container */}
      <div className="fixed top-5 right-5 z-[130] flex flex-col gap-2 max-w-sm w-full">
        {toasts.map(t => (
          <Toast 
            key={t.id} 
            message={t.message} 
            type={t.type} 
            show={true} 
            onClose={() => setToasts(prev => prev.filter(item => item.id !== t.id))} 
          />
        ))}
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 shadow-sm">
        <Container className="h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <IconButton 
              icon={ArrowLeft} 
              onClick={() => navigate('/customer/home')} 
              ariaLabel="Go Back" 
            />
            <span className="text-base font-serif font-black tracking-wide dark:text-white">
              VS Boutique <span className="text-accent">Design System</span>
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => setLoading(!loading)}
            >
              Toggle Loading States
            </Button>
          </div>
        </Container>
      </header>

      <Container className="mt-8">
        <Tabs
          tabs={[
            { id: 'overview', label: 'Overview & Primitives' },
            { id: 'commerce', label: 'Commerce & Layouts' },
            { id: 'overlays', label: 'Overlays & Modals' }
          ]}
          activeTab={currentTab}
          onChange={setCurrentTab}
          className="mb-8"
        />

        {currentTab === 'overview' && (
          <Stack gap={8}>
            {/* Design Tokens Section */}
            <Section title="Design Tokens Showcase">
              <Grid cols={1} md={3} gap={6}>
                <Card className="p-5 flex flex-col justify-between space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">Typography Scale</h4>
                  <div className="space-y-1">
                    <p className="text-3xl font-serif font-bold text-gray-900 dark:text-gray-100">Playfair Serif</p>
                    <p className="text-sm font-sans font-medium text-gray-500">Inter Sans Medium - 14px</p>
                    <p className="text-xs font-sans font-semibold tracking-widest text-accent uppercase">Accent Letterspacing</p>
                  </div>
                </Card>
                <Card className="p-5 flex flex-col justify-between space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">Luxury Palette</h4>
                  <div className="flex gap-2">
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-[10px] text-white font-bold" title="Primary Charcoal">P</div>
                    <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-[10px] text-white font-bold" title="Accent Gold">A</div>
                    <div className="w-10 h-10 rounded-xl bg-[#fff8f2] border border-[#d2c5b1]/30 flex items-center justify-center text-[10px] text-gray-600 font-bold" title="Background warm off-white">BG</div>
                  </div>
                </Card>
                <Card className="p-5 flex flex-col justify-between space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">Premium Shadows</h4>
                  <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-premium border border-gray-100 dark:border-gray-800 text-center text-xs font-bold text-gray-700 dark:text-gray-300">
                    shadow-premium
                  </div>
                </Card>
              </Grid>
            </Section>

            {/* Buttons Showcase */}
            <Section title="Buttons & Navigation Primitives">
              <Grid cols={1} md={2} gap={8}>
                {/* Standard Buttons */}
                <Card className="p-6 space-y-4">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 border-b pb-2">Button Variants</h4>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="primary" disabled={loading}>Primary Button</Button>
                    <Button variant="secondary" disabled={loading}>Secondary</Button>
                    <Button variant="luxury" disabled={loading}>Luxury Accent</Button>
                    <Button variant="ghost" disabled={loading}>Ghost</Button>
                  </div>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <Button variant="primary" size="sm" disabled={loading}>Small</Button>
                    <Button variant="primary" size="md" disabled={loading}>Medium</Button>
                    <Button variant="primary" size="lg" disabled={loading}>Large Button</Button>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <Button variant="primary" isLoading={true} className="w-full">Loading State</Button>
                  </div>
                </Card>

                {/* Icon Buttons & Chips */}
                <Card className="p-6 space-y-6">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 border-b pb-2 mb-3">Icon Button Primitives</h4>
                    <div className="flex gap-3">
                      <IconButton icon={Heart} variant="ghost" ariaLabel="Like" />
                      <IconButton icon={ShoppingBag} variant="primary" ariaLabel="Bag" />
                      <IconButton icon={MapPin} variant="secondary" ariaLabel="Map" />
                      <IconButton icon={Star} variant="luxury" ariaLabel="Star" />
                      <IconButton icon={Trash2} variant="danger" ariaLabel="Delete" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 border-b pb-2 mb-3">Interactive Chips</h4>
                    <div className="flex flex-wrap gap-2">
                      <Chip label="Sarees" active={activeChip === 'sarees'} onClick={() => setActiveChip('sarees')} />
                      <Chip label="Blouses" active={activeChip === 'blouses'} onClick={() => setActiveChip('blouses')} />
                      <Chip label="Lehengas" active={activeChip === 'lehengas'} onClick={() => setActiveChip('lehengas')} />
                      <Chip label="Custom Work" active={activeChip === 'custom'} onClick={() => setActiveChip('custom')} onDismiss={() => addToast('Chip dismissed', 'info')} />
                    </div>
                  </div>
                </Card>
              </Grid>
            </Section>

            {/* Inputs & Form Controls */}
            <Section title="Inputs & Form Controls">
              <Grid cols={1} md={2} gap={8}>
                <Card className="p-6 space-y-4">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 border-b pb-2">Text Inputs & Select</h4>
                  <Input 
                    label="Customer Name" 
                    placeholder="Enter full name" 
                    id="sample-name"
                  />
                  <Input 
                    label="Phone Number" 
                    error="This phone number is already registered" 
                    placeholder="Enter 10-digit number" 
                    id="sample-phone"
                  />
                  <Select 
                    label="City Location" 
                    id="sample-city"
                    options={[
                      { value: 'hyd', label: 'Hyderabad, TS' },
                      { value: 'blr', label: 'Bengaluru, KA' },
                      { value: 'del', label: 'New Delhi, NCR' }
                    ]} 
                  />
                </Card>
                <Card className="p-6 space-y-6">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 border-b pb-2">Toggle & Selection Primitives</h4>
                  <div className="space-y-4">
                    <Checkbox 
                      label="Set as default shipping address" 
                      checked={checked} 
                      onChange={setChecked} 
                    />
                    <div className="flex gap-6">
                      <Radio 
                        label="Standard Delivery" 
                        name="del" 
                        value="one" 
                        checked={radioVal === 'one'} 
                        onChange={setRadioVal} 
                      />
                      <Radio 
                        label="Premium Express" 
                        name="del" 
                        value="two" 
                        checked={radioVal === 'two'} 
                        onChange={setRadioVal} 
                      />
                    </div>
                    <Switch 
                      label="Enable SMS order updates" 
                      checked={switchVal} 
                      onChange={setSwitchVal} 
                    />
                  </div>
                </Card>
              </Grid>
            </Section>

            {/* Badges & Indicators */}
            <Section title="Badges, Avatar & Typography Elements">
              <Card className="p-6">
                <Grid cols={1} md={3} gap={6}>
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">Design System Badges</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="neutral">Draft</Badge>
                      <Badge variant="primary">New Season</Badge>
                      <Badge variant="accent">Exclusive</Badge>
                      <Badge variant="success">Dispatched</Badge>
                      <Badge variant="danger">High Demand</Badge>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">Avatars</h4>
                    <div className="flex items-center gap-3">
                      <Avatar initials="JD" size="sm" />
                      <Avatar src={IMAGES.reviews.profiles[0]} alt="John" size="md" />
                      <Avatar src={IMAGES.reviews.profiles[1]} alt="Jane" size="lg" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">Tooltips</h4>
                    <div className="flex gap-3">
                      <Tooltip content="Custom maggam hand-stitch work requires 5 days extra buffer" position="top">
                        <span className="text-xs font-bold text-accent underline cursor-help">Hover for info</span>
                      </Tooltip>
                    </div>
                  </div>
                </Grid>
              </Card>
            </Section>
          </Stack>
        )}

        {currentTab === 'commerce' && (
          <Stack gap={8}>
            {/* Commerce Cards */}
            <Section title="Consolidated Commerce Cards">
              <Grid cols={1} md={3} gap={6}>
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 px-1">ProductCard (Consolidated)</h4>
                  <ProductCard 
                    product={dummyProduct} 
                    onWishlistClick={() => addToast('Added to wishlist', 'success')} 
                  />
                </div>
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 px-1">BoutiqueCard (Studio First)</h4>
                  <BoutiqueCard 
                    boutique={dummyBoutique} 
                  />
                </div>
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 px-1">ServiceCard (Urban Company Style)</h4>
                  <ServiceCard 
                    title="Home Tailoring Consultation" 
                    description="Book an expert tailor for personal measurements, fabric checks, and design consultation at your doorstep." 
                    price="₹249" 
                    duration="45 Mins" 
                    onBook={() => addToast('Consultation request initiated', 'info')} 
                  />
                </div>
              </Grid>
            </Section>

            {/* Badges and Skeletons */}
            <Section title="Detailing Badges & Loaders">
              <Grid cols={1} md={2} gap={6}>
                <Card className="p-6 space-y-4">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 border-b pb-2">Detailed Badges</h4>
                  <div className="flex flex-wrap gap-4 items-center">
                    <div>
                      <span className="text-[10px] block text-gray-400 mb-1">Availability</span>
                      <AvailabilityBadge status="low_stock" />
                    </div>
                    <div>
                      <span className="text-[10px] block text-gray-400 mb-1">Discount Offer</span>
                      <DiscountBadge price={1500} originalPrice={3000} />
                    </div>
                    <div>
                      <span className="text-[10px] block text-gray-400 mb-1">Delivery SLA</span>
                      <DeliveryBadge text="Free Express Delivery" />
                    </div>
                  </div>
                </Card>
                <Card className="p-6 space-y-4">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 border-b pb-2">Skeleton Placeholder Blocks</h4>
                  <div className="space-y-3">
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="rect" height="40px" width="100%" />
                    <div className="flex gap-3">
                      <Skeleton variant="circle" width="30px" height="30px" />
                      <Skeleton variant="text" width="40%" />
                    </div>
                  </div>
                </Card>
              </Grid>
            </Section>

            {/* Collections & Lookbooks */}
            <Section title="Collections & Timelines">
              <Grid cols={1} md={2} gap={8}>
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">Collection Lookbook Card</h4>
                  <CollectionCard 
                    name="Summer Couture 2026" 
                    itemsCount="28 Exclusive Items" 
                    image={IMAGES.collections.summer} 
                    onClick={() => addToast('Opening summer lookbook', 'info')} 
                  />
                </div>
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">Order/Service Timeline</h4>
                  <Card className="p-6">
                    <Timeline items={timelineItems} />
                  </Card>
                </div>
              </Grid>
            </Section>
          </Stack>
        )}

        {currentTab === 'overlays' && (
          <Stack gap={8}>
            {/* Modal Triggers */}
            <Section title="Overlays, Triggers & Drawers">
              <Card className="p-6">
                <div className="flex flex-wrap gap-4">
                  <Button variant="primary" onClick={() => setModalOpen(true)}>Open Standard Modal</Button>
                  <Button variant="secondary" onClick={() => setDrawerOpen(true)}>Open Right Drawer</Button>
                  <Button variant="luxury" onClick={() => setBottomSheetOpen(true)}>Open Bottom Sheet</Button>
                  <Button variant="ghost" onClick={() => {
                    setLoadingOverlayOpen(true);
                    setTimeout(() => setLoadingOverlayOpen(false), 2000);
                  }}>Trigger Loading Overlay (2s)</Button>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <Button variant="secondary" size="sm" onClick={() => addToast('Information Banner Triggered', 'info')}>Info Toast</Button>
                  <Button variant="primary" size="sm" onClick={() => addToast('Order placed successfully!', 'success')}>Success Toast</Button>
                  <Button variant="luxury" size="sm" onClick={() => addToast('This action cannot be undone!', 'warning')}>Warning Toast</Button>
                  <Button variant="ghost" size="sm" className="text-red-600" onClick={() => addToast('Connection failed. Re-trying...', 'error')}>Error Toast</Button>
                </div>
              </Card>
            </Section>

            {/* Modal Implementations */}
            <Modal 
              isOpen={modalOpen} 
              onClose={() => setModalOpen(false)} 
              title="Design System Dialog"
            >
              <div className="space-y-4">
                <p className="text-sm text-gray-600 leading-relaxed">
                  This dialog utilizes full focus trapping, keyboard Escape key closing, and custom spring animations for premium visuals.
                </p>
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
                  <Button variant="primary" size="sm" onClick={() => { setModalOpen(false); addToast('Action completed', 'success'); }}>Confirm Action</Button>
                </div>
              </div>
            </Modal>

            <Drawer 
              isOpen={drawerOpen} 
              onClose={() => setDrawerOpen(false)} 
              title="Studio Information"
            >
              <div className="space-y-6">
                <PremiumImage 
                  src={IMAGES.boutiques.interior1} 
                  alt="Studio interior" 
                  aspectRatio="aspect-video"
                  className="rounded-xl"
                />
                <div className="space-y-2">
                  <h5 className="font-serif font-black text-gray-900 text-sm">Services Offered</h5>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Custom blouses, heavy hand-embroidery work, designer lehengas, and digital alterations. All measurements are backed by our fit-guarantee scheme.
                  </p>
                </div>
                <Button variant="primary" className="w-full" onClick={() => setDrawerOpen(false)}>Close Panel</Button>
              </div>
            </Drawer>

            <BottomSheet 
              isOpen={bottomSheetOpen} 
              onClose={() => setBottomSheetOpen(false)} 
              title="Quick Action Sheet"
            >
              <div className="space-y-4 pb-6">
                <p className="text-sm text-gray-600">Select standard size based on saved profiles:</p>
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="secondary" onClick={() => setBottomSheetOpen(false)}>XS (Bust 32)</Button>
                  <Button variant="secondary" onClick={() => setBottomSheetOpen(false)}>S (Bust 34)</Button>
                  <Button variant="secondary" onClick={() => setBottomSheetOpen(false)}>M (Bust 36)</Button>
                </div>
              </div>
            </BottomSheet>

            <LoadingOverlay 
              visible={loadingOverlayOpen} 
              message="Securing luxury inventory details..." 
            />

            {/* Accordion FAQ & Steppers */}
            <Section title="Interactive Steppers & Accordions">
              <Grid cols={1} md={2} gap={8}>
                <Card className="p-6 space-y-4">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 border-b pb-2">Stepper Checklist</h4>
                  <Stepper 
                    steps={['Select Fabrics', 'Submit Measures', 'Confirm Booking']} 
                    activeStep={stepperVal} 
                  />
                  <div className="flex gap-2 pt-4">
                    <Button variant="secondary" size="sm" onClick={() => setStepperVal(v => Math.max(0, v - 1))}>Prev</Button>
                    <Button variant="primary" size="sm" onClick={() => setStepperVal(v => Math.min(2, v + 1))}>Next</Button>
                  </div>
                </Card>
                <Card className="p-6 space-y-4">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 border-b pb-2">Accordion Primitives</h4>
                  <Accordion items={accordionItems} />
                </Card>
              </Grid>
            </Section>
            
            {/* Empty States */}
            <Section title="Illustrative Empty States">
              <Grid cols={1} md={2} gap={6}>
                <div className="space-y-1">
                  <span className="text-xs text-gray-400 block px-1">Cart Empty State</span>
                  <Card className="bg-white">
                    <EmptyState 
                      title="Your Shopping Bag is Empty" 
                      description="Discover the finest handpicked ethnic ethnic couture curated by designers across Jubilee Hills." 
                      actionLabel="Explore Collections" 
                      onAction={() => addToast('Redirecting to categories...', 'info')}
                      icon={ShoppingBag}
                    />
                  </Card>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-gray-400 block px-1">Wishlist Empty State</span>
                  <Card className="bg-white">
                    <EmptyState 
                      title="No Saved Items Yet" 
                      description="Create a custom wishlist of outfits you love and stitch matching blouses on demand." 
                      actionLabel="Browse Products" 
                      onAction={() => addToast('Redirecting to products...', 'info')}
                      icon={Heart}
                    />
                  </Card>
                </div>
              </Grid>
            </Section>
          </Stack>
        )}
      </Container>
    </div>
  );
}
