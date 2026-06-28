import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import BottomSheet from '../ui/BottomSheet';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Checkbox from '../ui/Checkbox';
import Button from '../ui/Button';

const INITIAL = {
  fullName: '', phone: '', addressLine1: '', addressLine2: '',
  city: '', state: '', pincode: '', landmark: '', isDefault: false,
};

const INDIAN_MOBILE = /^[6-9]\d{9}$/;
const PINCODE = /^\d{6}$/;

const STATE_OPTIONS = [
  { value: 'Andhra Pradesh', label: 'Andhra Pradesh' },
  { value: 'Telangana', label: 'Telangana' },
  { value: 'Karnataka', label: 'Karnataka' },
  { value: 'Tamil Nadu', label: 'Tamil Nadu' },
  { value: 'Maharashtra', label: 'Maharashtra' },
  { value: 'Delhi', label: 'Delhi' },
  { value: 'Gujarat', label: 'Gujarat' },
  { value: 'West Bengal', label: 'West Bengal' },
];

export default function AddressFormModal({ visible, onClose, onSave, address, saving }) {
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const isEdit = !!address;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [prevAddress, setPrevAddress] = useState(null);
  const [prevVisible, setPrevVisible] = useState(false);

  if (address !== prevAddress || visible !== prevVisible) {
    setPrevAddress(address);
    setPrevVisible(visible);
    if (address) {
      setForm({
        fullName: address.fullName || '',
        phone: address.phone || '',
        addressLine1: address.addressLine1 || '',
        addressLine2: address.addressLine2 || '',
        city: address.city || '',
        state: address.state || '',
        pincode: address.pincode || '',
        landmark: address.landmark || '',
        isDefault: address.isDefault || false,
      });
    } else {
      setForm(INITIAL);
    }
    setErrors({});
  }

  const set = (key, value) => setForm(p => ({ ...p, [key]: value }));

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = 'Full name is required';
    if (!form.phone.trim()) errs.phone = 'Phone is required';
    else if (!INDIAN_MOBILE.test(form.phone.trim())) errs.phone = 'Enter a valid 10-digit mobile number';
    if (!form.addressLine1.trim()) errs.addressLine1 = 'Address is required';
    if (!form.city.trim()) errs.city = 'City is required';
    if (!form.state.trim()) errs.state = 'State is required';
    if (!form.pincode.trim()) errs.pincode = 'Pincode is required';
    else if (!PINCODE.test(form.pincode.trim())) errs.pincode = 'Enter a 6-digit pincode';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = { ...form };
    if (!payload.landmark?.trim()) delete payload.landmark;
    await onSave(payload);
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4 mt-2">
      <Input
        label="Full Name"
        value={form.fullName}
        onChange={e => set('fullName', e.target.value)}
        error={errors.fullName}
        required
      />
      <Input
        label="Phone"
        type="tel"
        value={form.phone}
        onChange={e => set('phone', e.target.value)}
        error={errors.phone}
        placeholder="10-digit mobile number"
        required
      />
      <Input
        label="Address Line 1"
        value={form.addressLine1}
        onChange={e => set('addressLine1', e.target.value)}
        error={errors.addressLine1}
        required
      />
      <Input
        label="Address Line 2 (Optional)"
        value={form.addressLine2}
        onChange={e => set('addressLine2', e.target.value)}
      />
      
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="City"
          value={form.city}
          onChange={e => set('city', e.target.value)}
          error={errors.city}
          required
        />
        <Select
          label="State"
          value={form.state}
          onChange={e => set('state', e.target.value)}
          error={errors.state}
          options={STATE_OPTIONS}
          placeholder="Select State"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Pincode"
          value={form.pincode}
          onChange={e => set('pincode', e.target.value)}
          error={errors.pincode}
          placeholder="6-digit pincode"
          required
        />
        <Input
          label="Landmark (Optional)"
          value={form.landmark}
          onChange={e => set('landmark', e.target.value)}
        />
      </div>

      <Checkbox
        label="Set as default address"
        checked={form.isDefault}
        onChange={e => set('isDefault', e.target.checked)}
        className="py-1"
      />

      <Button
        type="submit"
        isLoading={saving}
        className="w-full mt-4 py-4"
      >
        {isEdit ? 'Update Address' : 'Save Address'}
      </Button>
    </form>
  );

  const titleText = isEdit ? 'Edit Address' : 'Add Address';

  if (isMobile) {
    return (
      <BottomSheet isOpen={visible} onClose={onClose} title={titleText}>
        {formContent}
      </BottomSheet>
    );
  }

  return (
    <Modal isOpen={visible} onClose={onClose} title={titleText}>
      {formContent}
    </Modal>
  );
}
